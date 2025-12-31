import React, { useState, useEffect } from 'react'
import { getCalendarAvailability } from '../services/apiClient'

export default function CalendarView({ roomType, onDateSelect, onBack }) {
  const [allCalendarData, setAllCalendarData] = useState([])
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (roomType) {
      fetchCalendar()
    }
  }, [roomType])

  const fetchCalendar = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getCalendarAvailability(roomType, 3)
      
      // Ensure dates are properly parsed
      const processedDays = (data.days || []).map(day => ({
        ...day,
        date: typeof day.date === 'string' ? new Date(day.date) : new Date(day.date)
      }))
      
      setAllCalendarData(processedDays)
      setCurrentMonthIndex(0)
    } catch (err) {
      setError('Failed to load calendar')
      console.error('Error fetching calendar:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date) => {
    if (date.isAvailable) {
      const selectedDateObj = new Date(date.date)
      setSelectedDate(selectedDateObj)
      onDateSelect({
        date: selectedDateObj,
        price: date.price
      })
    }
  }

  const groupedByMonth = allCalendarData.reduce((acc, day) => {
    const date = new Date(day.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(day)
    return acc
  }, {})

  const months = Object.keys(groupedByMonth).sort()
  const currentMonth = months[currentMonthIndex] || months[0]
  const currentMonthData = groupedByMonth[currentMonth] || []

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1)
      setSelectedDate(null)
    }
  }

  const handleNextMonth = () => {
    if (currentMonthIndex < months.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1)
      setSelectedDate(null)
    }
  }

  if (loading) {
    return (
      <div className="calendar-wrapper">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin">
            <div className="h-12 w-12 border-4 border-sky-200 border-t-sky-500 rounded-full"></div>
          </div>
          <span className="ml-4 text-gray-600">Loading calendar...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="calendar-wrapper">
        <div className="text-center py-10 text-red-600">
          <p className="text-lg font-semibold mb-4">{error}</p>
          <button onClick={onBack} className="btn btn-primary">← Back</button>
        </div>
      </div>
    )
  }

  if (!currentMonth || currentMonthData.length === 0) {
    return (
      <div className="calendar-wrapper">
        <div className="text-center py-10 text-red-600">
          <p className="text-lg font-semibold mb-4">No availability data</p>
          <button onClick={onBack} className="btn btn-primary">← Back</button>
        </div>
      </div>
    )
  }

  const firstDay = new Date(currentMonthData[0].date).getDay()
  const monthName = new Date(currentMonthData[0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(new Date(currentMonthData[0].date).getFullYear(), new Date(currentMonthData[0].date).getMonth() + 1, 0).getDate()

  return (
    <div className="calendar-wrapper">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold text-gray-800">Select Check-in Date</h2>
        <button onClick={onBack} className="btn btn-secondary text-sm">← Change Room</button>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-400 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-sky-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Selected</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-month">
        {/* Month Navigation */}
        <div className="calendar-header">
          <button 
            onClick={handlePrevMonth}
            disabled={currentMonthIndex === 0}
            className="calendar-nav-btn"
          >
            ‹
          </button>
          <h3 className="calendar-title">{monthName}</h3>
          <button 
            onClick={handleNextMonth}
            disabled={currentMonthIndex === months.length - 1}
            className="calendar-nav-btn"
          >
            ›
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="weekday-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        {/* Calendar Days - Full Month */}
        <div className="calendar-grid">
          {/* Empty cells for days before month starts */}
          {[...Array(firstDay)].map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty"></div>
          ))}

          {/* All days of the month */}
          {[...Array(daysInMonth)].map((_, dayIndex) => {
            const day = dayIndex + 1
            const dayData = currentMonthData.find(d => {
              const date = new Date(d.date)
              return date.getDate() === day
            })

            if (!dayData) {
              return (
                <div key={`no-data-${day}`} className="calendar-day empty border-2 border-gray-100">
                  <span className="calendar-day-number text-gray-400">{day}</span>
                </div>
              )
            }

            const dateObj = new Date(dayData.date)
            const isSelected = selectedDate && dateObj.toDateString() === selectedDate.toDateString()

            return (
              <button
                key={dayData.date}
                onClick={() => handleDateClick(dayData)}
                disabled={!dayData.isAvailable}
                className={`calendar-day ${dayData.isAvailable ? 'available' : 'booked'} ${isSelected ? 'selected' : ''}`}
              >
                <span className="calendar-day-number">{new Date(dayData.date).getDate()}</span>
                <span className="calendar-day-price">${dayData.price}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-sky-50 border-l-4 border-sky-500 rounded">
          <p className="text-gray-800">
            <strong>Check-in:</strong> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-600 mt-1">→ Next: Select your length of stay</p>
        </div>
      )}
    </div>
  )
}
