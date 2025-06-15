import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState, useCallback } from "react";
import { User, AuthContextType } from "@/types/auth";
import { loginRequest } from "@/config/msal-config";

/**
 * Enhanced authentication hook with minimal claims from ID token
 * Uses only standard OpenID Connect claims to avoid admin consent requirements
 */
export function useAuth(): AuthContextType {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      const loadUserData = async () => {
        setIsInitializing(true);
        const account = accounts[0];
        
        try {
          // Extract user information from ID token claims and account info
          // This avoids the need for Graph API calls and admin consent
          const idTokenClaims = account.idTokenClaims;
          
          const user: User = {
            id: account.localAccountId,
            email: account.username, // This is the user's email/UPN
            name: idTokenClaims?.name || account.name || idTokenClaims?.preferred_username || '',
          };

          setUser(user);
        } catch (error) {
          console.error('Error loading user data:', error);
          setError('Failed to load user information');
        } finally {
          setIsInitializing(false);
        }
      };

      loadUserData();
    } else {
      setUser(null);
      setIsInitializing(false);
    }
  }, [isAuthenticated, accounts, instance]);

  const signIn = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!accounts.length) {
      return null;
    }
    
    try {
      const response = await instance.acquireTokenSilent({
        scopes: loginRequest.scopes,
        account: accounts[0]
      });
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token:', error);
      setError('Failed to acquire access token');
      return null;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user || !isAuthenticated || accounts.length === 0) return;

    try {
      const account = accounts[0];
      const idTokenClaims = account.idTokenClaims;
      
      const updatedUser: User = {
        ...user,
        name: idTokenClaims?.name || account.name || idTokenClaims?.preferred_username || user.name,
        email: account.username || user.email,
      };

      setUser(updatedUser);
    } catch (err) {
      console.error('Profile refresh error:', err);
      setError('Failed to refresh profile');
    }
  };

  return {
    user,
    isLoading: isLoading || isInitializing,
    isAuthenticated: isAuthenticated && !!user && !isInitializing,
    error,
    signIn,
    signOut,
    getAccessToken,
    refreshProfile
  };
}

/**
 * Hook for checking specific user permissions/roles
 * Note: Roles functionality is simplified since we removed roles from User interface
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  const hasRole = useCallback((role: string): boolean => {
    // Always return false since roles are not available in minimal claims
    return false;
  }, [isAuthenticated]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    // Always return false since roles are not available in minimal claims
    return false;
  }, [isAuthenticated]);

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    // Always return false since roles are not available in minimal claims
    return false;
  }, [isAuthenticated]);

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    roles: [] // Always empty array since roles are not available
  };
}
