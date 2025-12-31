const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Get room types
export const getRoomTypes = async () => {
  const response = await fetch(`${API_BASE_URL}/bookings/room-types`)
  if (!response.ok) throw new Error('Failed to fetch room types')
  return response.json()
}

// Get calendar availability for a room
export const getCalendarAvailability = async (roomType, months = 3) => {
  const response = await fetch(`${API_BASE_URL}/bookings/calendar/${roomType}?months=${months}`)
  if (!response.ok) throw new Error('Failed to fetch calendar')
  return response.json()
}

// Create a booking
export const createBooking = async (bookingData) => {
  const response = await fetch(`${API_BASE_URL}/bookings/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
  if (!response.ok) throw new Error('Failed to create booking')
  return response.json()
}
