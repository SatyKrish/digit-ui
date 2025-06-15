import { streamText, convertToCoreMessages, tool } from "ai"
import { mcpClient } from "@/client/mcp-client"
import { chatPersistence } from "@/services/chat/chat-persistence"
import { env } from "@/config/env"
import { getAzureOpenAIModel, azureOpenAIConfig } from "@/config/azure-openai"
import { z } from "zod"
import { 
  artifactKinds 
} from "@/lib/artifacts/server"
import { generateUUID } from "@/lib/utils"
import type { ArtifactKind } from "@/lib/artifacts/types"

/**
 * Convert JSON Schema to Zod schema for Vercel AI SDK compatibility
 */
function jsonSchemaToZod(schema: any): z.ZodType<any> {
  if (!schema || typeof schema !== 'object') {
    return z.any()
  }

  switch (schema.type) {
    case 'string':
      let stringSchema = z.string()
      if (schema.description) {
        stringSchema = stringSchema.describe(schema.description)
      }
      return stringSchema

    case 'number':
      let numberSchema = z.number()
      if (schema.description) {
        numberSchema = numberSchema.describe(schema.description)
      }
      return numberSchema

    case 'integer':
      let intSchema = z.number().int()
      if (schema.description) {
        intSchema = intSchema.describe(schema.description)
      }
      return intSchema

    case 'boolean':
      let boolSchema = z.boolean()
      if (schema.description) {
        boolSchema = boolSchema.describe(schema.description)
      }
      return boolSchema

    case 'array':
      const itemSchema = schema.items ? jsonSchemaToZod(schema.items) : z.any()
      let arraySchema = z.array(itemSchema)
      if (schema.description) {
        arraySchema = arraySchema.describe(schema.description)
      }
      return arraySchema

    case 'object':
      if (!schema.properties) {
        let objectSchema = z.record(z.any())
        if (schema.description) {
          objectSchema = objectSchema.describe(schema.description)
        }
        return objectSchema
      }

      const shape: Record<string, z.ZodType<any>> = {}
      for (const [key, prop] of Object.entries(schema.properties)) {
        shape[key] = jsonSchemaToZod(prop)
      }

      let objectSchema = z.object(shape)
      
      // Handle required fields
      if (schema.required && Array.isArray(schema.required)) {
        // Zod objects are required by default, so we need to make non-required fields optional
        const requiredFields = new Set(schema.required)
        const optionalShape: Record<string, z.ZodType<any>> = {}
        
        for (const [key, zodSchema] of Object.entries(shape)) {
          if (requiredFields.has(key)) {
            optionalShape[key] = zodSchema
          } else {
            optionalShape[key] = zodSchema.optional()
          }
        }
        
        objectSchema = z.object(optionalShape)
      } else {
        // If no required array, make all fields optional
        const optionalShape: Record<string, z.ZodType<any>> = {}
        for (const [key, zodSchema] of Object.entries(shape)) {
          optionalShape[key] = zodSchema.optional()
        }
        objectSchema = z.object(optionalShape)
      }

      if (schema.description) {
        objectSchema = objectSchema.describe(schema.description)
      }
      return objectSchema

    default:
      return z.any()
  }
}

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
        continue
      }

      tools[tool.name] = {
        description: tool.description,
        parameters: jsonSchemaToZod(tool.inputSchema),
        execute: async (args: any) => {
          try {
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

    // Add artifact tools for document creation and updating
    tools.createDocument = tool({
      description: 'Create a document in the artifact workspace for writing, code, or content creation activities',
      parameters: z.object({
        title: z.string().describe('The title of the document'),
        kind: z.enum(artifactKinds).describe('The type of artifact to create (text, code, chart, etc.)'),
      }),
      execute: async ({ title, kind }) => {
        try {
          const id = generateUUID()
          
          // Create initial content based on kind
          let initialContent = ''
          switch (kind) {
            case 'text':
              initialContent = `# ${title}\n\nStart writing your content here...`
              break
            case 'code':
              initialContent = `// ${title}\n\n// Add your code here`
              break
            case 'chart':
              initialContent = `{\n  "title": "${title}",\n  "type": "bar",\n  "data": []\n}`
              break
            default:
              initialContent = title
          }
          
          // Create document via document API
          const documentData = {
            title,
            content: initialContent,
            kind: kind as ArtifactKind,
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              description: `Created via chat: ${title}`
            }
          }
          
          // Call the document API internally
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/document?id=${encodeURIComponent(id)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(documentData)
          })
          
          if (!response.ok) {
            throw new Error(`Document API error: ${response.statusText}`)
          }
          
          const createdDocument = await response.json()
          
          return {
            id: createdDocument.id,
            title: createdDocument.title,
            kind: createdDocument.kind,
            success: true,
            message: `Document "${title}" created successfully`
          }
        } catch (error) {
          console.error('Error creating document:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create document'
          }
        }
      }
    })

    tools.updateDocument = tool({
      description: 'Update an existing document in the artifact workspace',
      parameters: z.object({
        id: z.string().describe('The ID of the document to update'),
        description: z.string().describe('Description of the changes or new content to add to the document'),
      }),
      execute: async ({ id, description }) => {
        try {
          // Get the existing document first
          const getResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/document?id=${id}`)
          
          if (!getResponse.ok) {
            return {
              success: false,
              error: `Document with ID "${id}" not found`
            }
          }
          
          const documentVersions = await getResponse.json()
          if (!documentVersions || documentVersions.length === 0) {
            return {
              success: false,
              error: `Document with ID "${id}" not found`
            }
          }
          
          const existingDoc = documentVersions[documentVersions.length - 1] // Get latest version
          
          // Update the document content based on the description
          const updatedContent = `${existingDoc.content}\n\n<!-- Updated: ${new Date().toISOString()} -->\n${description}`
          
          // Update via document API
          const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/document`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id,
              content: updatedContent,
              metadata: {
                ...existingDoc.metadata,
                updatedAt: new Date().toISOString(),
                description: `Updated via chat: ${description}`
              }
            })
          })
          
          if (!updateResponse.ok) {
            throw new Error(`Document API error: ${updateResponse.statusText}`)
          }
          
          const updatedDoc = await updateResponse.json()
          
          return {
            id: updatedDoc.id,
            title: updatedDoc.title,
            success: true,
            message: `Document "${updatedDoc.title}" updated successfully`
          }
        } catch (error) {
          console.error('Error updating document:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update document'
          }
        }
      }
    })

    if (Object.keys(tools).length === 2 && connectedServers.length === 0) {
      console.warn('No connected MCP servers found - only artifact tools will be available to the AI model')
    }

  return { tools, servers, connectedServers, availableTools }
}

export async function POST(req: Request) {
  try {
    const { messages, id, userId } = await req.json()

    // Ensure MCP client is properly initialized before processing the request
    if (!mcpClient.isReady()) {
      await mcpClient.initialize()
    }

    const { tools, servers, connectedServers, availableTools } = await prepareMcpTools()

    // Validate Azure OpenAI configuration before proceeding
    try {
      getAzureOpenAIModel()
    } catch (llmError) {
      console.error('Azure OpenAI configuration error:', llmError)
      const errorMessage = llmError instanceof Error ? llmError.message : 'Unknown Azure OpenAI configuration error'
      return new Response(
        JSON.stringify({ 
          error: 'Azure OpenAI configuration error', 
          details: errorMessage,
          provider: 'azure'
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

  const systemPrompt = `You are DiGIT, an enterprise data intelligence assistant powered by MCP (Model Context Protocol) and Azure OpenAI. You help data analysts and product owners discover insights from their data.

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

**Artifact Tools:**
You have access to artifact creation and management tools:
- createDocument: Create new documents, code files, charts, or other content in the artifact workspace
- updateDocument: Update existing documents with new content or modifications

Use these tools when users:
- Ask you to create code, documents, or visual content
- Want to save or persist content for later use
- Request interactive or editable content
- Need artifacts they can work with outside the chat

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

    console.log('Chat API: Starting streamText with Azure OpenAI...')
    
    let result;
    try {
      result = await streamText({
        model: getAzureOpenAIModel(),
        system: systemPrompt,
        messages: convertToCoreMessages(messages),
        tools,
        maxSteps: 5,
        onFinish: async ({ response, finishReason, usage, text }) => {
          // AI SDK now handles message persistence automatically via the useChat hook
          // No need for manual persistence here as it's handled client-side
          console.log('Message completed:', { finishReason, usage: usage?.totalTokens })
        }
      })
      
      return result.toDataStreamResponse()
      
    } catch (streamError) {
      console.error('StreamText error:', streamError)
      
      // Analyze the error type for better user feedback
      const errorMessage = streamError instanceof Error ? streamError.message : 'Unknown streaming error'
      let statusCode = 500
      let userFriendlyMessage = 'An error occurred while processing your request'
      
      if (errorMessage.toLowerCase().includes('azure')) {
        if (errorMessage.toLowerCase().includes('quota')) {
          userFriendlyMessage = 'Azure OpenAI quota exceeded. Please try again later.'
          statusCode = 429
        } else if (errorMessage.toLowerCase().includes('authentication') || errorMessage.toLowerCase().includes('unauthorized')) {
          userFriendlyMessage = 'Azure OpenAI authentication failed. Please check your configuration.'
          statusCode = 401
        } else if (errorMessage.toLowerCase().includes('deployment')) {
          userFriendlyMessage = 'Azure OpenAI deployment not found. Please verify your deployment name.'
          statusCode = 404
        } else {
          userFriendlyMessage = 'Azure OpenAI service error. Please try again.'
        }
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        userFriendlyMessage = 'Network error connecting to Azure OpenAI. Please check your connection.'
        statusCode = 503
      } else if (errorMessage.toLowerCase().includes('timeout')) {
        userFriendlyMessage = 'Request timed out. Please try again with a shorter message.'
        statusCode = 408
      }
      
      return new Response(
        JSON.stringify({ 
          error: userFriendlyMessage,
          details: errorMessage,
          provider: 'azure',
          timestamp: new Date().toISOString()
        }), 
        { 
          status: statusCode, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
    
  } catch (outerError) {
    console.error('Chat API error:', outerError)
    const errorMessage = outerError instanceof Error ? outerError.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}
