import { apiClient } from "./client"
import { API_ROUTES } from "@/constants/routes"
import type { AuthConfigResponse, HealthCheckResponse, ChatApiRequest, ChatApiResponse } from "@/types/api"

export const authApi = {
  getConfig: () => apiClient.get<AuthConfigResponse>(API_ROUTES.AUTH_CONFIG),
  validate: () => apiClient.get(API_ROUTES.AUTH_VALIDATE),
}

export const chatApi = {
  sendMessage: (data: ChatApiRequest) => 
    apiClient.post<ChatApiResponse>(API_ROUTES.CHAT, data),
}

export const healthApi = {
  check: () => apiClient.get<HealthCheckResponse>(API_ROUTES.HEALTH),
}
