import React, { useEffect, useMemo, useState } from 'react'
import { deleteBooking, getBookings, updateBooking } from '../services/apiClient'

const emptyForm = {
  roomType: '',
  checkInDate: '',
  durationNights: 1,
  customerInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  },
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [formData, setFormData] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.bookingId === selectedBookingId),
    [bookings, selectedBookingId],
  )

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    if (selectedBooking) {
      setFormData({
        roomType: selectedBooking.roomType,
        checkInDate: selectedBooking.checkInDate?.slice(0, 10) ?? '',
        durationNights: selectedBooking.durationNights,
        customerInfo: {
          firstName: selectedBooking.customerInfo?.firstName ?? '',
          lastName: selectedBooking.customerInfo?.lastName ?? '',
          email: selectedBooking.customerInfo?.email ?? '',
          phone: selectedBooking.customerInfo?.phone ?? '',
          notes: selectedBooking.customerInfo?.notes ?? '',
        },
      })
    } else {
      setFormData(emptyForm)
    }
  }, [selectedBooking])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await getBookings()
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to load bookings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectBooking = (bookingId) => {
    setSelectedBookingId(bookingId)
    setSuccess('')
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name in formData.customerInfo) {
      setFormData((prev) => ({
        ...prev,
        customerInfo: {
          ...prev.customerInfo,
          [name]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'durationNights' ? Number(value) : value,
      }))
    }
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!selectedBookingId) {
      setError('Select a booking to update')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      await updateBooking(selectedBookingId, formData)
      setSuccess('Booking updated successfully')
      await fetchBookings()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (bookingId) => {
    if (!bookingId) return
    const confirmation = window.confirm('Delete this booking? This cannot be undone.')
    if (!confirmation) return

    try {
      await deleteBooking(bookingId)
      if (selectedBookingId === bookingId) {
        setSelectedBookingId('')
      }
      await fetchBookings()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete booking')
    }
  }

  return (
    <div className="card">
      <h2>Manage Existing Bookings</h2>
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="booking-list">
        {isLoading ? (
          <div className="alert alert-info">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="alert alert-info">No bookings found. Create one to get started.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Nights</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.bookingId} className={booking.bookingId === selectedBookingId ? 'active-row' : ''}>
                    <td>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => handleSelectBooking(booking.bookingId)}
                      >
                        {booking.customerInfo?.firstName} {booking.customerInfo?.lastName}
                      </button>
                      <div className="row-subtext">{booking.customerInfo?.email}</div>
                    </td>
                    <td>
                      <div>{booking.roomName || booking.roomType}</div>
                      <div className="row-subtext">ID: {booking.roomType}</div>
                    </td>
                    <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                    <td>{booking.durationNights}</td>
                    <td>${booking.totalPrice?.toFixed?.(2) ?? '0.00'}</td>
                    <td>
                      <button
                        type="button"
                        className="danger-link"
                        onClick={() => handleDelete(booking.bookingId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBookingId && (
        <form onSubmit={handleUpdate} className="booking-editor">
          <h3>Edit Booking</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="edit-checkInDate">Check-in Date</label>
              <input
                id="edit-checkInDate"
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-duration">Nights</label>
              <input
                id="edit-duration"
                type="number"
                min="1"
                max="30"
                name="durationNights"
                value={formData.durationNights}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-firstName">First Name</label>
              <input
                id="edit-firstName"
                type="text"
                name="firstName"
                value={formData.customerInfo.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-lastName">Last Name</label>
              <input
                id="edit-lastName"
                type="text"
                name="lastName"
                value={formData.customerInfo.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <input
                id="edit-email"
                type="email"
                name="email"
                value={formData.customerInfo.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-phone">Phone</label>
              <input
                id="edit-phone"
                type="tel"
                name="phone"
                value={formData.customerInfo.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-notes">Notes</label>
              <input
                id="edit-notes"
                type="text"
                name="notes"
                value={formData.customerInfo.notes}
                onChange={handleChange}
                placeholder="Special requests"
              />
            </div>
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving changes...' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  )
}
