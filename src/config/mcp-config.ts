import { env } from "./env"

export interface MCPServerConfig {
  id: string
  name: string
  description: string
  url?: string
  transport: 'stdio' | 'http' | 'sse' | 'websocket'
  command?: string
  args?: string[]
  enabled: boolean
  /** Enable fallback mode when server URL is not configured */
  fallback?: boolean
}

/**
 * Default MCP server configurations
 * These can be overridden by environment variables
 */
export const defaultMCPServers: MCPServerConfig[] = [
  {
    id: "database-server",
    name: "Database Server",
    description: "Provides database query capabilities and schema introspection",
    url: env.MCP_DATABASE_SERVER_URL || undefined,
    transport: "http",
    enabled: true,
    fallback: true
  },
  {
    id: "analytics-server", 
    name: "Analytics Server",
    description: "Generates reports, visualizations, and analytical insights",
    url: env.MCP_ANALYTICS_SERVER_URL || undefined,
    transport: "http",
    enabled: true,
    fallback: true
  },
  {
    id: "file-server",
    name: "File Server", 
    description: "File system operations, reading, writing, and searching files",
    url: env.MCP_FILE_SERVER_URL || undefined,
    transport: "http",
    enabled: true,
    fallback: true
  }
]

/**
 * Get active MCP server configurations
 */
export const getActiveMCPServers = (): MCPServerConfig[] => {
  if (!env.ENABLE_MCP) {
    return []
  }

  return defaultMCPServers.filter(server => {
    // Always include servers with URLs
    if (server.url) {
      return server.enabled
    }
    
    // Only include servers without URLs if fallback is enabled globally and per-server
    return server.enabled && server.fallback && env.ENABLE_MCP_FALLBACK
  })
}

/**
 * MCP transport configuration
 */
export const mcpTransportConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  connectionTimeout: 10000,
  requestTimeout: 30000,
  keepAliveInterval: 30000
} as const
