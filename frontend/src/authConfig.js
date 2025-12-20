const defaultRedirectUri =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID ?? '6c881a6d-08ed-483e-933b-939e0306a15d';
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID ?? '5b571081-caff-487c-86da-10b176bd7e45';
const redirectUri = import.meta.env.VITE_MSAL_REDIRECT_URI ?? defaultRedirectUri;
const authority = import.meta.env.VITE_MSAL_AUTHORITY ?? `https://login.microsoftonline.com/${tenantId}`;
const postLogoutRedirectUri =
  import.meta.env.VITE_MSAL_POST_LOGOUT_REDIRECT_URI ?? redirectUri;

// Azure AD configuration for MSAL
export const msalConfig = {
  auth: {
    clientId,
    authority,
    redirectUri,
    postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        console.log(`[MSAL ${level}] ${message}`);
      },
    },
  },
};

// Scopes required for Bookings API
export const loginRequest = {
  scopes: [
    'https://graph.microsoft.com/Bookings.Read.All',
    'https://graph.microsoft.com/BookingsAppointment.ReadWrite.All',
  ],
};

// Silent request configuration
export const silentRequest = {
  scopes: loginRequest.scopes,
  forceRefresh: false,
};
