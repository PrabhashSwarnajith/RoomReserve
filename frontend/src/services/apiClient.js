import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})
// Add token to requests if available
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

export const getRoomTypes = async () => {
  try {
    const response = await apiClient.get('/bookings/room-types')
    return response.data
  } catch (error) {
    console.error('Error fetching room types:', error)
    throw error
  }
}

export const checkAvailability = async (roomType, checkInDate) => {
  try {
    const dateStr = typeof checkInDate === 'string' 
      ? checkInDate 
      : new Date(checkInDate).toISOString()
    const response = await apiClient.post('/bookings/check-availability', {
      roomType,
      checkInDate: dateStr,
      durationNights: 1
    })
    return response.data
  } catch (error) {
    console.error('Error checking availability:', error)
    throw error
  }
}

export const createBooking = async (bookingData) => {
  try {
    const dateStr = typeof bookingData.checkInDate === 'string' 
      ? bookingData.checkInDate 
      : new Date(bookingData.checkInDate).toISOString()
    const payload = {
      roomType: bookingData.roomType,
      checkInDate: dateStr,
      durationNights: bookingData.durationNights || 1,
      customerInfo: bookingData.customerInfo
    }

    const response = await apiClient.post('/bookings/create', payload)
    return response.data
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}

export const getBookings = async () => {
  try {
    const response = await apiClient.get('/bookings')
    return response.data
  } catch (error) {
    console.error('Error fetching bookings:', error)
    throw error
  }
}

export const updateBooking = async (bookingId, bookingData) => {
  try {
    const dateStr = typeof bookingData.checkInDate === 'string'
      ? bookingData.checkInDate
      : new Date(bookingData.checkInDate).toISOString()
    const payload = {
      roomType: bookingData.roomType,
      checkInDate: dateStr,
      durationNights: bookingData.durationNights || 1,
      customerInfo: bookingData.customerInfo
    }

    const response = await apiClient.put(`/bookings/${bookingId}`, payload)
    return response.data
  } catch (error) {
    console.error('Error updating booking:', error)
    throw error
  }
}

export const deleteBooking = async (bookingId) => {
  try {
    await apiClient.delete(`/bookings/${bookingId}`)
  } catch (error) {
    console.error('Error deleting booking:', error)
    throw error
  }
}

export default apiClient
