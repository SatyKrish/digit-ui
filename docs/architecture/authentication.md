# Authentication Architecture

## Overview

The application uses Microsoft Azure AD for authentication via the MSAL (Microsoft Authentication Library) for JavaScript.

## Components

### Authentication Flow
1. User visits application
2. Redirected to Azure AD login
3. Azure AD returns authorization code
4. MSAL exchanges code for tokens
5. User authenticated and can access protected resources

### Key Components

#### `/src/components/features/auth/`
- `auth-screen.tsx` - Login/logout interface
- `msal-provider.tsx` - Client-side MSAL configuration
- `msal-provider-server-side.tsx` - Server-side MSAL setup

#### `/src/config/azure.ts`
- Azure AD configuration
- MSAL cache settings
- Logging configuration

#### `/src/hooks/use-auth.tsx`
- Authentication state management
- Login/logout functions
- User session handling

## Security Considerations

1. **Server-side Configuration**: Sensitive Azure AD settings are kept server-side
2. **Token Management**: MSAL handles token refresh automatically
3. **Secure Storage**: Tokens stored in localStorage with appropriate security measures
4. **HTTPS Only**: Production deployments must use HTTPS

## Configuration

### Environment Variables
```env
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
AZURE_REDIRECT_URI=https://yourdomain.com
AZURE_POST_LOGOUT_REDIRECT_URI=https://yourdomain.com
```

### Azure AD App Registration
1. Register application in Azure portal
2. Configure redirect URIs
3. Set up client secret (for production)
4. Configure API permissions

## Error Handling

Common authentication errors and solutions:
- `AADSTS50011`: Redirect URI mismatch
- `AADSTS700016`: Application not found
- `AADSTS70002`: Credentials validation failed
