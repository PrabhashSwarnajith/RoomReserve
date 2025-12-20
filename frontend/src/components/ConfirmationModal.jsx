import React from 'react'

export default function ConfirmationModal({ booking, onClose }) {
  const checkOutDate = new Date(booking.checkInDate)
  checkOutDate.setDate(checkOutDate.getDate() + booking.durationNights)

  return (
    <div className="confirmation-modal">
      <h2>✓ Booking Confirmed!</h2>
      
      <div className="alert alert-success">
        Your booking has been created and confirmation email has been sent.
      </div>

      <div className="confirmation-details">
        <p>
          <strong>Booking ID:</strong><br />
          {booking.bookingId}
        </p>
        <p>
          <strong>Guest Name:</strong><br />
          {booking.customerInfo.firstName} {booking.customerInfo.lastName}
        </p>
        <p>
          <strong>Email:</strong><br />
          {booking.customerInfo.email}
        </p>
        <p>
          <strong>Phone:</strong><br />
          {booking.customerInfo.phone}
        </p>
        <p>
          <strong>Room Type:</strong><br />
          {booking.roomType}
        </p>
        <p>
          <strong>Check-in Date:</strong><br />
          {new Date(booking.checkInDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p>
          <strong>Check-out Date:</strong><br />
          {checkOutDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p>
          <strong>Duration:</strong><br />
          {booking.durationNights} night(s)
        </p>
        <p>
          <strong>Total Price:</strong><br />
          ${booking.totalPrice.toFixed(2)}
        </p>
        {booking.customerInfo.notes && (
          <p>
            <strong>Special Requests:</strong><br />
            {booking.customerInfo.notes}
          </p>
        )}
      </div>

      <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
        A confirmation email with booking details has been sent to {booking.customerInfo.email}
      </p>

      <button className="button" onClick={onClose} style={{ marginTop: '20px' }}>
        Make Another Booking
      </button>
    </div>
  )
}
