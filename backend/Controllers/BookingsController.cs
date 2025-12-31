using HotelBookingAPI.Models;
using HotelBookingAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace HotelBookingAPI.Controllers
{
    /// <summary>
    /// API Controller for hotel booking operations
    /// </summary>
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

        /// <summary>
        /// Get all available room types
        /// </summary>
        [HttpGet("room-types")]
        public async Task<ActionResult<dynamic>> GetRoomTypes()
        {
            try
            {
                var roomTypes = await _bookingService.GetRoomTypesAsync("");
                return Ok(new { roomTypes });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching rooms: {ex.Message}");
                return Ok(new { roomTypes = new List<object>(), error = "Could not load rooms" });
            }
        }

        /// <summary>
        /// Get calendar availability for a specific room type
        /// </summary>
        [HttpGet("calendar/{roomType}")]
        public async Task<ActionResult<CalendarAvailabilityResponse>> GetCalendarAvailability(string roomType, [FromQuery] int months = 3)
        {
            try
            {
                if (string.IsNullOrEmpty(roomType))
                {
                    return BadRequest(new { error = "Room type is required" });
                }

                months = months < 1 || months > 12 ? 3 : months;

                var calendarData = await _bookingService.GetCalendarAvailabilityAsync(roomType, months, "");
                return Ok(calendarData);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching calendar: {ex.Message}");
                return StatusCode(500, new { error = "Could not load calendar data." });
            }
        }

        /// <summary>
        /// Create a new booking
        /// </summary>
        [HttpPost("create")]
        public async Task<ActionResult<CreateBookingResponse>> CreateBooking([FromBody] CreateBookingRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.RoomType) || request.CustomerInfo == null)
                {
                    return BadRequest(new { error = "Room type and customer information required" });
                }

                if (string.IsNullOrEmpty(request.CustomerInfo.FirstName) ||
                    string.IsNullOrEmpty(request.CustomerInfo.LastName) ||
                    string.IsNullOrEmpty(request.CustomerInfo.Email))
                {
                    return BadRequest(new { error = "First name, last name, and email are required" });
                }

                var response = await _bookingService.CreateBookingAsync(request, "");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Booking creation error: {ex.Message}");
                return StatusCode(500, new { error = "Could not create booking. Please try again." });
            }
        }

        /// <summary>
        /// Get all bookings
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BookingSummary>>> GetBookings()
        {
            try
            {
                var bookings = await _bookingService.GetBookingsAsync("");
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving bookings: {ex.Message}");
                return StatusCode(500, new { error = "Could not load bookings." });
            }
        }

        /// <summary>
        /// Get a single booking by ID
        /// </summary>
        [HttpGet("{bookingId}")]
        public async Task<ActionResult<CreateBookingResponse>> GetBookingById(string bookingId)
        {
            try
            {
                var booking = await _bookingService.GetBookingByIdAsync(bookingId, "");
                if (booking == null)
                {
                    return NotFound();
                }
                return Ok(booking);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving booking {bookingId}: {ex.Message}");
                return StatusCode(500, new { error = "Could not load booking." });
            }
        }

        /// <summary>
        /// Update an existing booking
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
                var updated = await _bookingService.UpdateBookingAsync(request, "");
                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating booking {bookingId}: {ex.Message}");
                return StatusCode(500, new { error = "Could not update booking." });
            }
        }

        /// <summary>
        /// Delete an existing booking
        /// </summary>
        [HttpDelete("{bookingId}")]
        public async Task<IActionResult> DeleteBooking(string bookingId)
        {
            try
            {
                var deleted = await _bookingService.DeleteBookingAsync(bookingId, "");
                if (!deleted)
                {
                    return StatusCode(500, new { error = "Unable to delete booking." });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting booking {bookingId}: {ex.Message}");
                return StatusCode(500, new { error = "Could not delete booking." });
            }
        }
    }
}

