import { streamText, convertToCoreMessages } from "ai"
import { mcpClient } from "@/client/mcp-client"
import { chatService } from "@/services/chat/chat-service"
import { env } from "@/config/env"
import { getOpenAIModel, openaiConfig } from "@/config/openai"

/**
 * Dynamically prepare MCP tools from connected servers
 * Only includes tools from servers that are actually connected and available
 * 
 * This fixes the issue where the chat route was hardcoding tool definitions
 * instead of dynamically retrieving them from MCP servers
 */
async function prepareMcpTools() {
  const servers = mcpClient.getAvailableServers()
  const connectedServers = mcpClient.getConnectedServers()
  const availableTools = mcpClient.getAllTools()

  console.log(`MCP Status: ${connectedServers.length}/${servers.length} servers connected, ${availableTools.length} tools available`)
  
  const tools: Record<string, any> = {}

  // Only create tools for connected servers and their available tools
  for (const tool of availableTools) {
    // Check if the server is connected
    const server = servers.find(s => s.id === tool.serverId)
    if (!server || server.status !== 'connected') {
      console.log(`Skipping tool ${tool.name} from ${tool.serverId} - server not connected (status: ${server?.status})`)
      continue
    }

    tools[tool.name] = {
      description: tool.description,
      parameters: tool.inputSchema,
      execute: async (args: any) => {
        try {
          console.log(`Executing tool ${tool.name} on ${tool.serverId} with args:`, args)
          const result = await mcpClient.callTool(tool.serverId, tool.name, args)
          if (!result.success) {
            console.error(`Tool execution failed for ${tool.name}:`, result.error)
            return { error: result.error }
          }
          return result.data
        } catch (error) {
          console.error(`Error executing tool ${tool.name}:`, error)
          return { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      },
    }
  }

  console.log(`Created ${Object.keys(tools).length} dynamic tools from ${connectedServers.length} connected servers`)
  if (Object.keys(tools).length === 0 && connectedServers.length === 0) {
    console.warn('No connected MCP servers found - no tools will be available to the AI model')
  }

  return { tools, servers, connectedServers, availableTools }
}

export async function POST(req: Request) {
  const { messages, id, userId } = await req.json()

  // Initialize chat service for user if userId is provided
  if (userId) {
    await chatService.initializeForUser({
      id: userId,
      email: userId,
      name: 'User'
    })
  }

  // Ensure MCP client is properly initialized before processing the request
  if (!mcpClient.isReady()) {
    console.log('MCP client not ready, initializing...')
    await mcpClient.initialize()
  }

  const { tools, servers, connectedServers, availableTools } = await prepareMcpTools()

  const systemPrompt = `You are DIGIT, an enterprise data intelligence assistant powered by MCP (Model Context Protocol). You help data analysts and product owners discover insights from their data.

You have access to MCP servers that provide real data access:

**Available MCP Servers:**
${connectedServers.length > 0 
  ? connectedServers.map((server) => `- ${server.name}: ${server.description} (${server.tools.length} tools available)`).join("\n")
  : "No MCP servers are currently connected. Please check server configuration and connectivity."
}

**Available Tools by Server:**
${connectedServers.length > 0
  ? connectedServers.map(
      (server) => `${server.name}:
${server.tools.length > 0 
  ? server.tools.map((tool) => `  - ${tool}`).join("\n")
  : "  No tools available"
}`,
    ).join("\n\n")
  : "No tools available - no servers connected"
}

**Connected Servers Status:**
- Total configured servers: ${servers.length}
- Connected servers: ${connectedServers.length}
- Available tools: ${Object.keys(tools).length}

**Instructions:**
${connectedServers.length > 0 
  ? `1. When users ask about data, use the appropriate MCP tools to fetch real information
2. Available tool categories:
   ${connectedServers.map(server => {
     const serverTools = availableTools.filter(t => t.serverId === server.id)
     return `   - ${server.name}: ${serverTools.map(t => t.name).join(', ')}`
   }).join('\n   ')}
3. Always explain what data you're fetching and present results clearly
4. Create appropriate artifacts (charts, tables, etc.) from the tool results`
  : `1. Currently no MCP servers are connected, so I cannot access external data sources
2. Please ensure MCP servers are properly configured and running
3. Check server URLs in environment variables and server connectivity`
}

When generating artifacts, use these formats:

1. **Code blocks**: Use \`\`\`language\ncode\n\`\`\` format
2. **Mermaid diagrams**: Use \`\`\`mermaid\ndiagram\n\`\`\` format
3. **Interactive charts**: Use \`\`\`json:chart:type\n{"data": [...], "title": "Chart Title"}\n\`\`\`
   - Supported chart types: bar, line, pie
   - Data format: [{"name": "Category", "value": 123}, ...]
4. **Data tables**: Use \`\`\`json:table\n{"data": [...], "title": "Table Title"}\n\`\`\`
   - Data format: [{"column1": "value1", "column2": 123}, ...]
5. **KPI visualizations**: Use \`\`\`json:visualization:kpi\n{"data": [...], "title": "KPI Dashboard"}\n\`\`\`
   - Data format: [{"title": "Metric", "value": 123, "change": 5.2, "trend": "up"}, ...]
6. **Heatmaps**: Use \`\`\`json:heatmap\n{"data": [...], "title": "Heatmap Title"}\n\`\`\`
   - Data format: [{"x": "Category1", "y": "Category2", "value": 75}, ...]
7. **Treemaps**: Use \`\`\`json:treemap\n{"name": "Root", "children": [...], "title": "Treemap Title"}\n\`\`\`
   - Data format: {"name": "Root", "children": [{"name": "Category", "value": 123, "children": [...]}]}

Always provide clear, professional responses suitable for enterprise use.
${connectedServers.length > 0 
  ? `Available domains: ${connectedServers.map(s => s.name).join(', ')}`
  : 'No data domains available - servers disconnected'
}`

  const result = await streamText({
    model: getOpenAIModel(openaiConfig.model),
    system: systemPrompt,
    messages: convertToCoreMessages(messages),
    tools,
    maxSteps: 5,
    onFinish: async ({ response, finishReason, usage, text }) => {
      // Save messages to database if userId is provided
      if (userId && id) {
        try {
          // Initialize user and get or create session
          await chatService.initializeForUser({
            id: userId,
            email: userId,
            name: 'User'
          })

          // Use the getOrCreateSession method which handles both cases
          await chatService.getOrCreateSession(id)

          // Save the user message (last message in the input)
          const userMessage = messages[messages.length - 1]
          if (userMessage && userMessage.role === 'user') {
            await chatService.addMessage({
              role: 'user',
              content: userMessage.content,
              model: 'gpt-4o'
            })
          }

          // Save the assistant response using the text content
          if (text) {
            await chatService.addMessage({
              role: 'assistant',
              content: text,
              model: 'gpt-4o'
            })
          }
        } catch (error) {
          console.error('Failed to save messages to database:', error)
        }
      }
    }
  })

  return result.toDataStreamResponse()
}
