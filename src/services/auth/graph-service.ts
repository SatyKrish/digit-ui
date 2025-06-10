import { graphConfig } from '@/config/msal-config';
import { authService } from './auth-service';

/**
 * Microsoft Graph service for user profile operations
 */
export class GraphService {
  /**
   * Get user profile from Microsoft Graph
   */
  async getUserProfile(): Promise<any> {
    try {
      const tokenResponse = await authService.acquireTokenSilent(['User.Read']);
      
      const response = await fetch(graphConfig.graphMeEndpoint, {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Graph API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile photo from Microsoft Graph
   */
  async getUserPhoto(): Promise<string | null> {
    try {
      const tokenResponse = await authService.acquireTokenSilent(['User.Read']);
      
      const response = await fetch(graphConfig.graphPhotoEndpoint, {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`
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
  }

  /**
   * Get user's email messages (basic info)
   */
  async getUserMessages(top: number = 10): Promise<any[]> {
    try {
      const tokenResponse = await authService.acquireTokenSilent(['Mail.Read']);
      
      const response = await fetch(`${graphConfig.graphMailEndpoint}?$top=${top}`, {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Graph API error: ${response.status}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching user messages:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const graphService = new GraphService();
