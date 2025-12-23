import React, { useState, useEffect } from 'react'
import RoomSelection from './components/RoomSelection'
import BookingForm from './components/BookingForm'
import ConfirmationModal from './components/ConfirmationModal'
import BookingManagement from './components/BookingManagement'
import { setAuthToken } from './services/apiClient'
import './App.css'

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // No authentication needed - service account handles backend auth
    setAuthToken(null)
    setLoading(false)
  }, [])

  if (booking) {
    return (
      <div className="container">
        <div className="header">
          <h1>🏨 Hotel Booking System</h1>
        </div>
        <ConfirmationModal booking={booking} onClose={() => { setSelectedRoom(null); setBooking(null); }} />
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🏨 Hotel Booking System</h1>
        <p>Find your perfect room and complete your booking in minutes</p>
      </div>

      <div className="main-content">
        <RoomSelection 
          onRoomSelect={setSelectedRoom}
          selectedRoom={selectedRoom}
        />
        <BookingForm 
          selectedRoom={selectedRoom}
          onBookingComplete={setBooking}
        />
      </div>

      <BookingManagement />
    </div>
  )
}

export default App
