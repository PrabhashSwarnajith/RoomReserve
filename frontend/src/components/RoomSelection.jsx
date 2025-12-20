import React, { useState, useEffect } from 'react'
import { checkAvailability, getRoomTypes } from '../services/apiClient'

export default function RoomSelection({ onRoomSelect, selectedRoom }) {
  const [roomTypes, setRoomTypes] = useState([])
  const [selectedRoomType, setSelectedRoomType] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backendError, setBackendError] = useState('')

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  const fetchRoomTypes = async () => {
    try {
      setLoading(true)
      setError('')
      setBackendError('')
      const response = await getRoomTypes()
      setRoomTypes(response.roomTypes || [])
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load room types'
      setError('Unable to load rooms')
      setBackendError(errorMsg)
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckAvailability = async () => {
    if (!selectedRoomType || !checkInDate) {
      setError('Please select a room type and check-in date')
      return
    }

    try {
      setLoading(true)
      setError('')
      setBackendError('')
      const result = await checkAvailability(selectedRoomType, checkInDate)
      setAvailability(result)
      
      if (result.available) {
        onRoomSelect({
          roomType: selectedRoomType,
          checkInDate,
          available: true
        })
      } else {
        setError('This room is not available for the selected dates. Please try different dates.')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to check availability'
      setError('Unable to check availability')
      setBackendError(errorMsg)
      console.error('Error checking availability:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Select Room & Check-in Date</h2>
      
      {error && (
        <div className="alert alert-error">
          <strong>{error}</strong>
          {backendError && <div className="error-detail">{backendError}</div>}
        </div>
      )}
      
      {roomTypes.length === 0 && !error && (        <div className="alert alert-info">Loading available rooms...</div>
      )}
      
      <div className="form-group">
        <label htmlFor="room-type">Room Type</label>
        <select
          id="room-type"
          value={selectedRoomType}
          onChange={(e) => setSelectedRoomType(e.target.value)}
          disabled={loading || roomTypes.length === 0}
        >
          <option value="">-- {roomTypes.length === 0 ? 'Loading rooms...' : 'Select a room type'} --</option>
          {roomTypes.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} - ${room.price}/night
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="check-in-date">Check-in Date</label>
        <input
          id="check-in-date"
          type="date"
          value={checkInDate}
          onChange={(e) => setCheckInDate(e.target.value)}
          disabled={loading}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <button
        className="button"
        onClick={handleCheckAvailability}
        disabled={loading || !selectedRoomType || !checkInDate}
      >
        {loading ? 'Checking Availability...' : 'Check Availability'}
      </button>

      {availability && (
        <div style={{ marginTop: '20px' }}>
          {availability.available ? (
            <div className="alert alert-success">
              <strong>✓ Room Available!</strong> Ready for booking
            </div>
          ) : (
            <div className="alert alert-error">
              <strong>✗ Room Unavailable</strong> Try another date or room type
            </div>
          )}
        </div>
      )}
    </div>
  )
}
