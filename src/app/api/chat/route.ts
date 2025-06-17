import { streamText, type CoreMessage } from "ai"
import { mcpClient } from "@/client/mcp-client"
import { getAzureOpenAIModel } from "@/config/azure-openai"
import { chatRequestSchema, ValidationError } from "./lib/types"
import { prepareMcpTools } from "./lib/mcp-tools"
import { categorizeStreamError, createErrorResponse, validateUserId } from "./lib/error-utils"
import { ensureUserExists, getOrCreateChat, saveChatCompletion } from "./lib/chat-utils"

/**
 * Enhanced system prompt with user request context
 */
function createSystemPrompt(serverCount: number, toolCount: number, userRequest: string = ""): string {
  return `You are DiGIT, an enterprise data intelligence assistant powered by MCP (Model Context Protocol) and Azure OpenAI.

**System Status:** ${serverCount} servers connected, ${toolCount} tools available

**Capabilities:**
- Query and analyze data using connected MCP servers
- Create interactive charts, documents, and visualizations
- Generate code and provide data insights

Always provide clear, professional responses suitable for enterprise use.

**CURRENT USER REQUEST:** "${userRequest}"

When making tool calls, always consider the full context of this user request, especially any visualization requirements (chart types, format preferences) that should be preserved throughout your workflow.`
}

export async function POST(req: Request) {
  const startTime = Date.now()
  let chatId: string | undefined
  
  try {
    // Parse and validate request
    const body = await req.json()
    console.log(`[REQUEST] Body received:`, JSON.stringify({
      hasMessages: !!body.messages,
      messagesLength: body.messages?.length,
      bodyKeys: Object.keys(body)
    }))
    
    const parsed = chatRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      console.error(`[REQUEST] Invalid schema:`, parsed.error.flatten())
      console.error(`[REQUEST] Body was:`, JSON.stringify(body, null, 2))
      return createErrorResponse('Invalid request format', undefined, 400)
    }

    const { id: requestChatId, messages, userId } = parsed.data
    
    // Validate user
    const effectiveUserId = validateUserId(userId || body.userId)
    await ensureUserExists(effectiveUserId)

    // Get or create chat
    chatId = await getOrCreateChat(requestChatId || body.id, effectiveUserId)

    // Initialize MCP if needed
    if (!mcpClient.isReady()) {
      try {
        await mcpClient.initialize()
        console.log(`[MCP] Client initialized`)
      } catch (mcpError) {
        console.error(`[MCP] Initialization failed:`, mcpError)
        // Continue without MCP
      }
    }

    // Prepare tools
    let tools: Record<string, any> = {}
    let serverCount = 0
    
    try {
      const mcpResult = await prepareMcpTools()
      tools = {
        ...mcpResult.tools
      }
      serverCount = mcpResult.connectedServers.length
      console.log(`[TOOLS] Prepared ${Object.keys(tools).length} tools`)
    } catch (toolError) {
      console.error(`[TOOLS] Preparation failed:`, toolError)
      // Continue without tools
      tools = {}
    }

    // Validate Azure OpenAI
    console.log(`[AZURE] Checking Azure OpenAI configuration...`)
    try {
      const model = getAzureOpenAIModel()
      console.log(`[AZURE] Model created successfully`)
    } catch (llmError) {
      console.error(`[AZURE] Configuration error:`, llmError)
      return createErrorResponse('Azure OpenAI configuration error: ' + (llmError instanceof Error ? llmError.message : String(llmError)), undefined, 500)
    }

    // Process messages and extract current user request
    const coreMessages = messages.map(msg => {
      // Truncate very long messages
      if (msg.content?.length > 50000) {
        msg.content = msg.content.substring(0, 50000) + '... [truncated]'
      }
      
      return {
        role: msg.role === 'tool' ? 'assistant' : msg.role,
        content: msg.content,
        name: msg.name,
        toolInvocations: msg.toolInvocations
      } as CoreMessage
    })

    // Extract the latest user message as the current request
    const latestUserMessage = [...messages].reverse().find(msg => msg.role === 'user')
    const currentUserRequest = latestUserMessage?.content

    const systemPrompt = createSystemPrompt(serverCount, Object.keys(tools).length, currentUserRequest)
    const setupTime = Date.now() - startTime
    console.log(`[REQUEST] Setup completed in ${setupTime}ms`)
    
    // Stream response
    console.log(`[STREAM] Starting stream with model...`)
    console.log(`[STREAM] System prompt length: ${systemPrompt.length}`)
    console.log(`[STREAM] Messages count: ${coreMessages.length}`)
    console.log(`[STREAM] Tools count: ${Object.keys(tools).length}`)
    try {
      const result = await streamText({
        model: getAzureOpenAIModel(),
        system: systemPrompt,
        messages: coreMessages,
        tools,
        maxSteps: 5,
        onFinish: async ({ text }) => {
          const totalTime = Date.now() - startTime
          console.log(`[STREAM] Completed in ${totalTime}ms`)
          
          // Save chat completion
          await saveChatCompletion(messages, chatId!, text)
        }
      })

      console.log(`[STREAM] Stream created successfully, converting to response...`)
      const response = result.toDataStreamResponse()
      console.log(`[STREAM] Response created successfully`)
      return response
    } catch (streamError) {
      console.error(`[STREAM] Error during streaming:`, streamError)
      console.error(`[STREAM] Stream error details:`, {
        name: streamError instanceof Error ? streamError.name : 'Unknown',
        message: streamError instanceof Error ? streamError.message : String(streamError),
        stack: streamError instanceof Error ? streamError.stack : undefined
      })
      throw streamError
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[REQUEST] Error after ${totalTime}ms:`, error)
    console.error(`[REQUEST] Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, undefined, 400)
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const { statusCode, userMessage } = categorizeStreamError(errorMessage)
    
    return createErrorResponse(userMessage, errorMessage, statusCode)
  }
}
