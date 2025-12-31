using HotelBookingAPI.Models;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace HotelBookingAPI.Services
{
    /// <summary>
    /// Interface for hotel booking operations
    /// </summary>
    public interface IBookingService
    {
        Task<List<RoomType>> GetRoomTypesAsync(string accessToken);
        Task<CalendarAvailabilityResponse> GetCalendarAvailabilityAsync(string roomType, int months, string accessToken);
        Task<CreateBookingResponse> CreateBookingAsync(CreateBookingRequest request, string accessToken);
        Task<List<BookingSummary>> GetBookingsAsync(string accessToken);
        Task<CreateBookingResponse?> GetBookingByIdAsync(string bookingId, string accessToken);
        Task<CreateBookingResponse?> UpdateBookingAsync(UpdateBookingRequest request, string accessToken);
        Task<bool> DeleteBookingAsync(string bookingId, string accessToken);
    }

    /// <summary>
    /// Service for managing hotel bookings using Microsoft Graph API
    /// </summary>
    public class BookingService : IBookingService
    {
        private readonly IServiceAccountDelegationService _delegationService;
        private readonly ILogger<BookingService> _logger;
        private readonly IConfiguration _configuration;

        public BookingService(
            IServiceAccountDelegationService delegationService,
            ILogger<BookingService> logger,
            IConfiguration configuration)
        {
            _delegationService = delegationService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Get all available room types
        /// </summary>
        public async Task<List<RoomType>> GetRoomTypesAsync(string accessToken)
        {
            try
            {
                var graphClient = await _delegationService.GetAuthenticatedGraphClientAsync();
                var businessId = _configuration["Bookings:BusinessId"];

                if (string.IsNullOrEmpty(businessId))
                {
                    _logger.LogWarning("Booking Business ID not configured");
                    return new List<RoomType>();
                }

                var services = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
                    .Services
                    .GetAsync();

                var roomTypes = new List<RoomType>();

                if (services?.Value != null)
                {
                    foreach (var service in services.Value)
                    {
                        roomTypes.Add(new RoomType
                        {
                            Id = service.Id ?? Guid.NewGuid().ToString(),
                            Name = service.DisplayName ?? "Room",
                            Description = service.Description ?? string.Empty,
                            Price = service.DefaultPrice.HasValue ? Convert.ToDecimal(service.DefaultPrice.Value) : 100m,
                            Capacity = 2,
                            Amenities = new List<string> { "WiFi", "TV", "AC" }
                        });
                    }
                }

                return roomTypes;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching rooms: {ex.Message}");
                return new List<RoomType>();
            }
        }

        /// <summary>
        /// Get calendar availability for a room type
        /// </summary>
        public async Task<CalendarAvailabilityResponse> GetCalendarAvailabilityAsync(string roomType, int months, string accessToken)
        {
            try
            {
                var graphClient = await _delegationService.GetAuthenticatedGraphClientAsync();
                var businessId = _configuration["Bookings:BusinessId"];

                if (string.IsNullOrEmpty(businessId))
                {
                    _logger.LogWarning("Booking Business ID not configured");
                    return new CalendarAvailabilityResponse { RoomType = roomType };
                }

                var response = new CalendarAvailabilityResponse { RoomType = roomType };
                var today = DateTime.Today;
                var endDate = today.AddMonths(months);

                // Get all appointments for this service
                var appointments = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
                    .Appointments
                    .GetAsync(requestConfig =>
                    {
                        requestConfig.QueryParameters.Filter = $"serviceId eq '{roomType}'";
                    });

                var bookedDates = new HashSet<string>();
                if (appointments?.Value != null)
                {
                    foreach (var appointment in appointments.Value)
                    {
                        try
                        {
                            if (appointment.StartDateTime != null && appointment.EndDateTime != null)
                            {
                                // Parse dates in ISO format with proper timezone handling
                                var startDateStr = appointment.StartDateTime.DateTime;
                                var endDateStr = appointment.EndDateTime.DateTime;

                                if (DateTime.TryParse(startDateStr, System.Globalization.CultureInfo.InvariantCulture, 
                                    System.Globalization.DateTimeStyles.RoundtripKind, out var startDate) &&
                                    DateTime.TryParse(endDateStr, System.Globalization.CultureInfo.InvariantCulture, 
                                    System.Globalization.DateTimeStyles.RoundtripKind, out var appointmentEndDate))
                                {
                                    // Convert to UTC and get date only
                                    startDate = startDate.ToUniversalTime().Date;
                                    appointmentEndDate = appointmentEndDate.ToUniversalTime().Date;

                                    // Mark all dates from start to end (checkout) as booked
                                    for (var date = startDate; date < appointmentEndDate; date = date.AddDays(1))
                                    {
                                        bookedDates.Add(date.ToString("yyyy-MM-dd"));
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"Error processing appointment: {ex.Message}");
                        }
                    }
                }

                // Get room pricing
                var service = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
                    .Services[roomType]
                    .GetAsync();

                var price = service?.DefaultPrice.HasValue == true 
                    ? Convert.ToDecimal(service.DefaultPrice.Value) 
                    : 100m;

                // Generate calendar
                for (var date = today; date <= endDate; date = date.AddDays(1))
                {
                    response.Days.Add(new CalendarDayDto
                    {
                        Date = date,
                        IsAvailable = !bookedDates.Contains(date.ToString("yyyy-MM-dd")),
                        Price = price
                    });
                }

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching calendar: {ex.Message}");
                return new CalendarAvailabilityResponse { RoomType = roomType };
            }
        }

        /// <summary>
        /// Create a new booking
        /// </summary>
        public async Task<CreateBookingResponse> CreateBookingAsync(CreateBookingRequest request, string accessToken)
        {
            try
            {
                var graphClient = await _delegationService.GetAuthenticatedGraphClientAsync();
                var businessId = _configuration["Bookings:BusinessId"];
                var staffId = _configuration["Bookings:StaffId"];

                if (string.IsNullOrEmpty(businessId))
                {
                    throw new InvalidOperationException("Booking Business ID not configured");
                }

                // Get service pricing
                var service = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
                    .Services[request.RoomType]
                    .GetAsync();

                var price = service?.DefaultPrice.HasValue == true 
                    ? Convert.ToDecimal(service.DefaultPrice.Value) 
                    : 100m;

                // Create appointment
                var appointmentStart = request.CheckInDate;
                var appointmentEnd = request.CheckInDate.AddDays(request.DurationNights);

                var appointment = new BookingAppointment
                {
                    ServiceId = request.RoomType,
                    StartDateTime = new DateTimeTimeZone { DateTime = appointmentStart.ToString("O"), TimeZone = "UTC" },
                    EndDateTime = new DateTimeTimeZone { DateTime = appointmentEnd.ToString("O"), TimeZone = "UTC" },
                    IsLocationOnline = false,
                    Customers = new List<BookingCustomerInformationBase>
                    {
                        new BookingCustomerInformation
                        {
                            Name = $"{request.CustomerInfo.FirstName} {request.CustomerInfo.LastName}",
                            EmailAddress = request.CustomerInfo.Email,
                            Phone = request.CustomerInfo.Phone,
                            AdditionalData = new Dictionary<string, object>
                            {
                                { "notes", request.CustomerInfo.Notes ?? string.Empty }
                            }
                        }
                    }
                };

                if (!string.IsNullOrEmpty(staffId))
                {
                    appointment.StaffMemberIds = new List<string> { staffId };
                }

                var createdAppointment = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
                    .Appointments
                    .PostAsync(appointment);

                var bookingId = createdAppointment?.Id ?? GenerateBookingId();
                var totalPrice = price * request.DurationNights;

                return new CreateBookingResponse
                {
                    BookingId = bookingId,
                    RoomType = request.RoomType,
                    CheckInDate = request.CheckInDate,
                    DurationNights = request.DurationNights,
                    CustomerInfo = request.CustomerInfo,
                    TotalPrice = totalPrice,
                    Status = "Confirmed",
                    CreatedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating booking: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Get all bookings
        /// </summary>
        public async Task<List<BookingSummary>> GetBookingsAsync(string accessToken)
        {
            var bookings = new List<BookingSummary>();
            try
            {
                var graphClient = await _delegationService.GetAuthenticatedGraphClientAsync();
                var businessId = _configuration["Bookings:BusinessId"];

                if (string.IsNullOrEmpty(businessId))
                {
                    _logger.LogWarning("Booking Business ID not configured");
                    return bookings;
                }

                var appointments = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
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
            }

            return bookings.OrderByDescending(b => b.CheckInDate).ToList();
        }

        /// <summary>
        /// Get a single booking by ID
        /// </summary>
        public async Task<CreateBookingResponse?> GetBookingByIdAsync(string bookingId, string accessToken)
        {
            try
            {
                var graphClient = await _delegationService.GetAuthenticatedGraphClientAsync();
                var businessId = _configuration["Bookings:BusinessId"];
                if (string.IsNullOrEmpty(businessId))
                {
                    return null;
                }

                var appointment = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
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

        /// <summary>
        /// Update an existing booking
        /// </summary>
        public async Task<CreateBookingResponse?> UpdateBookingAsync(UpdateBookingRequest request, string accessToken)
        {
            try
            {
                if (string.IsNullOrEmpty(request.BookingId))
                {
                    throw new ArgumentException("BookingId is required", nameof(request.BookingId));
                }

                var graphClient = await _delegationService.GetAuthenticatedGraphClientAsync();
                var businessId = _configuration["Bookings:BusinessId"];
                if (string.IsNullOrEmpty(businessId))
                {
                    throw new InvalidOperationException("Booking Business ID not configured");
                }

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
                        DateTime = request.CheckInDate.ToString("O"),
                        TimeZone = "UTC"
                    },
                    EndDateTime = new DateTimeTimeZone
                    {
                        DateTime = request.CheckInDate.AddDays(request.DurationNights).ToString("O"),
                        TimeZone = "UTC"
                    }
                };

                await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
                    .Appointments[request.BookingId]
                    .PatchAsync(updatePayload);

                var updated = await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
                    .Appointments[request.BookingId]
                    .GetAsync();

                return MapAppointmentToResponse(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Booking update error: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Delete a booking
        /// </summary>
        public async Task<bool> DeleteBookingAsync(string bookingId, string accessToken)
        {
            try
            {
                var graphClient = await _delegationService.GetAuthenticatedGraphClientAsync();
                var businessId = _configuration["Bookings:BusinessId"];
                if (string.IsNullOrEmpty(businessId))
                {
                    throw new InvalidOperationException("Booking Business ID not configured");
                }

                await graphClient
                    .Solutions
                    .BookingBusinesses[businessId]
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

        /// <summary>
        /// Helper: Generate a booking ID
        /// </summary>
        private string GenerateBookingId()
        {
            return $"BK-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        }

        /// <summary>
        /// Helper: Map appointment to booking response
        /// </summary>
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
                Status = "Confirmed",
                CreatedAt = checkIn
            };
        }
    }
}
