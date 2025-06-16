import { mcpClient } from "@/client/mcp-client"
import { jsonSchemaToZod, TOOL_CACHE_TTL } from "./schema-utils"
import { MCPError } from "./types"

// MCP tools cache
let mcpToolsCache: { tools: Record<string, any>; timestamp: number } | null = null

/**
 * Dynamically prepare MCP tools with caching for performance
 */
export async function prepareMcpTools() {
  // Check cache first
  if (mcpToolsCache && Date.now() - mcpToolsCache.timestamp < TOOL_CACHE_TTL) {
    console.log(`[MCP] Using cached tools (${Object.keys(mcpToolsCache.tools).length} tools)`)
    return { 
      tools: mcpToolsCache.tools, 
      servers: mcpClient.getAvailableServers(),
      connectedServers: mcpClient.getConnectedServers(),
      availableTools: mcpClient.getAllTools()
    }
  }

  const servers = mcpClient.getAvailableServers()
  const connectedServers = mcpClient.getConnectedServers()
  const availableTools = mcpClient.getAllTools()

  console.log(`[MCP] Building tools: ${connectedServers.length}/${servers.length} servers connected, ${availableTools.length} tools available`)
  
  const tools: Record<string, any> = {}

  // Build MCP tools with better error handling
  for (const mcpTool of availableTools) {
    const server = servers.find(s => s.id === mcpTool.serverId)
    if (!server || server.status !== 'connected') {
      continue
    }

    try {
      tools[mcpTool.name] = {
        description: mcpTool.description,
        parameters: jsonSchemaToZod(mcpTool.inputSchema),
        execute: async (args: any) => {
          const startTime = Date.now()
          try {
            console.log(`[MCP] Calling ${mcpTool.name} on ${mcpTool.serverId}`)
            const result = await mcpClient.callTool(mcpTool.serverId, mcpTool.name, args)
            
            const duration = Date.now() - startTime
            console.log(`[MCP] Tool ${mcpTool.name} completed in ${duration}ms`)
            
            if (!result.success) {
              throw new MCPError(result.error || 'Tool execution failed', mcpTool.serverId)
            }
            return result.data
          } catch (error) {
            const duration = Date.now() - startTime
            console.error(`[MCP] Tool ${mcpTool.name} failed after ${duration}ms:`, error)
            
            if (error instanceof MCPError) {
              throw error
            }
            throw new MCPError(
              error instanceof Error ? error.message : 'Unknown error',
              mcpTool.serverId
            )
          }
        },
      }
    } catch (error) {
      console.error(`[MCP] Failed to prepare tool ${mcpTool.name}:`, error)
      // Continue with other tools even if one fails
    }
  }

  // Cache the tools
  mcpToolsCache = {
    tools,
    timestamp: Date.now()
  }

  return { tools, servers, connectedServers, availableTools }
}
