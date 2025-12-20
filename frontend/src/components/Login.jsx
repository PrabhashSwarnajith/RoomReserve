import React, { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../authConfig'
import './Login.css'

export default function Login() {
  const { instance } = useMsal()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Starting login with scopes:', loginRequest.scopes)
      await instance.loginPopup(loginRequest)
      console.log('Login successful')
    } catch (error) {
      console.error('Login failed:', error)
      
      // Provide user-friendly error message
      if (error.errorCode === 'AADSTS9002326') {
        setError('Authentication configuration issue. Please contact support.')
      } else if (error.errorCode === 'user_cancelled') {
        setError(null) // User cancelled, don't show error
      } else {
        setError(error.message || 'Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🏨 Hotel Booking System</h1>
        <p>Sign in with your Microsoft account to book a room</p>
        
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.95rem'
          }}>
            {error}
          </div>
        )}
        
        <button 
          className="login-button" 
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
        </button>

        <div className="login-info">
          <h3>What you need:</h3>
          <ul>
            <li>A Microsoft account</li>
            <li>Access to Microsoft Bookings</li>
            <li>Required permissions: Bookings.Read.All</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

