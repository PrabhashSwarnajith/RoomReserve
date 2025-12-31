import React, { useState, useEffect } from 'react'

export default function BookingHistory({ onBack }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/bookings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      
      const data = await response.json()
      setBookings(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Unable to load bookings. Please try again.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const getCheckOutDate = (checkInDate, durationNights) => {
    const checkOut = new Date(checkInDate)
    checkOut.setDate(checkOut.getDate() + durationNights)
    return checkOut
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 md:mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">📋 Booking History</h2>
          <p className="text-slate-400 text-sm md:text-base">View all your hotel bookings</p>
        </div>
        <button
          onClick={onBack}
          className="btn btn-primary flex items-center gap-2"
        >
          ← Back
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card max-w-5xl mx-auto text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
          </div>
          <p className="text-gray-600 mt-4 text-sm md:text-base">Loading your bookings...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card max-w-5xl mx-auto bg-red-50 border-l-4 border-red-500 p-6 md:p-8">
          <h3 className="text-red-700 font-bold text-lg mb-2">Error</h3>
          <p className="text-red-600 text-sm md:text-base">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && bookings.length === 0 && (
        <div className="card max-w-5xl mx-auto text-center py-12">
          <p className="text-5xl mb-4">🏨</p>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">No Bookings Found</h3>
          <p className="text-gray-600 text-sm md:text-base mb-6">You haven't made any bookings yet.</p>
          <button
            onClick={onBack}
            className="btn btn-primary"
          >
            Make Your First Booking
          </button>
        </div>
      )}

      {/* Bookings Table */}
      {!loading && !error && bookings.length > 0 && (
        <div className="card max-w-7xl mx-auto overflow-hidden">
          {/* Table Header Stats */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-5 md:p-6 mb-6 rounded-lg border-l-4 border-sky-500">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Total Bookings</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-sky-600">{bookings.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Total Spent</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-emerald-600">
                  ${bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Total Nights</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-purple-600">
                  {bookings.reduce((sum, b) => sum + (b.durationNights || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-slate-100 border-b-2 border-gray-300">
                  <th className="text-left px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Booking ID</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Room Type</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Check-in</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Check-out</th>
                  <th className="text-center px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Nights</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Guest</th>
                  <th className="text-right px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Total</th>
                  <th className="text-center px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr 
                    key={booking.bookingId || index} 
                    className="border-b border-gray-200 hover:bg-sky-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-gray-100 px-3 py-1 rounded">{booking.bookingId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{booking.roomType || 'Room'}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(booking.checkInDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {getCheckOutDate(booking.checkInDate, booking.durationNights).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold text-sm">
                        {booking.durationNights}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{booking.guestName}</p>
                        {booking.email && (
                          <p className="text-xs text-gray-600">{booking.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-sky-600 text-lg">${(booking.totalPrice || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs">
                        ✓ Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {bookings.map((booking, index) => (
              <div key={booking.bookingId || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                {/* Header */}
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{booking.roomType || 'Room'}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">{booking.bookingId}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs">
                    ✓ Confirmed
                  </span>
                </div>

                {/* Details Grid */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Check-in:</span>
                    <span className="text-gray-800">
                      {new Date(booking.checkInDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Check-out:</span>
                    <span className="text-gray-800">
                      {getCheckOutDate(booking.checkInDate, booking.durationNights).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Duration:</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold text-xs">
                      {booking.durationNights} night{booking.durationNights > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                    <span className="text-gray-600 font-semibold">Total:</span>
                    <span className="font-bold text-sky-600 text-xl">${(booking.totalPrice || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Guest Info */}
                {booking.guestName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Guest:</p>
                    <p className="text-sm text-gray-800 font-semibold">{booking.guestName}</p>
                    {booking.email && <p className="text-xs text-gray-600">{booking.email}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
