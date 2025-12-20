import React, { useState, useEffect } from 'react'
import { useMsal } from '@azure/msal-react'
import RoomSelection from './components/RoomSelection'
import BookingForm from './components/BookingForm'
import ConfirmationModal from './components/ConfirmationModal'
import Login from './components/Login'
import BookingManagement from './components/BookingManagement'
import { setAuthToken } from './services/apiClient'
import { silentRequest } from './authConfig'

function App() {
  const { accounts, instance } = useMsal()
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [booking, setBooking] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        const activeAccount = instance.getActiveAccount() ?? accounts[0] ?? null

        if (activeAccount) {
          if (!instance.getActiveAccount()) {
            instance.setActiveAccount(activeAccount)
          }
          // User is logged in, get access token
          const tokenResponse = await instance.acquireTokenSilent({
            ...silentRequest,
            account: activeAccount,
          })
          setAuthToken(tokenResponse.accessToken)
          setIsAuthenticated(true)
        } else {
          // No user logged in
          setIsAuthenticated(false)
          setAuthToken(null)
        }
      } catch (error) {
        console.error('Token acquisition failed:', error)
        setIsAuthenticated(false)
        setAuthToken(null)
      } finally {
        setLoading(false)
      }
    }

    handleAuthentication()
  }, [accounts, instance])

  const handleLogout = async () => {
    await instance.logoutPopup()
    setSelectedRoom(null)
    setBooking(null)
    setAuthToken(null)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <h1>Hotel Booking System</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  if (booking) {
    return (
      <div className="container">
        <div className="header">
          <h1>Hotel Booking System</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
        <ConfirmationModal booking={booking} onClose={() => { setSelectedRoom(null); setBooking(null); }} />
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Hotel Booking System</h1>
        <p>Find your perfect room and complete your booking in minutes</p>
        <button className="logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
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
