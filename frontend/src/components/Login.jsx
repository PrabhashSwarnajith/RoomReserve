import React from 'react'
import './Login.css'

export default function Login() {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🏨 Hotel Booking System</h1>
        <p>Book your perfect room - No login required!</p>
        
        <div style={{
          background: '#e8f5e9',
          color: '#2e7d32',
          padding: '1.5rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.95rem',
          textAlign: 'center'
        }}>
          ✓ Anonymous booking
          <br />
          ✓ Fast & secure
          <br />
          ✓ Instant confirmation
        </div>

        <button 
          onClick={() => window.location.reload()}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Start Booking
        </button>
      </div>
    </div>
  )
}


