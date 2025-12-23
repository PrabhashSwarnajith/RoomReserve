using Microsoft.Graph;
using Microsoft.Kiota.Abstractions;
using Microsoft.Kiota.Abstractions.Authentication;

namespace HotelBookingAPI.Services
{
    public interface IServiceAccountDelegationService
    {
        Task<GraphServiceClient> GetAuthenticatedGraphClientAsync();
        Task<string> GetServiceAccountAccessTokenAsync();
    }

    public class ServiceAccountDelegationService : IServiceAccountDelegationService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ServiceAccountDelegationService> _logger;
        private readonly HttpClient _httpClient;
        private string? _cachedAccessToken;
        private DateTime _tokenExpiry = DateTime.MinValue;

        public ServiceAccountDelegationService(
            IConfiguration configuration,
            ILogger<ServiceAccountDelegationService> logger,
            HttpClient httpClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<string> GetServiceAccountAccessTokenAsync()
        {
            try
            {
                // Return cached token if still valid
                if (!string.IsNullOrEmpty(_cachedAccessToken) && DateTime.UtcNow < _tokenExpiry)
                {
                    _logger.LogInformation("Using cached service account token");
                    return _cachedAccessToken;
                }

                var tenantId = _configuration["AzureAd:TenantId"];
                var clientId = _configuration["AzureAd:ClientId"];
                var clientSecret = _configuration["AzureAd:ClientSecret"];
                var serviceAccountEmail = _configuration["AzureAd:ServiceAccountEmail"];
                var serviceAccountPassword = _configuration["AzureAd:ServiceAccountPassword"];

                if (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(clientId) || 
                    string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(serviceAccountEmail))
                {
                    throw new InvalidOperationException("Azure AD credentials are not properly configured");
                }

                _logger.LogInformation($"Acquiring token for service account: {serviceAccountEmail}");

                // Step 1: Acquire token on behalf of service account using Resource Owner Password Flow
                var tokenUrl = $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token";

                var tokenRequest = new Dictionary<string, string>
                {
                    { "grant_type", "password" },
                    { "client_id", clientId },
                    { "client_secret", clientSecret },
                    { "scope", "https://graph.microsoft.com/.default" },
                    { "username", serviceAccountEmail },
                    { "password", serviceAccountPassword ?? string.Empty }
                };

                _logger.LogInformation($"Requesting token from {tokenUrl}");

                var response = await _httpClient.PostAsync(tokenUrl, new FormUrlEncodedContent(tokenRequest));

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Token acquisition failed: {response.StatusCode} - {errorContent}");
                    throw new InvalidOperationException($"Failed to acquire token: {response.ReasonPhrase}");
                }

                var content = await response.Content.ReadAsStringAsync();
                var json = System.Text.Json.JsonDocument.Parse(content);

                if (!json.RootElement.TryGetProperty("access_token", out var tokenElement) ||
                    !json.RootElement.TryGetProperty("expires_in", out var expiresElement))
                {
                    throw new InvalidOperationException("Token response missing required fields");
                }

                _cachedAccessToken = tokenElement.GetString();
                var expiresInSeconds = expiresElement.GetInt32();
                
                // Set expiry to 5 minutes before actual expiry for safety margin
                _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresInSeconds - 300);

                _logger.LogInformation($"Service account token acquired successfully. Expires in: {expiresInSeconds} seconds");

                return _cachedAccessToken ?? throw new InvalidOperationException("Token string was null");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error acquiring service account token: {ex.Message}");
                throw;
            }
        }

        public async Task<GraphServiceClient> GetAuthenticatedGraphClientAsync()
        {
            try
            {
                var accessToken = await GetServiceAccountAccessTokenAsync();

                _logger.LogInformation("Creating Graph client with delegated token (impersonating service account)");

                var tokenCredential = new DelegatedTokenCredential(accessToken);
                var graphClient = new GraphServiceClient(tokenCredential);

                _logger.LogInformation("Graph client created successfully with delegated permissions");

                return graphClient;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating Graph client: {ex.Message}");
                throw;
            }
        }
    }

    /// <summary>
    /// Custom token credential for delegated permissions (Bearer token authentication)
    /// </summary>
    public class DelegatedTokenCredential : IAuthenticationProvider
    {
        private readonly string _accessToken;

        public DelegatedTokenCredential(string accessToken)
        {
            _accessToken = accessToken;
        }

        public Task AuthenticateRequestAsync(
            RequestInformation request,
            Dictionary<string, object>? additionalAuthenticationContextInformation = null,
            CancellationToken cancellationToken = default)
        {
            if (request != null)
            {
                request.Headers.Add("Authorization", $"Bearer {_accessToken}");
            }
            return Task.CompletedTask;
        }
    }
}
