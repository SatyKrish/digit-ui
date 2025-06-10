export interface User {
  name: string
  email: string
  avatar: string
}

export interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: () => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

export interface MSALConfig {
  clientId: string
  authority: string
  redirectUri: string
  postLogoutRedirectUri: string
}
