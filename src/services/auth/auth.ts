export interface User {
  id: string
  name: string
  email: string
  avatar: string
  roles?: string[]
  tenantId?: string
  // The following fields are no longer populated to avoid Graph API dependency
  // jobTitle?: string  // Removed - requires Graph API
  // department?: string  // Removed - requires Graph API  
  // officeLocation?: string  // Removed - requires Graph API
}

export interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
  error?: string | null
  getAccessToken?: () => Promise<string | null>
  refreshProfile?: () => Promise<void>
}

export interface MSALConfig {
  clientId: string
  authority: string
  redirectUri: string
  postLogoutRedirectUri: string
}
