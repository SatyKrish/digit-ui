export interface User {
  id: string
  name: string
  email: string
  avatar: string
  roles?: string[]
  jobTitle?: string
  tenantId?: string
  department?: string
  officeLocation?: string
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
