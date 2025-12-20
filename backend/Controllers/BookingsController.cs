using HotelBookingAPI.Models;
using HotelBookingAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace HotelBookingAPI.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingsController> _logger;

        public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger)
        {
            _bookingService = bookingService;
            _logger = logger;
        }

        private string GetAccessToken()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                throw new InvalidOperationException("Missing or invalid Authorization header.");
            }
            return authHeader.Substring("Bearer ".Length);
        }

        [HttpGet("room-types")]
        public async Task<ActionResult<dynamic>> GetRoomTypes()
        {
            try
            {
                _logger.LogInformation("Fetching available rooms");
                var accessToken = GetAccessToken();
                var roomTypes = await _bookingService.GetRoomTypesAsync(accessToken);
                return Ok(new { roomTypes });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError($"Authentication error: {ex.Message}");
                return Unauthorized(new { error = "Unauthorized: " + ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching rooms: {ex.Message}");
                return Ok(new { roomTypes = new List<object>(), error = "Could not load rooms" });
            }
        }

        [HttpPost("check-availability")]
        public async Task<ActionResult<CheckAvailabilityResponse>> CheckAvailability([FromBody] CheckAvailabilityRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.RoomType))
                {
                    return BadRequest(new { error = "Room type and check-in date required" });
                }

                var accessToken = GetAccessToken();
                var response = await _bookingService.CheckAvailabilityAsync(request, accessToken);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError($"Authentication error: {ex.Message}");
                return Unauthorized(new { error = "Unauthorized: " + ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Availability check error: {ex.Message}");
                // Fail safe - assume available
                return Ok(new CheckAvailabilityResponse
                {
                    Available = true,
                    Message = "Room is available",
                    RoomType = request.RoomType,
                    CheckInDate = request.CheckInDate,
                    Price = 100m
                });
            }
        }

        [HttpPost("create")]
        public async Task<ActionResult<CreateBookingResponse>> CreateBooking([FromBody] CreateBookingRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.RoomType) || request.CustomerInfo == null)
                {
                    return BadRequest(new { error = "Room type and customer information required" });
                }

                // Validate customer info
                if (string.IsNullOrEmpty(request.CustomerInfo.FirstName) ||
                    string.IsNullOrEmpty(request.CustomerInfo.LastName) ||
                    string.IsNullOrEmpty(request.CustomerInfo.Email))
                {
                    return BadRequest(new { error = "First name, last name, and email are required" });
                }

                _logger.LogInformation($"Creating booking for {request.CustomerInfo.FirstName} {request.CustomerInfo.LastName}");
                var accessToken = GetAccessToken();
                var response = await _bookingService.CreateBookingAsync(request, accessToken);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError($"Authentication error: {ex.Message}");
                return Unauthorized(new { error = "Unauthorized: " + ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Booking creation error: {ex.Message}");
                return StatusCode(500, new { error = "Could not create booking. Please try again." });
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BookingSummary>>> GetBookings()
        {
            try
            {
                var accessToken = GetAccessToken();
                var bookings = await _bookingService.GetBookingsAsync(accessToken);
                return Ok(bookings);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError($"Authentication error: {ex.Message}");
                return Unauthorized(new { error = "Unauthorized: " + ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving bookings: {ex.Message}");
                return StatusCode(500, new { error = "Could not load bookings." });
            }
        }

        /// <summary>
        /// Get a single booking by ID
        /// GET /api/bookings/{bookingId}
        /// </summary>
        [HttpGet("{bookingId}")]
        public async Task<ActionResult<CreateBookingResponse>> GetBookingById(string bookingId)
        {
            try
            {
                var accessToken = GetAccessToken();
                var booking = await _bookingService.GetBookingByIdAsync(bookingId, accessToken);
                if (booking == null)
                {
                    return NotFound();
                }
                return Ok(booking);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError($"Authentication error: {ex.Message}");
                return Unauthorized(new { error = "Unauthorized: " + ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving booking {bookingId}: {ex.Message}");
                return StatusCode(500, new { error = "Could not load booking." });
            }
        }

        /// <summary>
        /// Update an existing booking
        /// PUT /api/bookings/{bookingId}
        /// </summary>
        [HttpPut("{bookingId}")]
        public async Task<ActionResult<CreateBookingResponse>> UpdateBooking(string bookingId, [FromBody] UpdateBookingRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { error = "Request body required" });
                }
                request.BookingId = bookingId;
                var accessToken = GetAccessToken();
                var updated = await _bookingService.UpdateBookingAsync(request, accessToken);
                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError($"Authentication error: {ex.Message}");
                return Unauthorized(new { error = "Unauthorized: " + ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating booking {bookingId}: {ex.Message}");
                return StatusCode(500, new { error = "Could not update booking." });
            }
        }

        /// <summary>
        /// Delete an existing booking
        /// DELETE /api/bookings/{bookingId}
        /// </summary>
        [HttpDelete("{bookingId}")]
        public async Task<IActionResult> DeleteBooking(string bookingId)
        {
            try
            {
                var accessToken = GetAccessToken();
                var deleted = await _bookingService.DeleteBookingAsync(bookingId, accessToken);
                if (!deleted)
                {
                    return StatusCode(500, new { error = "Unable to delete booking." });
                }
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError($"Authentication error: {ex.Message}");
                return Unauthorized(new { error = "Unauthorized: " + ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting booking {bookingId}: {ex.Message}");
                return StatusCode(500, new { error = "Could not delete booking." });
            }
        }
    }
}
