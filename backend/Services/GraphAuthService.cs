using Azure.Core;
using Microsoft.Graph;

namespace HotelBookingAPI.Services
{
    public interface IGraphAuthService
    {
        Task<GraphServiceClient> GetAuthenticatedGraphClient(string accessToken);
    }

    public class GraphAuthService : IGraphAuthService
    {
        private readonly ILogger<GraphAuthService> _logger;

        public GraphAuthService(ILogger<GraphAuthService> logger)
        {
            _logger = logger;
        }

        public async Task<GraphServiceClient> GetAuthenticatedGraphClient(string accessToken)
        {
            try
            {
                if (string.IsNullOrEmpty(accessToken))
                {
                    throw new InvalidOperationException("Access token is required. User must be authenticated from the frontend.");
                }

                _logger.LogInformation("Creating Graph client with delegated token from frontend");

                // Use the token provided by the frontend
                var tokenCredential = new StaticTokenCredential(new AccessToken(accessToken, DateTimeOffset.UtcNow.AddHours(1)));
                
                var graphClient = new GraphServiceClient(tokenCredential);

                _logger.LogInformation("Graph client authenticated with frontend token");
                return await Task.FromResult(graphClient);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating Graph client: {ex.Message}");
                _logger.LogError($"Exception type: {ex.GetType().Name}");
                throw;
            }
        }
    }

    // Simple token credential that uses a static token
    public class StaticTokenCredential : TokenCredential
    {
        private readonly AccessToken _token;

        public StaticTokenCredential(AccessToken token)
        {
            _token = token;
        }

        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            return _token;
        }

        public override ValueTask<AccessToken> GetTokenAsync(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            return new ValueTask<AccessToken>(_token);
        }
    }
}
