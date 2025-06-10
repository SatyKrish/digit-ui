import { NextRequest, NextResponse } from 'next/server';
import { ConfidentialClientApplication } from '@azure/msal-node';

// Server-side MSAL configuration (more secure)
const serverMsalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!, // Server-side env var (no NEXT_PUBLIC_)
    clientSecret: process.env.AZURE_CLIENT_SECRET!, // Server-side secret
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
  },
};

// Create confidential client application (server-side only)
const cca = new ConfidentialClientApplication(serverMsalConfig);

// API route for server-side token validation and user info
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    // Validate token and get user info from Microsoft Graph
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userInfo = await response.json();
    
    // Get user photo
    let photoUrl = null;
    try {
      const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (photoResponse.ok) {
        const photoBlob = await photoResponse.blob();
        // Convert to base64 or upload to your storage
        photoUrl = `/api/user-photo/${userInfo.id}`; // Implement photo endpoint
      }
    } catch (photoError) {
      console.warn('Could not fetch user photo:', photoError);
    }

    // Return sanitized user info
    return NextResponse.json({
      user: {
        id: userInfo.id,
        name: userInfo.displayName,
        email: userInfo.mail || userInfo.userPrincipalName,
        avatar: photoUrl || '/placeholder.svg',
        jobTitle: userInfo.jobTitle,
        department: userInfo.department,
      }
    });

  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// On-behalf-of flow for accessing additional Microsoft Graph APIs
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userToken = authHeader?.replace('Bearer ', '');

    if (!userToken) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Use on-behalf-of flow to get token for server-side operations
    const oboRequest = {
      oboAssertion: userToken,
      scopes: ['https://graph.microsoft.com/User.Read', 'https://graph.microsoft.com/Mail.Read'],
    };

    const response = await cca.acquireTokenOnBehalfOf(oboRequest);
    
    if (response) {
      // Use the new token for server-side Microsoft Graph calls
      return NextResponse.json({ 
        message: 'Server-side token acquired successfully',
        // Don't return the actual token to client
      });
    } else {
      return NextResponse.json({ error: 'Failed to acquire server token' }, { status: 500 });
    }

  } catch (error) {
    console.error('On-behalf-of flow error:', error);
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
  }
}
