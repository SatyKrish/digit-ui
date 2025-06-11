import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"

// Client-safe transport configuration
const mcpTransportConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  connectionTimeout: 10000,
  requestTimeout: 30000,
  keepAliveInterval: 30000
} as const

interface MCPServerConfig {
  id: string
  name: string
  description: string
  url?: string
  transport: 'stdio' | 'http' | 'sse' | 'websocket'
  command?: string
  args?: string[]
  enabled: boolean
}

// Client-safe MCP server configuration - no server-side env imports
const getActiveMCPServers = (): MCPServerConfig[] => {
  // Default server configurations for client-side use
  // URLs will be empty if not configured, servers will show as disconnected
  return [
    {
      id: "database-server",
      name: "Database Server",
      description: "Provides database query capabilities and schema introspection",
      url: undefined, // Will be populated by server if available
      transport: "http",
      enabled: true
    },
    {
      id: "analytics-server", 
      name: "Analytics Server",
      description: "Generates reports, visualizations, and analytical insights",
      url: undefined, // Will be populated by server if available
      transport: "http",
      enabled: false
    },
    {
      id: "file-server",
      name: "File Server", 
      description: "File system operations, reading, writing, and searching files",
      url: undefined, // Will be populated by server if available
      transport: "http",
      enabled: false
    }
  ]
}

// MCP Server types
export interface MCPServer {
  id: string
  name: string
  description: string
  status: "connected" | "disconnected" | "error" | "connecting"
  tools: string[]
  error?: string
  url?: string
}

export interface MCPTool {
  name: string
  description: string
  serverId: string
  serverName: string
  inputSchema: {
    type: string
    properties?: Record<string, any>
    required?: string[]
  }
}

export interface MCPToolResult {
  success: boolean
  data?: any
  error?: string
}

interface ConnectedMCPClient {
  client: Client
  transport: StreamableHTTPClientTransport | SSEClientTransport
  config: MCPServerConfig
}

// MCP Client class
class MCPClientImpl {
  private servers: MCPServer[] = []
  private tools: MCPTool[] = []
  private clients: Map<string, ConnectedMCPClient> = new Map()
  private isInitialized = false
  private connectionRetries: Map<string, number> = new Map()

  constructor() {
    this.initializeServers()
  }

  // Initialize the client with configured MCP servers
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    console.log('Initializing MCP client...')
    
    // Initialize servers from configuration
    this.initializeServers()
    
    // Connect to all enabled servers that have URLs configured
    const connectionPromises = this.servers
      .filter(server => server.url) // Only attempt connection if URL is configured
      .map(server => 
        this.connectToServer(server.id).catch(error => {
          console.warn(`Failed to connect to server ${server.id}:`, error)
          return null
        })
      )

    await Promise.allSettled(connectionPromises)
    this.isInitialized = true
    
    const connectedCount = this.getConnectedServers().length
    const totalServers = this.servers.length
    console.log(`MCP client initialized. Connected servers: ${connectedCount}/${totalServers}, Total tools: ${this.tools.length}`)
  }

  // Initialize servers from configuration
  private initializeServers(): void {
    const configs = getActiveMCPServers()
    
    this.servers = configs.map(config => ({
      id: config.id,
      name: config.name,
      description: config.description,
      status: "disconnected" as const,
      tools: [],
      url: config.url
    }))
  }

  // Add a new MCP server
  async addServer(serverConfig: {
    id: string
    name: string
    description: string
    url: string
  }): Promise<MCPServer> {
    try {
      const server: MCPServer = {
        ...serverConfig,
        status: "disconnected",
        tools: [],
      }

      // Check if server already exists
      const existingIndex = this.servers.findIndex(s => s.id === serverConfig.id)
      if (existingIndex >= 0) {
        this.servers[existingIndex] = server
      } else {
        this.servers.push(server)
      }

      return server
    } catch (error) {
      throw new Error(`Failed to add server: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Remove an MCP server
  async removeServer(serverId: string): Promise<void> {
    const serverIndex = this.servers.findIndex(s => s.id === serverId)
    if (serverIndex === -1) {
      throw new Error(`Server ${serverId} not found`)
    }

    // Disconnect if connected
    await this.disconnectFromServer(serverId)

    // Remove server's tools
    this.tools = this.tools.filter(tool => tool.serverId !== serverId)
    
    // Remove server
    this.servers.splice(serverIndex, 1)
  }

  // Connect to an MCP server
  async connectToServer(serverId: string): Promise<MCPServer> {
    const server = this.servers.find(s => s.id === serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }

    if (server.status === "connected") {
      return server
    }

    if (!server.url) {
      // No URL configured - mark as disconnected
      server.status = "disconnected"
      server.error = "No URL configured for this server"
      return server
    }

    server.status = "connecting"
    
    try {
      const client = new Client({
        name: 'digit-ui-client',
        version: '1.0.0'
      })

      let transport: StreamableHTTPClientTransport | SSEClientTransport

      // Try modern Streamable HTTP first, fallback to SSE
      try {
        transport = new StreamableHTTPClientTransport(new URL(server.url))
        await client.connect(transport)
        console.log(`Connected to ${serverId} using Streamable HTTP transport`)
      } catch (error) {
        console.log(`Streamable HTTP failed for ${serverId}, trying SSE transport`)
        transport = new SSEClientTransport(new URL(server.url))
        await client.connect(transport)
        console.log(`Connected to ${serverId} using SSE transport`)
      }

      // Store the connected client
      const serverConfig = getActiveMCPServers().find(c => c.id === serverId)
      if (serverConfig) {
        this.clients.set(serverId, { client, transport, config: serverConfig })
      }

      server.status = "connected"
      server.error = undefined
      this.connectionRetries.delete(serverId)

      // Fetch and register tools
      await this.refreshServerTools(serverId)
      
      return server
    } catch (error) {
      server.status = "error"
      server.error = error instanceof Error ? error.message : 'Connection failed'
      
      // Implement retry logic
      const retries = this.connectionRetries.get(serverId) || 0
      if (retries < mcpTransportConfig.retryAttempts) {
        this.connectionRetries.set(serverId, retries + 1)
        console.log(`Retrying connection to ${serverId} (attempt ${retries + 1}/${mcpTransportConfig.retryAttempts})`)
        
        setTimeout(() => {
          this.connectToServer(serverId).catch(console.error)
        }, mcpTransportConfig.retryDelay * (retries + 1))
      }

      throw error
    }
  }

  // Disconnect from an MCP server
  async disconnectFromServer(serverId: string): Promise<void> {
    const server = this.servers.find(s => s.id === serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }

    try {
      const connectedClient = this.clients.get(serverId)
      if (connectedClient) {
        await connectedClient.client.close()
        this.clients.delete(serverId)
      }

      server.status = "disconnected"
      server.error = undefined
      
      // Remove server's tools from available tools
      this.tools = this.tools.filter(tool => tool.serverId !== serverId)
    } catch (error) {
      server.status = "error"
      server.error = error instanceof Error ? error.message : 'Disconnection failed'
      throw error
    }
  }

  // Get all available MCP servers
  getAvailableServers(): MCPServer[] {
    return [...this.servers]
  }

  // Get all connected MCP servers 
  getConnectedServers(): MCPServer[] {
    return this.servers.filter((server) => server.status === "connected")
  }

  // Get all tools from all servers
  getAllTools(): MCPTool[] {
    return [...this.tools]
  }

  // Get tools for a specific server
  getServerTools(serverId: string): MCPTool[] {
    return this.tools.filter((tool) => tool.serverId === serverId)
  }

  // Call a tool on a specific server
  async callTool(serverId: string, toolName: string, args: any): Promise<MCPToolResult> {
    console.log(`Calling tool ${toolName} on server ${serverId} with args:`, args)

    // Find the server
    const server = this.servers.find(s => s.id === serverId)
    if (!server) {
      return {
        success: false,
        error: `Server ${serverId} not found`,
      }
    }

    // Check if server is connected
    if (server.status !== "connected") {
      return {
        success: false,
        error: `Server ${serverId} is not connected (status: ${server.status})`,
      }
    }

    // Find the tool
    const tool = this.tools.find((t) => t.serverId === serverId && t.name === toolName)
    if (!tool) {
      return {
        success: false,
        error: `Tool ${toolName} not found on server ${serverId}`,
      }
    }

    const connectedClient = this.clients.get(serverId)
    
    if (!connectedClient) {
      return {
        success: false,
        error: `No active connection to server ${serverId}`,
      }
    }

    try {
      const result = await connectedClient.client.callTool({
        name: toolName,
        arguments: args
      })
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Refresh tools for a specific server
  async refreshServerTools(serverId: string): Promise<MCPTool[]> {
    const server = this.servers.find(s => s.id === serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }

    if (server.status !== "connected") {
      throw new Error(`Server ${serverId} is not connected`)
    }

    const connectedClient = this.clients.get(serverId)
    
    if (!connectedClient) {
      throw new Error(`No active connection to server ${serverId}`)
    }

    try {
      // Query the server for its available tools
      const toolsList = await connectedClient.client.listTools()
      
      // Remove old tools for this server
      this.tools = this.tools.filter(tool => tool.serverId !== serverId)
      
      // Add new tools from server response
      const newTools: MCPTool[] = toolsList.tools.map(tool => ({
        name: tool.name,
        description: tool.description || `Tool: ${tool.name}`,
        serverId,
        serverName: server.name,
        inputSchema: tool.inputSchema as MCPTool['inputSchema']
      }))

      this.tools.push(...newTools)
      
      // Update server's tool list
      server.tools = newTools.map(t => t.name)
      
      return newTools
    } catch (error) {
      throw new Error(`Failed to refresh tools for server ${serverId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get server status
  getServerStatus(serverId: string): MCPServer | null {
    return this.servers.find(s => s.id === serverId) || null
  }

  // Check if client is initialized
  isReady(): boolean {
    return this.isInitialized
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map(serverId =>
      this.disconnectFromServer(serverId).catch(console.error)
    )
    
    await Promise.allSettled(disconnectPromises)
    this.clients.clear()
    this.tools = []
    this.isInitialized = false
  }
}

// Export singleton instance
export const mcpClient = new MCPClientImpl()

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  // Client-side initialization
  mcpClient.initialize().catch(console.error)
} else {
  // Server-side: initialize lazily
  process.nextTick(() => {
    mcpClient.initialize().catch(console.error)
  })
}
