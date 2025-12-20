# Hotel Booking System

A full-stack hotel booking application combining a Vite-powered React frontend with a .NET 8 Web API backend. The backend integrates with Microsoft Graph to manage bookings in Outlook calendars and SendGrid to deliver transactional emails.

## Repository Layout

```
HotelBookingSimple/
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── main.jsx
│       ├── index.css
│       ├── authConfig.js
│       ├── components/
│       │   ├── BookingForm.jsx
│       │   ├── BookingManagement.jsx
│       │   ├── ConfirmationModal.jsx
│       │   ├── Login.jsx
│       │   ├── Login.css
│       │   └── RoomSelection.jsx
│       └── services/
│           └── apiClient.js
├── backend/   # ignored in git, but kept locally for API work
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   ├── Program.cs
│   ├── appsettings*.json
│   └── HotelBookingAPI.csproj
└── README.md
```

> **NOTE**: The entire `backend/` folder is ignored via `.gitignore` so secrets in `appsettings.json` never leave your machine. If you plan to share the backend, either remove that rule or keep a safe, sanitized copy of the folder elsewhere.

## Getting Started

### 1. Backend (ASP.NET Core)

1. From the repo root: `cd backend`
2. Restore packages: `dotnet restore`
3. Configure secrets:
   - Prefer `dotnet user-secrets set` for `AzureAd:*`, `SendGrid:*`, and booking IDs.
   - Alternatively keep a local `appsettings.Development.json` (never commit).
4. Run: `dotnet run` (default URL `https://localhost:7182` or `http://localhost:5182`).

Key settings expected by the API:

```json
{
  "AzureAd": {
    "TenantId": "<GUID>",
    "ClientId": "<GUID>",
    "ClientSecret": "<secret>"
  },
  "SendGrid": {
    "ApiKey": "<token>",
    "FromEmail": "noreply@yourhotel.com"
  },
  "Bookings": {
    "BusinessId": "<graph mailbox or calendar id>",
    "StaffId": "<optional staff object id>"
  }
}
```

### 2. Frontend (React + Vite)

1. From the repo root: `cd frontend`
2. Install deps: `npm install`
3. Copy the example env file: `cp .env.example .env.local` (or `copy` on Windows)
4. Set the API base URL (e.g. `VITE_API_BASE_URL=https://localhost:7182`)
5. Start dev server: `npm run dev` (default `http://localhost:5173`)

## Available Scripts

- `npm run dev` – Vite dev server with live reload
- `npm run build` – production build output in `frontend/dist`
- `npm run preview` – preview the production build locally
- `dotnet run` – launch backend API

## Core Features

- Microsoft Graph client credentials flow for calendar availability
- Room search, selection, booking form, and confirmation UI
- Booking management dashboard (staff view) and login shell
- SendGrid-powered confirmation emails
- Centralized `apiClient.js` for REST calls and error handling

## API Surface (summary)

| Method | Route                          | Purpose                              |
|--------|--------------------------------|--------------------------------------|
| GET    | `/api/bookings/room-types`     | Fetch static room catalog            |
| POST   | `/api/bookings/check-availability` | Validate requested dates against Graph |
| POST   | `/api/bookings/create`         | Create booking, email confirmation   |

See `backend/Controllers/BookingsController.cs` for request/response models.

## Development Notes

- When onboarding collaborators, remind them to create their own backend folder or pull it from a secure storage since Git does not track it here.
- Use HTTPS when calling the API locally; configure Vite proxy if needed.
- Run `dotnet watch run` to auto-reload the API during backend development.

## Roadmap

- Persist bookings in a database instead of relying solely on Graph
- Payment gateway integration
- Admin panel for rate management
- Automated tests (unit + integration) for services and controllers

## License

MIT
