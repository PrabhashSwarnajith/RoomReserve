import React, { useState, useEffect } from 'react'
import { getRoomTypes, createBooking } from '../services/apiClient'
import CalendarView from './CalendarView'

export default function BookingForm({ onBookingComplete }) {
  const [roomTypes, setRoomTypes] = useState([])
  const [step, setStep] = useState('selectRoom')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [durationNights, setDurationNights] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  })

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  const fetchRoomTypes = async () => {
    try {
      setLoading(true)
      const response = await getRoomTypes()
      setRoomTypes(response.roomTypes || [])
    } catch (err) {
      setError('Failed to load rooms')
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoomSelect = (room) => {
    setSelectedRoom(room)
    setSelectedDate(null)
    setError('')
    // Use setTimeout to ensure state updates before moving to next step
    setTimeout(() => {
      setStep('selectDate')
    }, 0)
  }

  const handleDateSelect = (dateInfo) => {
    setSelectedDate(dateInfo)
    setStep('fillDetails')
    setError('')
  }

  const handleBack = () => {
    if (step === 'selectDate') {
      setStep('selectRoom')
      setSelectedRoom(null)
    } else if (step === 'fillDetails') {
      setStep('selectDate')
      setSelectedDate(null)
    }
  }

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')

      const bookingRequest = {
        roomType: selectedRoom.id,
        checkInDate: selectedDate.date.toISOString().split('T')[0],
        durationNights: parseInt(durationNights),
        customerInfo
      }

      const response = await createBooking(bookingRequest)
      onBookingComplete(response)
    } catch (err) {
      setError(err.message || 'Failed to create booking')
      console.error('Booking error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {step === 'selectRoom' && (
        <div className="card">
          {/* Step Indicator */}
          <div className="mb-8 md:mb-10 flex items-center justify-center gap-2 md:gap-4">
            <div className="step-badge step-badge-active">1</div>
            <div className="h-1 w-8 md:w-16 bg-gray-200"></div>
            <div className="step-badge step-badge-inactive">2</div>
            <div className="h-1 w-8 md:w-16 bg-gray-200"></div>
            <div className="step-badge step-badge-inactive">3</div>
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800 mb-2">Step 1: Select a Room</h2>
          <p className="text-gray-600 mb-8 text-sm md:text-base">Choose the perfect room for your stay</p>
          
          {error && (
            <div className="mb-6 p-4 md:p-5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm md:text-base">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-16 md:py-20">
              <div className="animate-spin">
                <div className="h-10 w-10 md:h-12 md:w-12 border-4 border-sky-200 border-t-sky-500 rounded-full"></div>
              </div>
              <span className="ml-3 md:ml-4 text-gray-600 text-sm md:text-base">Loading rooms...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {roomTypes.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleRoomSelect(room)}
                  className="room-card"
                >
                  <div className="mb-3 md:mb-4 flex items-start justify-between gap-3">
                    <div className="text-left">
                      <h3 className="text-lg md:text-xl font-bold text-gray-800">{room.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">{room.description}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-xl md:text-2xl font-display font-bold text-sky-600">${room.price}</p>
                      <p className="text-xs text-gray-500">per night</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 md:space-y-2 mt-4 text-xs md:text-sm">
                    <p className="text-gray-700">👥 <strong>Capacity:</strong> {room.capacity} guests</p>
                    {room.amenities && room.amenities.length > 0 && (
                      <p className="text-gray-700">✨ <strong>Amenities:</strong> {room.amenities.join(', ')}</p>
                    )}
                  </div>
                  
                  <div className="mt-4 md:mt-6 pt-4 border-t border-gray-200">
                    <span className="text-sky-600 font-semibold text-sm md:text-base">Select Room →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'selectDate' && selectedRoom && (
        <div key="calendar-view">
          <CalendarView
            roomType={selectedRoom.id}
            onDateSelect={handleDateSelect}
            onBack={handleBack}
          />
        </div>
      )}

      {step === 'fillDetails' && selectedRoom && selectedDate && (
        <div className="card">
          {/* Step Indicator */}
          <div className="mb-8 md:mb-10 flex items-center justify-center gap-2 md:gap-4">
            <div className="step-badge step-badge-completed">✓</div>
            <div className="h-1 w-8 md:w-16 bg-emerald-500"></div>
            <div className="step-badge step-badge-completed">✓</div>
            <div className="h-1 w-8 md:w-16 bg-gray-200"></div>
            <div className="step-badge step-badge-active">3</div>
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800 mb-2">Step 3: Your Information</h2>
          <p className="text-gray-600 mb-8 text-sm md:text-base">Complete your booking details</p>
          
          {/* Booking Summary */}
          <div className="mb-8 p-4 md:p-6 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border border-sky-200">
            <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base">Booking Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Room</p>
                <p className="text-gray-800 font-semibold">{selectedRoom.name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Check-in</p>
                <p className="text-gray-800 font-semibold">{selectedDate.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Per Night</p>
                <p className="text-gray-800 font-semibold">${selectedDate.price}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Total</p>
                <p className="text-lg md:text-xl font-display font-bold text-sky-600">${(selectedDate.price * durationNights).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-8 p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
            <label htmlFor="duration" className="block font-semibold text-gray-800 mb-3 text-sm md:text-base">
              Duration (nights)
            </label>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <input
                id="duration"
                type="number"
                min="1"
                max="30"
                value={durationNights}
                onChange={(e) => setDurationNights(e.target.value)}
                disabled={loading}
                className="input-field flex-1"
              />
              <div className="text-right md:whitespace-nowrap">
                <p className="text-gray-600 text-xs md:text-sm">Total Price</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-sky-600">${(selectedDate.price * durationNights).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-4 md:p-5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm md:text-base">
                {error}
              </div>
            )}

            <div className="space-y-4 md:space-y-5 mb-8">
              <div>
                <label htmlFor="firstName" className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={customerInfo.firstName}
                  onChange={handleCustomerInfoChange}
                  required
                  disabled={loading}
                  className="input-field"
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={customerInfo.lastName}
                  onChange={handleCustomerInfoChange}
                  required
                  disabled={loading}
                  className="input-field"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                  required
                  disabled={loading}
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                  disabled={loading}
                  className="input-field"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                  Special Requests
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={customerInfo.notes}
                  onChange={handleCustomerInfoChange}
                  rows="4"
                  disabled={loading}
                  className="input-field resize-none"
                  placeholder="Any special requests or requirements..."
                ></textarea>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="btn btn-secondary flex-1 text-sm md:text-base"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 text-sm md:text-base"
              >
                {loading ? 'Creating Booking...' : 'Complete Booking'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
