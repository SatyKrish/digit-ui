// Simplified MCP tools preparation
import { tool } from "ai"
import { mcpClient } from "@/client/mcp-client"
import { z } from "zod"
import { MCPError } from "./types"

// Simple cache for tools
let toolsCache: { tools: Record<string, any>; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Simplified JSON Schema to Zod conversion - only handle common cases
 */
function simpleJsonSchemaToZod(schema: any): z.ZodType<any> {
  if (!schema || typeof schema !== 'object') {
    return z.object({})
  }

  if (schema.type === 'object' && schema.properties) {
    const shape: Record<string, z.ZodType<any>> = {}
    
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const prop = propSchema as any
      let zodType: z.ZodType<any>
      
      switch (prop.type) {
        case 'string':
          zodType = z.string()
          break
        case 'number':
          zodType = z.number()
          break
        case 'integer':
          zodType = z.number().int()
          break
        case 'boolean':
          zodType = z.boolean()
          break
        case 'array':
          zodType = z.array(z.any())
          break
        case 'object':
          zodType = z.record(z.any())
          break
        default:
          zodType = z.any()
          break
      }
      
      // Make optional if not required
      if (!schema.required || !schema.required.includes(key)) {
        zodType = zodType.optional()
      }
      
      shape[key] = zodType
    }
    
    return z.object(shape)
  }

  // Fallback for non-object schemas
  switch (schema.type) {
    case 'string':
      return z.object({ value: z.string() })
    case 'number':
      return z.object({ value: z.number() })
    case 'integer':
      return z.object({ value: z.number().int() })
    case 'boolean':
      return z.object({ value: z.boolean() })
    case 'array':
      return z.object({ value: z.array(z.any()) })
    default:
      return z.object({})
  }
}

/**
 * Prepare MCP tools with simplified caching
 */
export async function prepareMcpTools() {
  // Check cache
  if (toolsCache && Date.now() - toolsCache.timestamp < CACHE_TTL) {
    console.log(`[MCP] Using cached tools`)
    return {
      tools: toolsCache.tools,
      servers: mcpClient.getAvailableServers(),
      connectedServers: mcpClient.getConnectedServers()
    }
  }

  const servers = mcpClient.getAvailableServers()
  const connectedServers = mcpClient.getConnectedServers()
  const availableTools = mcpClient.getAllTools()

  console.log(`[MCP] Building ${availableTools.length} tools from ${connectedServers.length} servers`)
  
  const tools: Record<string, any> = {}

  // Build MCP tools
  for (const mcpTool of availableTools) {
    const server = servers.find(s => s.id === mcpTool.serverId)
    if (!server || server.status !== 'connected') {
      continue
    }

    try {
      tools[mcpTool.name] = tool({
        description: mcpTool.description,
        parameters: simpleJsonSchemaToZod(mcpTool.inputSchema),
        execute: async (args: any) => {
          console.log(`[MCP] Calling ${mcpTool.name}`)
          const result = await mcpClient.callTool(mcpTool.serverId, mcpTool.name, args)
          
          if (!result.success) {
            throw new MCPError(result.error || 'Tool execution failed', mcpTool.serverId)
          }
          return result.data
        },
      })
    } catch (error) {
      console.error(`[MCP] Failed to prepare tool ${mcpTool.name}:`, error)
    }
  }

  // Cache the tools
  toolsCache = { tools, timestamp: Date.now() }

  return { tools, servers, connectedServers }
}
