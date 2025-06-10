import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState, useCallback } from "react";
import { User, AuthContextType } from "@/types/auth";
import { loginRequest, graphConfig } from "@/config/msal-config";

/**
 * Enhanced authentication hook with Microsoft Graph integration
 */
export function useAuth(): AuthContextType {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user profile from Microsoft Graph
   */
  const fetchUserProfile = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(graphConfig.graphMeEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn('Could not fetch user profile:', error);
      return null;
    }
  }, []);

  /**
   * Fetch user photo from Microsoft Graph
   */
  const fetchUserPhoto = useCallback(async (accessToken: string): Promise<string | null> => {
    try {
      const response = await fetch(graphConfig.graphPhotoEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const photoBlob = await response.blob();
        return URL.createObjectURL(photoBlob);
      }
      return null;
    } catch (error) {
      console.warn('Could not fetch user photo:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      const loadUserData = async () => {
        const account = accounts[0];
        
        // Get access token for Graph API calls
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account
          });

          // Fetch additional user data from Microsoft Graph
          const [profile, photoUrl] = await Promise.all([
            fetchUserProfile(tokenResponse.accessToken),
            fetchUserPhoto(tokenResponse.accessToken)
          ]);

          const enhancedUser: User = {
            id: account.localAccountId,
            email: account.username,
            name: profile?.displayName || account.name || '',
            avatar: photoUrl || (account.idTokenClaims?.picture as string) || "/placeholder-user.jpg",
            tenantId: account.tenantId || '',
            roles: [],
            jobTitle: profile?.jobTitle || '',
            department: profile?.department || '',
            officeLocation: profile?.officeLocation || ''
          };

          setUser(enhancedUser);
        } catch (error) {
          console.error('Error loading user data:', error);
          // Fallback to basic account info
          setUser({
            id: account.localAccountId,
            email: account.username,
            name: account.name || '',
            avatar: (account.idTokenClaims?.picture as string) || "/placeholder-user.jpg",
            tenantId: account.tenantId || '',
            roles: []
          });
        }
      };

      loadUserData();
    } else {
      setUser(null);
    }
  }, [isAuthenticated, accounts, instance, fetchUserProfile, fetchUserPhoto]);

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

  const getAccessToken = async (scopes?: string[]): Promise<string> => {
    if (!accounts.length) {
      throw new Error('No active account');
    }
    
    try {
      const response = await instance.acquireTokenSilent({
        scopes: scopes || loginRequest.scopes,
        account: accounts[0]
      });
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token:', error);
      throw error;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!isAuthenticated || !accounts.length) return;

    try {
      setError(null);
      const accessToken = await getAccessToken();
      const [profile, photoUrl] = await Promise.all([
        fetchUserProfile(accessToken),
        fetchUserPhoto(accessToken)
      ]);

      if (user && profile) {
        const updatedUser: User = {
          ...user,
          name: profile.displayName || user.name,
          email: profile.mail || profile.userPrincipalName || user.email,
          avatar: photoUrl || user.avatar,
          jobTitle: profile.jobTitle || '',
          department: profile.department || '',
          officeLocation: profile.officeLocation || ''
        };

        setUser(updatedUser);
      }
    } catch (err) {
      console.error('Profile refresh error:', err);
      setError('Failed to refresh profile');
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signOut,
    getAccessToken,
    refreshProfile
  };
}

/**
 * Hook for checking specific user permissions/roles
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  const hasRole = useCallback((role: string): boolean => {
    return isAuthenticated && user?.roles?.includes(role) || false;
  }, [isAuthenticated, user?.roles]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return isAuthenticated && roles.some(role => user?.roles?.includes(role)) || false;
  }, [isAuthenticated, user?.roles]);

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    return isAuthenticated && roles.every(role => user?.roles?.includes(role)) || false;
  }, [isAuthenticated, user?.roles]);

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    roles: user?.roles || []
  };
}
