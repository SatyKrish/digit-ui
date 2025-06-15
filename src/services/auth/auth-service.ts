import { AuthenticationResult, PublicClientApplication, SilentRequest } from '@azure/msal-browser';
import { User, AuthContextType } from '@/types/auth';
import { getMsalConfig, loginRequest } from '@/config/msal-config';

/**
 * Authentication service for handling MSAL operations
 */
export class AuthService {
  private msalInstance: PublicClientApplication | null = null;

  /**
   * Initialize MSAL instance
   */
  async initialize(): Promise<PublicClientApplication> {
    if (this.msalInstance) {
      return this.msalInstance;
    }

    const msalConfig = await getMsalConfig();
    this.msalInstance = new PublicClientApplication(msalConfig);
    await this.msalInstance.initialize();
    
    return this.msalInstance;
  }

  /**
   * Sign in user with popup
   */
  async signIn(): Promise<AuthenticationResult> {
    const msalInstance = await this.initialize();
    return await msalInstance.loginPopup(loginRequest);
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    const msalInstance = await this.initialize();
    await msalInstance.logoutPopup();
  }

  /**
   * Get active account
   */
  async getActiveAccount(): Promise<User | null> {
    const msalInstance = await this.initialize();
    const account = msalInstance.getActiveAccount();
    
    if (!account) {
      return null;
    }

    return {
      id: account.localAccountId,
      email: account.username,
      name: account.name || '',
    };
  }

  /**
   * Acquire token silently
   */
  async acquireTokenSilent(scopes: string[]): Promise<AuthenticationResult> {
    const msalInstance = await this.initialize();
    const account = msalInstance.getActiveAccount();
    
    if (!account) {
      throw new Error('No active account found');
    }

    const silentRequest: SilentRequest = {
      scopes,
      account
    };

    return await msalInstance.acquireTokenSilent(silentRequest);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const msalInstance = await this.initialize();
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0;
  }

  /**
   * Handle redirect promise
   */
  async handleRedirectPromise(): Promise<AuthenticationResult | null> {
    const msalInstance = await this.initialize();
    return await msalInstance.handleRedirectPromise();
  }
}

// Export singleton instance
export const authService = new AuthService();
