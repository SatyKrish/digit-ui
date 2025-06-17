export interface MCPServerConfig {
  id: string
  name: string
  description: string
  url?: string
  transport: 'stdio' | 'http' | 'websocket'
  command?: string
  args?: string[]
  enabled: boolean
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
    url: process.env.MCP_DATABASE_SERVER_URL || undefined,
    transport: "http",
    enabled: !!process.env.MCP_DATABASE_SERVER_URL // Only enable if URL is configured
  },
  {
    id: "analytics-server", 
    name: "Analytics Server",
    description: "Generates reports, visualizations, and analytical insights",
    url: process.env.MCP_ANALYTICS_SERVER_URL || undefined,
    transport: "http",
    enabled: !!process.env.MCP_ANALYTICS_SERVER_URL // Only enable if URL is configured
  },
  {
    id: "file-server",
    name: "File Server", 
    description: "File system operations, reading, writing, and searching files",
    url: process.env.MCP_FILE_SERVER_URL || undefined,
    transport: "http",
    enabled: !!process.env.MCP_FILE_SERVER_URL // Only enable if URL is configured
  }
]

/**
 * Get active MCP server configurations
 * SERVER-SIDE ONLY - Do not import this in client-side code
 */
export const getActiveMCPServers = (): MCPServerConfig[] => {
  if (!process.env.ENABLE_MCP) {
    return []
  }

  return defaultMCPServers.filter(server => server.enabled)
}

/**
 * MCP transport configuration
 */
export const mcpTransportConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  connectionTimeout: 15000,    // Increased from 10s to 15s
  requestTimeout: 150000,      // Increased from 30s to 150s (2.5 minutes) to handle longer queries
  keepAliveInterval: 30000,
  preferredTransport: 'http' as const // Use Streamable HTTP only
} as const
