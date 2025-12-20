using HotelBookingAPI.Models;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace HotelBookingAPI.Services
{
    public interface IEmailService
    {
        Task SendBookingConfirmationAsync(CreateBookingResponse booking);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendBookingConfirmationAsync(CreateBookingResponse booking)
        {
            try
            {
                var apiKey = _configuration["SendGrid:ApiKey"];
                var fromEmail = _configuration["SendGrid:FromEmail"];

                if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(fromEmail))
                {
                    _logger.LogWarning("SendGrid configuration is missing, skipping email");
                    return;
                }

                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(fromEmail, "Hotel Booking System");
                var to = new EmailAddress(booking.CustomerInfo.Email, 
                    $"{booking.CustomerInfo.FirstName} {booking.CustomerInfo.LastName}");

                var subject = $"Booking Confirmation - ID: {booking.BookingId}";
                var htmlContent = GenerateConfirmationEmail(booking);

                var msg = new SendGridMessage()
                {
                    From = from,
                    Subject = subject,
                    HtmlContent = htmlContent
                };

                msg.AddTo(to);

                var response = await client.SendEmailAsync(msg);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Confirmation email sent to {booking.CustomerInfo.Email}");
                }
                else
                {
                    _logger.LogError($"Failed to send email: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending email: {ex.Message}");
            }
        }

        private string GenerateConfirmationEmail(CreateBookingResponse booking)
        {
            var checkOutDate = booking.CheckInDate.AddDays(booking.DurationNights).ToString("MMMM dd, yyyy");
            var checkInDateStr = booking.CheckInDate.ToString("MMMM dd, yyyy");

            return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }}
        .content {{ background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }}
        .details {{ margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #667eea; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
        .button {{ background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Booking Confirmed!</h1>
        </div>
        
        <div class='content'>
            <p>Dear {booking.CustomerInfo.FirstName},</p>
            
            <p>Thank you for your booking! Your reservation has been confirmed. Below are your booking details:</p>
            
            <div class='details'>
                <strong>Booking ID:</strong> {booking.BookingId}
            </div>
            
            <div class='details'>
                <strong>Guest Name:</strong> {booking.CustomerInfo.FirstName} {booking.CustomerInfo.LastName}
            </div>
            
            <div class='details'>
                <strong>Room Type:</strong> {booking.RoomType}
            </div>
            
            <div class='details'>
                <strong>Check-in Date:</strong> {checkInDateStr}
            </div>
            
            <div class='details'>
                <strong>Check-out Date:</strong> {checkOutDate}
            </div>
            
            <div class='details'>
                <strong>Duration:</strong> {booking.DurationNights} night(s)
            </div>
            
            <div class='details'>
                <strong>Total Price:</strong> ${booking.TotalPrice:F2}
            </div>
            
            {(string.IsNullOrEmpty(booking.CustomerInfo.Notes) ? "" : $"<div class='details'><strong>Special Requests:</strong> {booking.CustomerInfo.Notes}</div>")}
            
            <p>If you have any questions, please contact us at support@yourhotel.com or call +1-XXX-XXX-XXXX</p>
            
            <p>Best regards,<br/>Hotel Booking Team</p>
        </div>
        
        <div class='footer'>
            <p>This is an automated email. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
