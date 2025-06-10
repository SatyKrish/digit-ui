export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  status: number
}

export interface ChatApiRequest {
  messages: any[]
  id?: string
  data?: any
}

export interface ChatApiResponse {
  response: string
  artifacts?: any[]
}

export interface AuthConfigResponse {
  clientId: string
  authority: string
  redirectUri: string
  postLogoutRedirectUri: string
}

export interface HealthCheckResponse {
  status: "ok" | "error"
  timestamp: string
  version?: string
}
