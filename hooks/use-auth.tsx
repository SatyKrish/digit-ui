import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { AccountInfo } from "@azure/msal-browser";
import { useEffect, useState } from "react";
import { loginRequest } from "@/lib/msal-config";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export function useAuth() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      const account = accounts[0];
      setUser({
        id: account.localAccountId,
        name: account.name || '',
        email: account.username,
        avatar: (account.idTokenClaims?.picture as string) || "/placeholder.svg" // Provide default avatar
      });
    } else {
      setUser(null);
    }
  }, [isAuthenticated, accounts]);

  const login = async () => {
    setLoading(true);
    try {
      await instance.loginPopup(loginRequest);
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

  const getAccessToken = async () => {
    if (!accounts.length) return null;
    
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
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
