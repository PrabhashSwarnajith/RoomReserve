namespace HotelBookingAPI.Models
{
    public class CheckAvailabilityRequest
    {
        public string RoomType { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public int DurationNights { get; set; } = 1;
    }

    public class CheckAvailabilityResponse
    {
        public bool Available { get; set; }
        public string Message { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public decimal Price { get; set; }
    }

    public class CreateBookingRequest
    {
        public string RoomType { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public int DurationNights { get; set; } = 1;
        public CustomerInfo CustomerInfo { get; set; } = new();
    }

    public class CustomerInfo
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    public class CreateBookingResponse
    {
        public string BookingId { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public int DurationNights { get; set; }
        public CustomerInfo CustomerInfo { get; set; } = new();
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class RoomType
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Capacity { get; set; }
        public List<string> Amenities { get; set; } = new();
    }

    public class BookingSummary
    {
        public string BookingId { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public int DurationNights { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public CustomerInfo CustomerInfo { get; set; } = new();
    }

    public class UpdateBookingRequest
    {
        public string BookingId { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public int DurationNights { get; set; } = 1;
        public CustomerInfo CustomerInfo { get; set; } = new();
    }

    public class CalendarDayDto
    {
        public DateTime Date { get; set; }
        public bool IsAvailable { get; set; }
        public decimal Price { get; set; }
    }

    public class CalendarAvailabilityResponse
    {
        public string RoomType { get; set; } = string.Empty;
        public List<CalendarDayDto> Days { get; set; } = new();
        public string Message { get; set; } = "Calendar data retrieved successfully";
    }
}
