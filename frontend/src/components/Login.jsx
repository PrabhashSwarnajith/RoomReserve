import React from 'react'

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold text-gray-800 mb-2">🏨 Hotel Booking</h1>
            <p className="text-gray-600">Book your perfect room - No login required!</p>
          </div>

          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-lg mb-8">
            <ul className="space-y-3 text-emerald-700">
              <li className="flex items-center gap-3">
                <span className="text-xl">✓</span>
                <span className="font-medium">Anonymous booking</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-xl">✓</span>
                <span className="font-medium">Fast & secure</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-xl">✓</span>
                <span className="font-medium">Instant confirmation</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary w-full py-3 text-lg font-semibold"
          >
            Start Booking →
          </button>

          <p className="text-center text-gray-500 text-sm mt-6">
            Your booking is completely secure and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}


