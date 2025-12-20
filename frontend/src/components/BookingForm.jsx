import React, { useState } from 'react'
import { createBooking } from '../services/apiClient'

export default function BookingForm({ selectedRoom, onBookingComplete }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    durationNights: 1
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedRoom || !selectedRoom.available) {
      setError('Please check availability first')
      return
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const bookingPayload = {
        roomType: selectedRoom.roomType,
        checkInDate: selectedRoom.checkInDate,
        durationNights: parseInt(formData.durationNights) || 1,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes
        }
      }

      const response = await createBooking(bookingPayload)
      onBookingComplete(response)
    } catch (err) {
      setError('Failed to create booking. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedRoom || !selectedRoom.available) {
    return (
      <div className="card">
        <h2>Customer Information</h2>
        <div className="alert alert-info">
          Please check availability first before entering customer information
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Customer Information</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            id="lastName"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Special Requests</label>
          <input
            id="notes"
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g., High floor, early check-in"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="durationNights">Number of Nights *</label>
          <input
            id="durationNights"
            type="number"
            name="durationNights"
            value={formData.durationNights}
            onChange={handleChange}
            min="1"
            max="30"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="button"
          disabled={loading}
        >
          {loading ? 'Creating Booking...' : 'Complete Booking'}
        </button>
      </form>
    </div>
  )
}
