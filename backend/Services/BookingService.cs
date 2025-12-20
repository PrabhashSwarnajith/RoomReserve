using HotelBookingAPI.Models;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace HotelBookingAPI.Services
{
    public interface IBookingService
    {
        Task<CheckAvailabilityResponse> CheckAvailabilityAsync(CheckAvailabilityRequest request, string accessToken);
        Task<CreateBookingResponse> CreateBookingAsync(CreateBookingRequest request, string accessToken);
        Task<List<RoomType>> GetRoomTypesAsync(string accessToken);
        Task<List<BookingSummary>> GetBookingsAsync(string accessToken);
        Task<CreateBookingResponse?> GetBookingByIdAsync(string bookingId, string accessToken);
        Task<CreateBookingResponse?> UpdateBookingAsync(UpdateBookingRequest request, string accessToken);
        Task<bool> DeleteBookingAsync(string bookingId, string accessToken);
    }

    public class BookingService : IBookingService
    {
        private readonly IGraphAuthService _graphAuthService;
        private readonly IEmailService _emailService;
        private readonly ILogger<BookingService> _logger;
        private readonly IConfiguration _configuration;

        public BookingService(
            IGraphAuthService graphAuthService,
            IEmailService emailService,
            ILogger<BookingService> logger,
            IConfiguration configuration)
        {
            _graphAuthService = graphAuthService;
            _emailService = emailService;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<List<RoomType>> GetRoomTypesAsync(string accessToken)
        {
            try
            {
                var graphClient = await _graphAuthService.GetAuthenticatedGraphClient(accessToken);
                var businessId = _configuration["Bookings:BusinessId"];

                if (string.IsNullOrEmpty(businessId))
                {
                    _logger.LogWarning("Booking Business ID not configured");
                    return new List<RoomType>();
                }

                _logger.LogInformation($"Fetching room services from Business: {businessId}");

                var services = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
                    .Services
                    .GetAsync();

                var roomTypes = new List<RoomType>();

                if (services?.Value != null && services.Value.Count > 0)
                {
                    foreach (var service in services.Value)
                    {
                        roomTypes.Add(new RoomType
                        {
                            Id = service.Id ?? Guid.NewGuid().ToString(),
                            Name = service.DisplayName ?? "Room",
                            Description = service.Description ?? string.Empty,
                            Price = service.DefaultPrice.HasValue ? Convert.ToDecimal(service.DefaultPrice.Value) : 0m,
                            Capacity = 2,
                            Amenities = new List<string> { "WiFi", "TV", "Air Conditioning" }
                        });
                    }

                    _logger.LogInformation($"Retrieved {roomTypes.Count} rooms from Microsoft Graph");
                }

                return roomTypes;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching rooms: {ex.Message}");
                
                return new List<RoomType>();
            }
        }

        public async Task<CheckAvailabilityResponse> CheckAvailabilityAsync(CheckAvailabilityRequest request, string accessToken)
        {
            try
            {
                _logger.LogInformation($"Checking availability for room {request.RoomType} on {request.CheckInDate:yyyy-MM-dd}");

                var graphClient = await _graphAuthService.GetAuthenticatedGraphClient(accessToken);
                var businessId = _configuration["Bookings:BusinessId"];

                if (string.IsNullOrEmpty(businessId))
                {
                    return new CheckAvailabilityResponse
                    {
                        Available = true,
                        Message = "Room available for booking",
                        RoomType = request.RoomType,
                        CheckInDate = request.CheckInDate,
                        Price = 100m
                    };
                }

                var encodedBusinessId = System.Web.HttpUtility.UrlEncode(businessId);

                var service = await graphClient
                    .Solutions
                    .BookingBusinesses[encodedBusinessId]
                    .Services[request.RoomType]
                    .GetAsync();

                if (service == null)
                {
                    return new CheckAvailabilityResponse
                    {
                        Available = false,
                        Message = "Room not found",
                        RoomType = request.RoomType,
                        CheckInDate = request.CheckInDate
                    };
                }

                // Check for existing appointments (bookings)
                bool isAvailable = await CheckIfRoomAvailableAsync(graphClient, businessId, request.RoomType, request.CheckInDate, request.DurationNights);

                return new CheckAvailabilityResponse
                {
                    Available = isAvailable,
                    Message = isAvailable ? "Room is available" : "Room is already booked",
                    RoomType = request.RoomType,
                    CheckInDate = request.CheckInDate,
                    Price = service.DefaultPrice.HasValue ? Convert.ToDecimal(service.DefaultPrice.Value) : 0m
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Availability check error: {ex.Message}");
                _logger.LogError($"Exception type: {ex.GetType().Name}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    _logger.LogError($"Inner exception: {ex.InnerException.Message}");
                    _logger.LogError($"Inner exception type: {ex.InnerException.GetType().Name}");
                }
                // Fail safe - assume available if check fails
                return new CheckAvailabilityResponse
                {
                    Available = true,
                    Message = "Room available for booking",
                    RoomType = request.RoomType,
                    CheckInDate = request.CheckInDate,
                    Price = 100m
                };
            }
        }

        public async Task<CreateBookingResponse> CreateBookingAsync(CreateBookingRequest request, string accessToken)
        {
            try
            {
                _logger.LogInformation($"Creating booking for {request.CustomerInfo.FirstName} {request.CustomerInfo.LastName}");

                var graphClient = await _graphAuthService.GetAuthenticatedGraphClient(accessToken);
                var businessId = _configuration["Bookings:BusinessId"];
                var staffId = _configuration["Bookings:StaffId"];
                var encodedBusinessId = System.Web.HttpUtility.UrlEncode(businessId);

                if (string.IsNullOrEmpty(businessId))
                {
                    throw new InvalidOperationException("Booking Business ID not configured");
                }

                _logger.LogInformation($"Creating booking - Business ID: {businessId} (encoded: {encodedBusinessId})");

                decimal price = 100m;
                
                if (!string.IsNullOrEmpty(staffId) && !string.IsNullOrEmpty(businessId))
                {
                    try
                    {
                        // Get service details for pricing
                        var service = await graphClient
                            .Solutions
                            .BookingBusinesses[encodedBusinessId]
                            .Services[request.RoomType]
                            .GetAsync();

                        if (service?.DefaultPrice.HasValue == true)
                        {
                            price = Convert.ToDecimal(service.DefaultPrice.Value);
                        }

                        // Create the appointment in Graph
                        var appointment = new BookingAppointment
                        {
                            ServiceId = request.RoomType,
                            StaffMemberIds = new List<string> { staffId },
                            Customers = new List<BookingCustomerInformationBase>
                            {
                                new BookingCustomerInformation
                                {
                                    EmailAddress = request.CustomerInfo.Email,
                                    Name = $"{request.CustomerInfo.FirstName} {request.CustomerInfo.LastName}",
                                    Phone = request.CustomerInfo.Phone
                                }
                            },
                            StartDateTime = new DateTimeTimeZone
                            {
                                DateTime = request.CheckInDate.ToString("yyyy-MM-ddT00:00:00"),
                                TimeZone = "UTC"
                            },
                            EndDateTime = new DateTimeTimeZone
                            {
                                DateTime = request.CheckInDate.AddDays(request.DurationNights).ToString("yyyy-MM-ddT00:00:00"),
                                TimeZone = "UTC"
                            },
                            AdditionalData = !string.IsNullOrEmpty(request.CustomerInfo.Notes) 
                                ? new Dictionary<string, object> { { "notes", request.CustomerInfo.Notes } }
                                : null,
                            IsLocationOnline = false
                        };

                        // POST /solutions/bookingBusinesses/{businessId}/appointments
                        var createdAppointment = await graphClient
                            .Solutions
                            .BookingBusinesses[encodedBusinessId]
                            .Appointments
                            .PostAsync(appointment);

                        var response = new CreateBookingResponse
                        {
                            BookingId = createdAppointment?.Id ?? GenerateBookingId(),
                            RoomType = request.RoomType,
                            CheckInDate = request.CheckInDate,
                            DurationNights = request.DurationNights,
                            CustomerInfo = request.CustomerInfo,
                            TotalPrice = price * request.DurationNights,
                            Status = "Confirmed",
                            CreatedAt = DateTime.UtcNow
                        };

                        // Send confirmation email
                        _ = _emailService.SendBookingConfirmationAsync(response);

                        _logger.LogInformation($"Booking created: {response.BookingId}");
                        return response;
                    }
                    catch (Exception graphEx)
                    {
                        _logger.LogWarning($"Graph API booking failed: {graphEx.Message}, creating local booking");
                    }
                }

                // Fallback: Create local booking if Graph fails
                var localResponse = new CreateBookingResponse
                {
                    BookingId = GenerateBookingId(),
                    RoomType = request.RoomType,
                    CheckInDate = request.CheckInDate,
                    DurationNights = request.DurationNights,
                    CustomerInfo = request.CustomerInfo,
                    TotalPrice = price * request.DurationNights,
                    Status = "Confirmed",
                    CreatedAt = DateTime.UtcNow
                };

                // Send confirmation email
                _ = _emailService.SendBookingConfirmationAsync(localResponse);

                _logger.LogInformation($"Local booking created: {localResponse.BookingId}");
                return localResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Booking creation error: {ex.Message}");
                _logger.LogError($"Exception type: {ex.GetType().Name}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    _logger.LogError($"Inner exception: {ex.InnerException.Message}");
                    _logger.LogError($"Inner exception type: {ex.InnerException.GetType().Name}");
                }
                throw;
            }
        }

        public async Task<List<BookingSummary>> GetBookingsAsync(string accessToken)
        {
            var bookings = new List<BookingSummary>();
            try
            {
                var graphClient = await _graphAuthService.GetAuthenticatedGraphClient(accessToken);
                var businessId = _configuration["Bookings:BusinessId"];

                if (string.IsNullOrEmpty(businessId))
                {
                    _logger.LogWarning("Booking Business ID not configured. Cannot fetch bookings.");
                    return bookings;
                }

                var encodedBusinessId = System.Web.HttpUtility.UrlEncode(businessId);
                var appointments = await graphClient
                    .Solutions
                    .BookingBusinesses[encodedBusinessId]
                    .Appointments
                    .GetAsync();

                if (appointments?.Value == null)
                {
                    return bookings;
                }

                foreach (var appointment in appointments.Value)
                {
                    var mapped = MapAppointmentToResponse(appointment);
                    if (mapped != null)
                    {
                        bookings.Add(new BookingSummary
                        {
                            BookingId = mapped.BookingId,
                            RoomType = mapped.RoomType,
                            RoomName = appointment.ServiceName ?? mapped.RoomType,
                            CheckInDate = mapped.CheckInDate,
                            DurationNights = mapped.DurationNights,
                            TotalPrice = mapped.TotalPrice,
                            Status = mapped.Status,
                            CustomerInfo = mapped.CustomerInfo
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving bookings: {ex.Message}");
                _logger.LogError(ex, "Full exception when retrieving bookings from Graph");
            }

            return bookings.OrderByDescending(b => b.CheckInDate).ToList();
        }

        public async Task<CreateBookingResponse?> GetBookingByIdAsync(string bookingId, string accessToken)
        {
            try
            {
                var graphClient = await _graphAuthService.GetAuthenticatedGraphClient(accessToken);
                var businessId = _configuration["Bookings:BusinessId"];
                if (string.IsNullOrEmpty(businessId))
                {
                    return null;
                }

                var encodedBusinessId = System.Web.HttpUtility.UrlEncode(businessId);
                var appointment = await graphClient
                    .Solutions
                    .BookingBusinesses[encodedBusinessId]
                    .Appointments[bookingId]
                    .GetAsync();

                return MapAppointmentToResponse(appointment);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving booking {bookingId}: {ex.Message}");
                return null;
            }
        }

        public async Task<CreateBookingResponse?> UpdateBookingAsync(UpdateBookingRequest request, string accessToken)
        {
            try
            {
                if (string.IsNullOrEmpty(request.BookingId))
                {
                    throw new ArgumentException("BookingId is required", nameof(request.BookingId));
                }

                var graphClient = await _graphAuthService.GetAuthenticatedGraphClient(accessToken);
                var businessId = _configuration["Bookings:BusinessId"];
                if (string.IsNullOrEmpty(businessId))
                {
                    throw new InvalidOperationException("Booking Business ID not configured");
                }

                var encodedBusinessId = System.Web.HttpUtility.UrlEncode(businessId);
                var updatePayload = new BookingAppointment
                {
                    ServiceId = request.RoomType,
                    Customers = new List<BookingCustomerInformationBase>
                    {
                        new BookingCustomerInformation
                        {
                            EmailAddress = request.CustomerInfo.Email,
                            Name = $"{request.CustomerInfo.FirstName} {request.CustomerInfo.LastName}",
                            Phone = request.CustomerInfo.Phone
                        }
                    },
                    StartDateTime = new DateTimeTimeZone
                    {
                        DateTime = request.CheckInDate.ToString("yyyy-MM-ddT00:00:00"),
                        TimeZone = "UTC"
                    },
                    EndDateTime = new DateTimeTimeZone
                    {
                        DateTime = request.CheckInDate.AddDays(request.DurationNights).ToString("yyyy-MM-ddT00:00:00"),
                        TimeZone = "UTC"
                    }
                };

                await graphClient
                    .Solutions
                    .BookingBusinesses[encodedBusinessId]
                    .Appointments[request.BookingId]
                    .PatchAsync(updatePayload);

                var updated = await graphClient
                    .Solutions
                    .BookingBusinesses[encodedBusinessId]
                    .Appointments[request.BookingId]
                    .GetAsync();

                return MapAppointmentToResponse(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Booking update error: {ex.Message}");
                _logger.LogError(ex, "Full exception when updating booking");
                throw;
            }
        }

        public async Task<bool> DeleteBookingAsync(string bookingId, string accessToken)
        {
            try
            {
                var graphClient = await _graphAuthService.GetAuthenticatedGraphClient(accessToken);
                var businessId = _configuration["Bookings:BusinessId"];
                if (string.IsNullOrEmpty(businessId))
                {
                    throw new InvalidOperationException("Booking Business ID not configured");
                }

                var encodedBusinessId = System.Web.HttpUtility.UrlEncode(businessId);
                await graphClient
                    .Solutions
                    .BookingBusinesses[encodedBusinessId]
                    .Appointments[bookingId]
                    .DeleteAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting booking {bookingId}: {ex.Message}");
                return false;
            }
        }

        private async Task<bool> CheckIfRoomAvailableAsync(GraphServiceClient graphClient, string businessId, string serviceId, DateTime checkInDate, int durationNights)
        {
            try
            {
                var checkOutDate = checkInDate.AddDays(durationNights);
                var encodedBusinessId = System.Web.HttpUtility.UrlEncode(businessId);

                // GET /solutions/bookingBusinesses/{businessId}/appointments
                var appointments = await graphClient
                    .Solutions
                    .BookingBusinesses[encodedBusinessId]
                    .Appointments
                    .GetAsync();

                if (appointments?.Value == null || appointments.Value.Count == 0)
                {
                    return true; // No bookings, room is available
                }

                // Check for conflicts
                foreach (var apt in appointments.Value)
                {
                    if (apt.ServiceId != serviceId)
                        continue;

                    if (apt.StartDateTime?.DateTime != null && apt.EndDateTime?.DateTime != null)
                    {
                        if (DateTime.Parse(apt.StartDateTime.DateTime) < checkOutDate && 
                            DateTime.Parse(apt.EndDateTime.DateTime) > checkInDate)
                        {
                            return false; // Conflict found
                        }
                    }
                }

                return true; // No conflicts
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Availability check failed, assuming available: {ex.Message}");
                _logger.LogWarning($"Exception type: {ex.GetType().Name}");
                _logger.LogWarning($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    _logger.LogWarning($"Inner exception: {ex.InnerException.Message}");
                    _logger.LogWarning($"Inner exception type: {ex.InnerException.GetType().Name}");
                }
                return true; // Fail safe
            }
        }

        private string GenerateBookingId()
        {
            return $"BK-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        }

        private CreateBookingResponse? MapAppointmentToResponse(BookingAppointment? appointment)
        {
            if (appointment == null)
            {
                return null;
            }

            var customer = appointment.Customers?
                .OfType<BookingCustomerInformation>()
                .FirstOrDefault();

            var checkIn = DateTime.TryParse(appointment.StartDateTime?.DateTime, out var parsedStart)
                ? parsedStart
                : DateTime.UtcNow;

            var checkOut = DateTime.TryParse(appointment.EndDateTime?.DateTime, out var parsedEnd)
                ? parsedEnd
                : checkIn.AddDays(1);

            var duration = Math.Max(1, (int)Math.Round((checkOut - checkIn).TotalDays));

            decimal price = 0m;
            if (appointment.Price.HasValue)
            {
                price = Convert.ToDecimal(appointment.Price.Value);
            }

            var status = "Confirmed";
            if (appointment.AdditionalData != null && appointment.AdditionalData.TryGetValue("status", out var statusObj))
            {
                status = statusObj?.ToString() ?? status;
            }

            var createdAt = checkIn;
            if (appointment.AdditionalData != null && appointment.AdditionalData.TryGetValue("createdDateTime", out var createdRaw))
            {
                if (DateTime.TryParse(createdRaw?.ToString(), out var parsedCreated))
                {
                    createdAt = parsedCreated;
                }
            }

            var nameParts = customer?.Name?.Split(' ', StringSplitOptions.RemoveEmptyEntries) ?? Array.Empty<string>();
            var firstName = nameParts.FirstOrDefault() ?? string.Empty;
            var lastName = nameParts.Length > 1 ? string.Join(' ', nameParts.Skip(1)) : string.Empty;

            return new CreateBookingResponse
            {
                BookingId = appointment.Id ?? string.Empty,
                RoomType = appointment.ServiceId ?? string.Empty,
                CheckInDate = checkIn,
                DurationNights = duration,
                CustomerInfo = new CustomerInfo
                {
                    Email = customer?.EmailAddress ?? string.Empty,
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = customer?.Phone ?? string.Empty,
                    Notes = customer?.AdditionalData != null && customer.AdditionalData.TryGetValue("notes", out var notesObj)
                        ? notesObj?.ToString() ?? string.Empty
                        : string.Empty
                },
                TotalPrice = price,
                Status = status,
                CreatedAt = createdAt
            };
        }
    }
}
