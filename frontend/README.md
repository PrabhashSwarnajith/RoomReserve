# Hotel Booking Frontend

React + Vite frontend for the Hotel Booking System

## Features

- ✅ Room selection with real-time availability checking
- ✅ Booking form with customer information
- ✅ Booking confirmation display
- ✅ Integration with .NET Core backend
- ✅ Microsoft Bookings API integration
- ✅ Responsive design for mobile and desktop

## Prerequisites

- Node.js 16+ and npm
- Backend server running on `http://localhost:5000`

## Setup & Running

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

### 3. Start Backend (in another terminal)
```bash
cd backend
dotnet run
```

**Important**: When the backend starts, a browser window will open for authentication. Sign in with your Microsoft account.

## How It Works

1. **Room Selection**
   - Fetches available rooms from backend API
   - User selects a room and check-in date
   - Checks availability for selected dates
   - Shows error messages if backend not available

2. **Booking Form**
   - Collects customer information (name, email, phone)
   - Allows adding booking notes
   - Calculates total price based on duration (nights)
   - Validates all required fields

3. **Confirmation**
   - Displays booking confirmation with all details
   - Shows booking ID, dates, and total price
   - Confirms email confirmation was sent
   - Allows creating new booking

## API Endpoints Used

- `GET /api/bookings/room-types` - Get available rooms
- `POST /api/bookings/check-availability` - Check room availability  
- `POST /api/bookings/create` - Create a new booking
- `GET /api/bookings/auth/callback` - OAuth callback (handled automatically)

## Environment Configuration

The API URL is configured in `src/services/apiClient.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```

Create a `.env.local` file in the frontend folder to override defaults:
```
VITE_API_URL=http://localhost:5000/api
VITE_MSAL_CLIENT_ID=<Azure app clientId>
VITE_MSAL_TENANT_ID=<Azure Entra tenantId>
VITE_MSAL_REDIRECT_URI=http://localhost:3000
VITE_MSAL_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
```

If you already have an authority URL, you can also set `VITE_MSAL_AUTHORITY`.

### Azure AD App Registration Checklist

1. In Azure Portal, open **Azure Active Directory → App registrations → <your app> → Authentication**.
2. Under **Platform configurations**, ensure a **Single-page application** entry exists for `http://localhost:3000` (add additional origins if you use a different host in other environments).
3. Remove duplicate redirect URIs from the **Web** platform that point to the SPA origin, or leave only the SPA entry for frontend hosts.
4. Under **Implicit grant and hybrid flows**, enable both **Access tokens** and **ID tokens**.
5. Click **Save**, then restart `npm run dev` so MSAL picks up the new redirect URI.

## Troubleshooting

### "Failed to load room types" or "Unable to load rooms"

1. **Check if backend is running:**
   ```bash
   # Backend should be on http://localhost:5000
   curl http://localhost:5000/api/bookings/room-types
   ```

2. **Check backend logs:** Look for authentication errors in the backend terminal

3. **Ensure you signed in:** When backend starts, a browser window opens. You MUST sign in with your Microsoft account.

4. **Check CORS:** Backend has CORS enabled for all origins. If error persists, check browser console Network tab.

### Dates not showing/loading
- Browser must support HTML5 date input
- Modern browsers (Chrome, Firefox, Safari, Edge) support this
- Date must be today or in the future

### Booking creation fails
- Ensure all customer information is filled in
- Check backend logs for the actual error
- Ensure SendGrid email key is configured (for email confirmation)

## Building for Production

```bash
npm run build
```

This creates an optimized production build in `dist/` folder.

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/              # React components
│   │   ├── RoomSelection.jsx    # Room & date selection
│   │   ├── BookingForm.jsx      # Customer info form
│   │   └── ConfirmationModal.jsx # Confirmation display
│   ├── services/
│   │   └── apiClient.js         # Axios HTTP client
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Vite entry point
│   ├── App.css                  # Styles
│   └── index.css                # Global styles
├── public/                      # Static files
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
├── .env.local (optional)       # Environment overrides
└── README.md                   # This file
```

## Component Details

### RoomSelection.jsx
- Fetches rooms on mount
- Allows room selection
- Allows check-in date selection
- Checks availability
- Shows loading and error states

### BookingForm.jsx
- Collects first name, last name, email, phone
- Optional notes field
- Duration in nights (1-30)
- Price calculation
- Creates booking on submit

### ConfirmationModal.jsx
- Shows booking confirmation
- Displays all booking details
- Shows check-out date (calculated from check-in + nights)
- Shows total price
- Allows starting new booking

## Technologies

- **React 18.3.1** - UI library
- **Vite 5.0.8** - Fast build tool and dev server
- **Axios 1.6.2** - HTTP client for API calls
- **CSS3** - Responsive styling

## API Response Format

### Room Types
```json
{
  "roomTypes": [
    {
      "id": "room-id",
      "name": "Room1",
      "price": 100,
      "description": "Room description",
      "capacity": 2,
      "amenities": ["WiFi", "TV", "AC"]
    }
  ]
}
```

### Availability Check
```json
{
  "available": true,
  "message": "Room is available",
  "roomType": "room-id",
  "checkInDate": "2025-01-01",
  "price": 100
}
```

### Create Booking
```json
{
  "bookingId": "booking-123",
  "roomType": "room-id",
  "checkInDate": "2025-01-01",
  "durationNights": 3,
  "totalPrice": 300,
  "status": "Confirmed",
  "createdAt": "2025-12-17T10:30:00Z"
}
```

## Notes

- Frontend does NOT store authentication credentials
- All auth handled by backend using Microsoft Graph
- CORS enabled to allow cross-origin API calls
- No sensitive data stored in localStorage
- Date validation prevents past dates
- All dates sent as ISO strings (YYYY-MM-DD)
- Prices are in USD (configurable in backend)

## Support

For issues or questions:
1. Check backend logs
2. Check browser console (F12)
3. Verify backend is running on port 5000
4. Verify delegated permissions are granted in Azure AD
