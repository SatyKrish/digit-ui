import { Configuration, PopupRequest } from "@azure/msal-browser";

// Client-side MSAL configuration (for initial authentication only)
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '/',
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI || '/',
  },
  cache: {
    cacheLocation: "sessionStorage", // More secure than localStorage
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          switch (level) {
            case 'Error':
              console.error('MSAL Error:', message);
              return;
            case 'Warning':
              console.warn('MSAL Warning:', message);
              return;
            case 'Info':
              console.info('MSAL Info:', message);
              return;
            default:
              return;
          }
        }
      },
      piiLoggingEnabled: false // Never log PII
    }
  }
};

// Minimal scopes for initial authentication (client-side)
export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
  prompt: "select_account"
};

// Server-side token requests (to be used in API routes)
export const serverSideScopes = {
  // Basic user info
  userRead: ["https://graph.microsoft.com/User.Read"],
  // Additional scopes for server-side operations
  mailRead: ["https://graph.microsoft.com/Mail.Read"],
  calendarRead: ["https://graph.microsoft.com/Calendars.Read"],
  // Add more as needed
};

// Microsoft Graph endpoints
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphPhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value",
  graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/messages",
};
