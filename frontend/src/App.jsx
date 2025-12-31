import React, { useState } from 'react'
import BookingForm from './components/BookingForm'
import BookingConfirmation from './components/BookingConfirmation'
import BookingHistory from './components/BookingHistory'

function App() {
  const [booking, setBooking] = useState(null)
  const [currentPage, setCurrentPage] = useState('booking') // 'booking', 'confirmation', 'history'

  const handleBookingComplete = (bookingData) => {
    setBooking(bookingData)
    setCurrentPage('confirmation')
  }

  const handleStartNew = () => {
    setBooking(null)
    setCurrentPage('booking')
  }

  const handleViewHistory = () => {
    setCurrentPage('history')
  }

  const handleBackFromHistory = () => {
    setCurrentPage('booking')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 md:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {currentPage === 'confirmation' && booking && (
          <>
            <div className="text-center mb-10 md:mb-12">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">🏨 Hotel Booking System</h1>
              <p className="text-slate-400 text-base md:text-lg font-light">Your reservation is confirmed</p>
            </div>
            <BookingConfirmation booking={booking} onStartNew={handleStartNew} />
          </>
        )}

        {currentPage === 'history' && (
          <BookingHistory onBack={handleBackFromHistory} />
        )}

        {currentPage === 'booking' && (
          <>
            <div className="text-center mb-10 md:mb-12 flex flex-col md:flex-row md:justify-between md:items-start">
              <div className="flex-1 mb-6 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">🏨 Hotel Booking System</h1>
                <p className="text-slate-300 text-base md:text-xl font-light">Find your perfect room and complete your booking in minutes</p>
              </div>
              <button
                onClick={handleViewHistory}
                className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                📋 View Bookings
              </button>
            </div>
            <BookingForm onBookingComplete={handleBookingComplete} />
          </>
        )}
      </div>
    </div>
  )
}

export default App
