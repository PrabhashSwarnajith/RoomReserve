import React from 'react'

export default function BookingConfirmation({ booking, onStartNew }) {
  const checkOutDate = new Date(booking.checkInDate)
  checkOutDate.setDate(checkOutDate.getDate() + booking.durationNights)

  return (
    <div className="w-full">
      <div className="card max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-10 p-5 md:p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-l-4 border-emerald-500">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-emerald-700 mb-2">✓ Booking Confirmed!</h2>
          <p className="text-emerald-600 text-sm md:text-base">Your booking has been successfully created</p>
        </div>

        {/* Content */}
        <div className="space-y-6 md:space-y-8">
          {/* Booking Details */}
          <div>
            <h3 className="text-lg md:text-xl font-display font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-1 h-5 md:h-6 bg-sky-500 mr-3 rounded"></span>
              Booking Details
            </h3>
            <div className="space-y-2 md:space-y-3 bg-gray-50 p-5 md:p-6 rounded-lg">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-3 last:border-0">
                <span className="font-semibold text-gray-600 text-sm md:text-base">Booking ID:</span>
                <span className="font-mono text-gray-800 bg-white px-3 py-1 rounded text-xs md:text-sm mt-2 md:mt-0">{booking.bookingId}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-3 last:border-0">
                <span className="font-semibold text-gray-600 text-sm md:text-base">Room Type:</span>
                <span className="text-gray-800 text-sm md:text-base mt-2 md:mt-0">{booking.roomType}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-3 last:border-0">
                <span className="font-semibold text-gray-600 text-sm md:text-base">Check-in:</span>
                <span className="text-gray-800 text-sm md:text-base mt-2 md:mt-0">{new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-3 last:border-0">
                <span className="font-semibold text-gray-600 text-sm md:text-base">Check-out:</span>
                <span className="text-gray-800 text-sm md:text-base mt-2 md:mt-0">{checkOutDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-3 last:border-0">
                <span className="font-semibold text-gray-600 text-sm md:text-base">Duration:</span>
                <span className="text-gray-800 text-sm md:text-base mt-2 md:mt-0">{booking.durationNights} night{booking.durationNights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center text-base md:text-lg mt-4 pt-3 border-t border-gray-300">
                <span className="font-bold text-gray-700 text-sm md:text-base">Total Price:</span>
                <span className="text-xl md:text-2xl font-display font-bold text-sky-600 mt-2 md:mt-0">${booking.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div>
            <h3 className="text-lg md:text-xl font-display font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-1 h-5 md:h-6 bg-emerald-500 mr-3 rounded"></span>
              Guest Information
            </h3>
            <div className="space-y-3 md:space-y-4 bg-blue-50 p-5 md:p-6 rounded-lg border border-blue-100">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <span className="font-semibold text-gray-600 text-sm md:text-base">Name:</span>
                <span className="text-gray-800 font-medium text-sm md:text-base mt-2 md:mt-0">{booking.customerInfo.firstName} {booking.customerInfo.lastName}</span>
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start break-all">
                <span className="font-semibold text-gray-600 text-sm md:text-base">Email:</span>
                <span className="text-gray-800 text-sm md:text-base mt-2 md:mt-0">{booking.customerInfo.email}</span>
              </div>
              {booking.customerInfo.phone && (
                <div className="flex flex-col md:flex-row md:justify-between md:items-center border-t border-blue-200 pt-3">
                  <span className="font-semibold text-gray-600 text-sm md:text-base">Phone:</span>
                  <span className="text-gray-800 text-sm md:text-base mt-2 md:mt-0">{booking.customerInfo.phone}</span>
                </div>
              )}
              {booking.customerInfo.notes && (
                <div className="border-t border-blue-200 pt-3">
                  <p className="font-semibold text-gray-600 mb-2 text-sm md:text-base">Special Requests:</p>
                  <p className="text-gray-700 italic text-sm md:text-base">{booking.customerInfo.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="p-4 md:p-5 bg-amber-50 border-l-4 border-amber-500 rounded">
            <p className="text-amber-800 text-sm md:text-base">
              📧 A confirmation email has been sent to <strong>{booking.customerInfo.email}</strong>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-200">
          <button 
            onClick={onStartNew}
            className="btn btn-primary w-full text-base md:text-lg py-3 md:py-3 flex items-center justify-center gap-2"
          >
            ← Make Another Booking
          </button>
        </div>
      </div>
    </div>
  )
}
