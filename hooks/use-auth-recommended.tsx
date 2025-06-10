import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { loginRequest } from "@/lib/msal-config";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  jobTitle?: string;
  department?: string;
}

export function useAuthRecommended() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      validateAndSetUser();
    } else {
      setUser(null);
    }
  }, [isAuthenticated, accounts]);

  const validateAndSetUser = async () => {
    try {
      const account = accounts[0];
      
      // Get access token for Microsoft Graph
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: account
      });

      // Validate token and get detailed user info from server
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: tokenResponse.accessToken
        })
      });

      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
      } else {
        // Fallback to client-side user info
        setUser({
          id: account.localAccountId,
          name: account.name || '',
          email: account.username,
          avatar: "/placeholder.svg"
        });
      }
    } catch (error) {
      console.error('User validation error:', error);
      // Fallback to basic client-side info
      const account = accounts[0];
      setUser({
        id: account.localAccountId,
        name: account.name || '',
        email: account.username,
        avatar: "/placeholder.svg"
      });
    }
  };

  const login = async () => {
    setLoading(true);
    try {
      const result = await instance.loginPopup(loginRequest);
      if (result) {
        // User info will be set by the useEffect
        await validateAndSetUser();
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/"
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async (scopes?: string[]) => {
    if (!accounts.length) return null;
    
    try {
      const response = await instance.acquireTokenSilent({
        scopes: scopes || loginRequest.scopes,
        account: accounts[0]
      });
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token:', error);
      return null;
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getAccessToken
  };
}
