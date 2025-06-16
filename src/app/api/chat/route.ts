import { streamText, convertToCoreMessages, tool, type CoreMessage } from "ai"
import { mcpClient } from "@/client/mcp-client"
import { aiSdkChatPersistence } from "@/database/repositories"
import { env } from "@/config/env"
import { getAzureOpenAIModel, azureOpenAIConfig } from "@/config/azure-openai"
import { z } from "zod"
import { 
  artifactKinds 
} from "@/lib/artifacts/server"
import { generateUUID } from "@/lib/utils"
import type { ArtifactKind } from "@/lib/artifacts/types"

// Simplified AI SDK-aligned request schema
const chatRequestSchema = z.object({
  id: z.string().optional(), // Chat ID, optional for new chats
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string(),
    name: z.string().optional(),
    toolInvocations: z.array(z.any()).optional(),
    createdAt: z.union([z.date(), z.string()]).optional()
  })),
  userId: z.string().optional(), // From body for user identification
  // Support for custom body fields
  selectedVisibilityType: z.enum(['public', 'private']).optional().default('private')
})

type ChatRequest = z.infer<typeof chatRequestSchema>

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
 * Following AI SDK v4+ tool patterns
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
    description: 'Create a new document, code file, chart, or other content in the artifact workspace. Use this when users ask you to create or generate content.',
    parameters: z.object({
      kind: z.enum(artifactKinds as readonly [ArtifactKind, ...ArtifactKind[]]).describe('The type of artifact to create'),
      title: z.string().describe('A clear, descriptive title for the artifact'),
      content: z.string().optional().describe('Optional initial content - if not provided, will be generated using AI'),
      language: z.string().optional().describe('Programming language for code artifacts')
    }),
    execute: async ({ kind, title, content, language }) => {
      const artifactId = generateUUID()
      console.log(`Creating ${kind} artifact: ${title}`)
      
      try {
        // Import the document handlers
        const { getDocumentHandler } = await import('@/lib/artifacts/server')
        
        // Get the appropriate document handler
        const handler = getDocumentHandler(kind)
        
        if (!handler) {
          console.warn(`No handler found for artifact kind: ${kind}, falling back to basic creation`)
          return {
            id: artifactId,
            kind,
            title,
            content: content || `# ${title}\n\nContent will be generated here...`,
            language,
            success: true,
            message: `Created ${kind} artifact: ${title}`
          }
        }
        
        // Create a data stream to capture the generated content
        let generatedContent = ''
        const dataStream = {
          writeData: (data: any) => {
            if (data.type === 'text-delta' || data.type === 'content-update' || data.type === 'chart-delta') {
              generatedContent += data.content || ''
            }
          },
          close: () => {}
        }
        
        // Use the document handler to generate content if not provided
        const finalContent = content || await handler.onCreateDocument({
          title,
          dataStream,
          metadata: { language }
        })
        
        // Use the generated content from the data stream if it exists
        const resultContent = generatedContent || finalContent
        
        console.log(`Generated ${kind} artifact content:`, resultContent.substring(0, 200) + '...')
        
        return {
          id: artifactId,
          kind,
          title,
          content: resultContent,
          language,
          success: true,
          message: `Created ${kind} artifact: ${title}`
        }
        
      } catch (error) {
        console.error(`Error creating ${kind} artifact:`, error)
        return {
          id: artifactId,
          kind,
          title,
          content: content || `# ${title}\n\nError generating content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          language,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: `Failed to create ${kind} artifact: ${title}`
        }
      }
    }
  })

  tools.updateDocument = tool({
    description: 'Update an existing document or artifact with new content or modifications.',
    parameters: z.object({
      artifactId: z.string().describe('The ID of the artifact to update'),
      content: z.string().describe('The new content for the artifact'),
      title: z.string().optional().describe('Updated title for the artifact')
    }),
    execute: async ({ artifactId, content, title }) => {
      console.log(`Updating artifact: ${artifactId}`)
      
      try {
        // Import the document handlers
        const { getDocumentHandler } = await import('@/lib/artifacts/server')
        
        // For now, we'll just return the updated content
        // In a full implementation, you would:
        // 1. Fetch the existing document by artifactId
        // 2. Get the appropriate handler based on the document's kind
        // 3. Use handler.onUpdateDocument to process the update
        // 4. Save the updated document
        
        return {
          id: artifactId,
          content,
          title,
          success: true,
          message: `Updated artifact: ${title || artifactId}`
        }
        
      } catch (error) {
        console.error(`Error updating artifact ${artifactId}:`, error)
        return {
          id: artifactId,
          content,
          title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: `Failed to update artifact: ${title || artifactId}`
        }
      }
    }
  })

  return { tools, servers, connectedServers, availableTools }
}

/**
 * Load previous messages for chat context
 * Following AI SDK patterns for message loading
 */
async function loadChatMessages(chatId: string): Promise<CoreMessage[]> {
  try {
    const chat = await aiSdkChatPersistence.getChat(chatId)
    if (!chat) {
      return []
    }

    const messages = await aiSdkChatPersistence.getMessages(chatId)
    return messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      createdAt: msg.createdAt
    }))
  } catch (error) {
    console.error('Failed to load chat messages:', error)
    return []
  }
}

/**
 * Save messages using Chat SDK patterns
 * Supports sendExtraMessageFields for persistence
 */
async function saveChatMessage(chatId: string, message: any) {
  try {
    await aiSdkChatPersistence.saveMessage({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt || new Date()
    }, chatId)
  } catch (error) {
    console.error('Failed to save message:', error)
  }
}

export async function POST(req: Request) {
  try {
    // Parse and validate request using AI SDK schema
    const body = await req.json()
    const parsed = chatRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      console.error('Invalid request schema:', parsed.error)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: parsed.error.flatten()
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    const { id: chatId, messages, userId } = parsed.data
    
    // Extract user ID from messages or body (AI SDK sends it in body)
    const effectiveUserId = userId || body.userId
    if (!effectiveUserId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Ensure user exists
    try {
      await aiSdkChatPersistence.ensureUser({
        id: effectiveUserId,
        email: effectiveUserId, // Use ID as email for now
        name: 'User' // Default name
      })
    } catch (error) {
      console.error('Failed to ensure user:', error)
    }

    // Get or create chat
    let currentChatId = chatId
    if (!currentChatId && body.id) {
      currentChatId = body.id
    }
    
    if (!currentChatId) {
      // Create new chat
      const newChat = await aiSdkChatPersistence.createChat(effectiveUserId)
      currentChatId = newChat.id
    }

    // Ensure MCP client is properly initialized
    if (!mcpClient.isReady()) {
      await mcpClient.initialize()
    }

    const { tools, servers, connectedServers } = await prepareMcpTools()

    // Validate Azure OpenAI configuration
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

    // Convert AI SDK messages to core messages for processing
    const coreMessages = messages.map(msg => ({
      role: msg.role === 'tool' ? 'assistant' : msg.role, // Convert 'tool' role to 'assistant' for core message compatibility
      content: msg.content,
      name: msg.name,
      toolInvocations: msg.toolInvocations
    })) as CoreMessage[]

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

When generating artifacts, use these formats:
1. **Code blocks**: Use \`\`\`language\\ncode\\n\`\`\` format
2. **Mermaid diagrams**: Use \`\`\`mermaid\\ndiagram\\n\`\`\` format
3. **Interactive charts**: Use \`\`\`json:chart:type\\n{"data": [...], "title": "Chart Title"}\\n\`\`\`
4. **Data tables**: Use \`\`\`json:table\\n{"data": [...], "title": "Table Title"}\\n\`\`\`

Always provide clear, professional responses suitable for enterprise use.`

    console.log('Chat API: Starting streamText with Azure OpenAI...')
    
    try {
      const result = await streamText({
        model: getAzureOpenAIModel(),
        system: systemPrompt,
        messages: coreMessages,
        tools,
        maxSteps: 5,
        onFinish: async ({ response, finishReason, usage, text }) => {
          // Save all messages using AI SDK persistence
          try {
            // Convert messages to proper format with Date objects and compatible roles
            const formattedMessages = messages.map(msg => ({
              ...msg,
              role: msg.role === 'tool' ? 'data' as const : msg.role, // Convert 'tool' to 'data' for AI SDK compatibility
              createdAt: msg.createdAt instanceof Date ? msg.createdAt : 
                       typeof msg.createdAt === 'string' ? new Date(msg.createdAt) : 
                       new Date()
            }));

            // Add the assistant response
            const assistantMessage = {
              id: generateUUID(),
              role: 'assistant' as const,
              content: text,
              createdAt: new Date()
            };

            await aiSdkChatPersistence.handleMessageCompletion(
              [...formattedMessages, assistantMessage],
              currentChatId,
              { updateTitle: true }
            )
          } catch (error) {
            console.error('Failed to save messages:', error)
          }
        }
      })

      return result.toDataStreamResponse()
    } catch (streamError) {
      console.error('StreamText error:', streamError)
      
      // Enhanced error handling with user-friendly messages
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
