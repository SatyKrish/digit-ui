import { streamText, convertToCoreMessages } from "ai"
import { mcpClient } from "@/client/mcp-client"
import { aiSdkChatService } from "@/services/chat/ai-sdk-chat-service"
import { env } from "@/config/env"
import { getOpenAIModel, openaiConfig } from "@/config/openai"
import { NextRequest } from "next/server"

/**
 * Optimized API route aligned with AI SDK patterns
 * Removes message duplication and improves performance
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      messages, 
      id: chatId, 
      userId,
      enableSmootherStreaming = true,
      enableThrottling = true
    } = await req.json()

    if (!userId) {
      return new Response('User ID is required', { status: 400 })
    }

    // Initialize MCP client if needed
    if (!mcpClient.isReady()) {
      console.log('MCP client not ready, initializing...')
      await mcpClient.initialize()
    }

    // Load or create chat
    let currentChatId = chatId
    let initialMessages = messages || []

    if (chatId) {
      // Load existing chat messages if not provided
      if (!messages || messages.length === 0) {
        initialMessages = await aiSdkChatService.getInitialMessages(chatId)
      }
    } else {
      // Create new chat if needed
      const chat = await aiSdkChatService.createChat(userId)
      currentChatId = chat.id
    }

    // Prepare MCP tools
    const tools = await prepareMcpTools()

    // Convert messages to AI SDK core format
    const coreMessages = convertToCoreMessages(initialMessages)

    // Stream response with AI SDK
    const result = await streamText({
      model: getOpenAIModel(),
      messages: coreMessages,
      tools,
      maxTokens: openaiConfig.maxTokens,
      temperature: openaiConfig.temperature,
      // Enhanced system prompt with context
      system: generateSystemPrompt(userId),
      // Handle tool calls
      onFinish: async (result) => {
        // Save conversation after completion (no duplication)
        if (result.finishReason === 'stop' && coreMessages.length > 0) {
          try {
            // Save conversation after completion
            const finalMessages = [...initialMessages]
            
            // The result contains the messages in the response
            if (result.response?.messages) {
              finalMessages.push(...result.response.messages)
            }
            
            // Save messages efficiently (batch operation)
            await aiSdkChatService.saveMessages(currentChatId, finalMessages)
            
            // Auto-generate title for new chats
            if (!chatId && finalMessages.length >= 2) {
              const title = await aiSdkChatService.generateChatTitle(currentChatId, finalMessages)
              await aiSdkChatService.updateChatTitle(currentChatId, title)
            }
          } catch (error) {
            console.error('Failed to save conversation:', error)
            // Don't throw - let the response continue
          }
        }
      }
    })

    // Return the streaming response
    return result.toDataStreamResponse({
      headers: {
        'X-Chat-Id': currentChatId,
        'X-Message-Count': initialMessages.length.toString()
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Prepare MCP tools for AI SDK
 */
async function prepareMcpTools(): Promise<Record<string, any>> {
  const tools: Record<string, any> = {}

  try {
    // Database tools
    tools.query_database = {
      description: "Execute SQL queries against the database",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "SQL query to execute" },
          database: { type: "string", description: "Database name (optional)" },
        },
        required: ["query"],
      },
      execute: async ({ query, database }: { query: string; database?: string }) => {
        try {
          return await mcpClient.callTool("database-server", "query_database", { query, database })
        } catch (error) {
          console.error('Database query error:', error)
          return { error: 'Failed to execute database query' }
        }
      },
    }

    tools.get_schema = {
      description: "Get database schema information",
      parameters: {
        type: "object",
        properties: {
          database: { type: "string", description: "Database name (optional)" },
        },
      },
      execute: async ({ database }: { database?: string }) => {
        try {
          return await mcpClient.callTool("database-server", "get_schema", { database })
        } catch (error) {
          console.error('Schema fetch error:', error)
          return { error: 'Failed to fetch database schema' }
        }
      },
    }

    // File system tools
    tools.read_file = {
      description: "Read file contents",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to read" },
        },
        required: ["path"],
      },
      execute: async ({ path }: { path: string }) => {
        try {
          return await mcpClient.callTool("filesystem-server", "read_file", { path })
        } catch (error) {
          console.error('File read error:', error)
          return { error: 'Failed to read file' }
        }
      },
    }

    tools.list_directory = {
      description: "List directory contents",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path to list" },
        },
        required: ["path"],
      },
      execute: async ({ path }: { path: string }) => {
        try {
          return await mcpClient.callTool("filesystem-server", "list_directory", { path })
        } catch (error) {
          console.error('Directory list error:', error)
          return { error: 'Failed to list directory' }
        }
      },
    }

    // Web search tools
    tools.web_search = {
      description: "Search the web for information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          max_results: { type: "number", description: "Maximum number of results" },
        },
        required: ["query"],
      },
      execute: async ({ query, max_results = 5 }: { query: string; max_results?: number }) => {
        try {
          return await mcpClient.callTool("web-search-server", "web_search", { query, max_results })
        } catch (error) {
          console.error('Web search error:', error)
          return { error: 'Failed to search the web' }
        }
      },
    }

  } catch (error) {
    console.error('Failed to prepare MCP tools:', error)
  }

  return tools
}

/**
 * Generate enhanced system prompt with context
 */
function generateSystemPrompt(userId: string): string {
  return `You are Digit, an intelligent AI assistant specialized in data analysis, business intelligence, and technical problem-solving.

Current context:
- User ID: ${userId}
- Session: Interactive chat with database, file, and web search capabilities
- Available tools: Database queries, file operations, web search

Capabilities:
- Execute SQL queries to analyze data
- Read and analyze files
- Search the web for current information
- Generate insights and recommendations
- Create visualizations and reports

Guidelines:
- Always be helpful, accurate, and concise
- When working with data, provide clear insights and actionable recommendations
- If you're unsure about something, ask for clarification
- Use tools appropriately to gather information needed to answer questions
- Format responses clearly with proper structure
- When generating code or queries, explain what they do

Remember: You have access to real-time data and can perform actual operations. Use this capability responsibly to provide the most helpful and accurate responses.`
}

/**
 * Handle chat initialization
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId, email, name } = await req.json()

    if (!userId || !email) {
      return new Response('User ID and email are required', { status: 400 })
    }

    // Initialize user in the chat service
    // This is simpler than the original complex initialization
    await aiSdkChatService.createChat(userId, 'Welcome Chat')

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Chat initialization error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to initialize chat' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Get chat history
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    const userId = searchParams.get('userId')

    if (chatId) {
      const messages = await aiSdkChatService.getInitialMessages(chatId)
      return new Response(JSON.stringify({ messages }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (userId) {
      const chats = await aiSdkChatService.getUserChats(userId)
      return new Response(JSON.stringify({ chats }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response('Chat ID or User ID required', { status: 400 })

  } catch (error) {
    console.error('Chat history error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch chat history' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
