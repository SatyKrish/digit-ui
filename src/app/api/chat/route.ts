import { streamText, tool, type CoreMessage } from "ai"
import { mcpClient } from "@/client/mcp-client"
import { aiSdkChatPersistence } from "@/database/repositories"
import { getAzureOpenAIModel } from "@/config/azure-openai"
import { z } from "zod"
import { artifactKinds } from "@/lib/artifacts/server"
import { generateUUID } from "@/lib/utils"
import type { ArtifactKind } from "@/lib/artifacts/types"

// Performance: Cache expensive operations
const TOOL_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const SCHEMA_CONVERSION_CACHE = new Map<string, z.ZodType<any>>()
let mcpToolsCache: { tools: Record<string, any>; timestamp: number } | null = null

// Optimized request schema with better validation
const chatRequestSchema = z.object({
  id: z.string().uuid().optional(),
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string().max(50000), // Prevent extremely large messages
    name: z.string().optional(),
    toolInvocations: z.array(z.any()).optional(),
    createdAt: z.union([z.date(), z.string().datetime()]).optional()
  })).min(1), // At least one message required
  userId: z.string().min(1).optional(),
  selectedVisibilityType: z.enum(['public', 'private']).optional().default('private')
})

type ChatRequest = z.infer<typeof chatRequestSchema>

// Error types for better error handling
class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

class MCPError extends Error {
  constructor(message: string, public serverId?: string) {
    super(message)
    this.name = 'MCPError'
  }
}

class ArtifactError extends Error {
  constructor(message: string, public artifactKind?: string) {
    super(message)
    this.name = 'ArtifactError'
  }
}

/**
 * Convert JSON Schema to Zod schema with caching for performance
 */
function jsonSchemaToZod(schema: any): z.ZodType<any> {
  if (!schema || typeof schema !== 'object') {
    return z.any()
  }

  // Performance: Use cached schema if available
  const cacheKey = JSON.stringify(schema)
  if (SCHEMA_CONVERSION_CACHE.has(cacheKey)) {
    return SCHEMA_CONVERSION_CACHE.get(cacheKey)!
  }

  let result: z.ZodType<any>

  switch (schema.type) {
    case 'string':
      result = z.string()
      if (schema.description) result = result.describe(schema.description)
      if (schema.minLength) result = (result as z.ZodString).min(schema.minLength)
      if (schema.maxLength) result = (result as z.ZodString).max(schema.maxLength)
      break

    case 'number':
      result = z.number()
      if (schema.description) result = result.describe(schema.description)
      if (schema.minimum !== undefined) result = (result as z.ZodNumber).min(schema.minimum)
      if (schema.maximum !== undefined) result = (result as z.ZodNumber).max(schema.maximum)
      break

    case 'integer':
      result = z.number().int()
      if (schema.description) result = result.describe(schema.description)
      if (schema.minimum !== undefined) result = (result as z.ZodNumber).min(schema.minimum)
      if (schema.maximum !== undefined) result = (result as z.ZodNumber).max(schema.maximum)
      break

    case 'boolean':
      result = z.boolean()
      if (schema.description) result = result.describe(schema.description)
      break

    case 'array':
      const itemSchema = schema.items ? jsonSchemaToZod(schema.items) : z.any()
      result = z.array(itemSchema)
      if (schema.description) result = result.describe(schema.description)
      if (schema.minItems) result = (result as z.ZodArray<any>).min(schema.minItems)
      if (schema.maxItems) result = (result as z.ZodArray<any>).max(schema.maxItems)
      break

    case 'object':
      if (!schema.properties) {
        result = z.record(z.any())
        if (schema.description) result = result.describe(schema.description)
        break
      }

      const shape: Record<string, z.ZodType<any>> = {}
      for (const [key, prop] of Object.entries(schema.properties)) {
        shape[key] = jsonSchemaToZod(prop)
      }

      const requiredFields = new Set(schema.required || [])
      const finalShape: Record<string, z.ZodType<any>> = {}
      
      for (const [key, zodSchema] of Object.entries(shape)) {
        finalShape[key] = requiredFields.has(key) ? zodSchema : zodSchema.optional()
      }
      
      result = z.object(finalShape)
      if (schema.description) result = result.describe(schema.description)
      break

    default:
      result = z.any()
  }

  // Cache the result for future use
  SCHEMA_CONVERSION_CACHE.set(cacheKey, result)
  
  // Prevent memory leaks by limiting cache size
  if (SCHEMA_CONVERSION_CACHE.size > 1000) {
    const firstKey = SCHEMA_CONVERSION_CACHE.keys().next().value
    if (firstKey) {
      SCHEMA_CONVERSION_CACHE.delete(firstKey)
    }
  }

  return result
}

/**
 * Dynamically prepare MCP tools with caching for performance
 */
async function prepareMcpTools() {
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

  // Add optimized artifact tools
  tools.createDocument = createDocumentTool()
  tools.updateDocument = createUpdateDocumentTool()

  // Cache the tools
  mcpToolsCache = {
    tools,
    timestamp: Date.now()
  }

  return { tools, servers, connectedServers, availableTools }
}

/**
 * Create optimized document creation tool
 */
function createDocumentTool() {
  return tool({
    description: 'Create a new document, code file, chart, or other content in the artifact workspace. Use this when users ask you to create or generate content.',
    parameters: z.object({
      kind: z.enum(artifactKinds as readonly [ArtifactKind, ...ArtifactKind[]]).describe('The type of artifact to create'),
      title: z.string().min(1).max(200).describe('A clear, descriptive title for the artifact'),
      content: z.string().max(100000).optional().describe('Optional initial content - if not provided, will be generated using AI'),
      language: z.string().optional().describe('Programming language for code artifacts')
    }),
    execute: async ({ kind, title, content, language }) => {
      console.log(`[ARTIFACT] Starting createDocumentTool for ${kind} artifact with title: ${title}`);
      const artifactId = generateUUID();
      const startTime = Date.now();
      console.log(`[ARTIFACT] Creating ${kind} artifact: ${title}`);
      
      try {
        // Import the document handlers with error handling
        let handler;
        try {
          const { getDocumentHandler } = await import('@/lib/artifacts/server');
          handler = getDocumentHandler(kind);
          console.log(`[ARTIFACT] Loaded handler for artifact kind: ${kind}`);
        } catch (importError) {
          console.warn(`[ARTIFACT] Failed to import document handlers:`, importError);
        }
        
        if (!handler) {
          console.warn(`[ARTIFACT] No handler found for artifact kind: ${kind}, using fallback`);
          return createFallbackArtifact(artifactId, kind, title, content, language);
        }
        
        console.log(`[ARTIFACT] Found handler for ${kind}, generating content...`);
        
        // Optimized data stream with better memory management
        let generatedContent = '';
        let streamMetadata: any = null;
        const contentChunks: string[] = [];
        
        const dataStream = {
          writeData: (data: any) => {
            try {
              const contentLength = data.content?.length || 0;
              console.log(`[DATASTREAM] Type: ${data.type}, Content length: ${contentLength}`);
              
              switch (data.type) {
                case 'text-delta':
                case 'content-update':
                case 'code-delta':
                case 'sheet-delta':
                  if (data.content) {
                    contentChunks.push(data.content);
                    // Limit memory usage by joining chunks periodically
                    if (contentChunks.length > 100) {
                      generatedContent += contentChunks.join('');
                      contentChunks.length = 0;
                    }
                  }
                  break;
                case 'chart-delta':
                  // Handle chart content and metadata
                  if (data.content) {
                    contentChunks.push(data.content);
                    // Limit memory usage by joining chunks periodically
                    if (contentChunks.length > 100) {
                      generatedContent += contentChunks.join('');
                      contentChunks.length = 0;
                    }
                  }
                  // Capture chart metadata
                  if (data.data || data.chartType || data.xKey || data.yKey) {
                    streamMetadata = {
                      data: data.data,
                      chartType: data.chartType,
                      title: data.title || title,
                      xKey: data.xKey,
                      yKey: data.yKey
                    };
                    console.log(`[CHART] Captured metadata:`, streamMetadata);
                  }
                  break;
              }
            } catch (streamError) {
              console.error(`[DATASTREAM] Error processing data:`, streamError);
            }
          },
          close: () => {
            // Final join of remaining chunks
            if (contentChunks.length > 0) {
              generatedContent += contentChunks.join('');
            }
            console.log(`[DATASTREAM] Data stream closed. Generated content length: ${generatedContent.length}`);
          }
        };
        
        // Generate content with timeout protection
        const contentPromise = content || handler.onCreateDocument({
          title,
          dataStream,
          metadata: { language }
        });
        
        console.log(`[ARTIFACT] Waiting for content generation...`);
        const finalContent = await Promise.race([
          contentPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Content generation timeout')), 30000)
          )
        ]) as string;
        
        // Finalize the data stream
        dataStream.close();
        
        // Use generated content if available, otherwise use finalContent
        let resultContent = generatedContent || finalContent;
        
        // Enhanced chart processing
        if (kind === 'chart') {
          resultContent = await processChartContent(resultContent, streamMetadata, title);
          
          // For charts, ensure we have valid content to display
          if (!resultContent || resultContent.length === 0) {
            console.warn(`[CHART] No content generated, using provided content`);
            resultContent = content || '{}';
          }
          
          // Validate chart content is valid JSON
          try {
            const chartData = JSON.parse(resultContent);
            if (!chartData.data || !Array.isArray(chartData.data) || chartData.data.length === 0) {
              console.warn(`[CHART] Invalid chart data, attempting to parse provided content`);
              if (content) {
                const providedData = JSON.parse(content);
                if (providedData.data && Array.isArray(providedData.data)) {
                  resultContent = content;
                }
              }
            }
          } catch (parseError) {
            console.error(`[CHART] Chart content is not valid JSON:`, parseError);
            if (content) {
              console.log(`[CHART] Falling back to provided content`);
              resultContent = content;
            }
          }
        }
        
        const duration = Date.now() - startTime;
        console.log(`[ARTIFACT] Generated ${kind} artifact in ${duration}ms (${resultContent.length} chars)`);
        
        return {
          id: artifactId,
          kind,
          title,
          content: resultContent,
          language,
          success: true,
          message: `Created ${kind} artifact: ${title}`,
          duration
        };
        
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[ARTIFACT] Error creating ${kind} artifact after ${duration}ms:`, error);
        
        if (error instanceof Error && error.message === 'Content generation timeout') {
          throw new ArtifactError('Content generation timed out', kind);
        }
        
        return createFallbackArtifact(artifactId, kind, title, content, language, error);
      }
    }
  });
}

/**
 * Create optimized document update tool
 */
function createUpdateDocumentTool() {
  return tool({
    description: 'Update an existing document or artifact with new content or modifications.',
    parameters: z.object({
      artifactId: z.string().uuid().describe('The ID of the artifact to update'),
      content: z.string().max(100000).describe('The new content for the artifact'),
      title: z.string().min(1).max(200).optional().describe('Updated title for the artifact')
    }),
    execute: async ({ artifactId, content, title }) => {
      const startTime = Date.now()
      console.log(`[ARTIFACT] Updating artifact: ${artifactId}`)
      
      try {
        // TODO: Implement proper artifact retrieval and update
        // For now, return the updated content
        const duration = Date.now() - startTime
        
        return {
          id: artifactId,
          content,
          title,
          success: true,
          message: `Updated artifact: ${title || artifactId}`,
          duration
        }
        
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(`[ARTIFACT] Error updating artifact ${artifactId} after ${duration}ms:`, error)
        
        throw new ArtifactError(
          error instanceof Error ? error.message : 'Unknown error',
          'update'
        )
      }
    }
  })
}

/**
 * Create fallback artifact when handlers fail
 */
function createFallbackArtifact(
  artifactId: string, 
  kind: ArtifactKind, 
  title: string, 
  content?: string, 
  language?: string,
  error?: any
) {
  const fallbackContent = content || `# ${title}\n\n${
    error ? `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}` : 'Content will be generated here...'
  }`
  
  return {
    id: artifactId,
    kind,
    title,
    content: fallbackContent,
    language,
    success: !error,
    error: error instanceof Error ? error.message : undefined,
    message: error 
      ? `Failed to create ${kind} artifact: ${title}` 
      : `Created ${kind} artifact: ${title} (fallback)`
  }
}

/**
 * Create fallback chart data when AI generation fails
 */
function createFallbackChartData(title: string): any {
  const lowerTitle = title.toLowerCase();
  
  // Determine chart type from title
  let chartType = 'bar';
  if (lowerTitle.includes('pie') || lowerTitle.includes('distribution') || lowerTitle.includes('share')) {
    chartType = 'pie';
  } else if (lowerTitle.includes('line') || lowerTitle.includes('trend') || lowerTitle.includes('over time')) {
    chartType = 'line';
  } else if (lowerTitle.includes('area') || lowerTitle.includes('filled')) {
    chartType = 'area';
  }
  
  // Create sample data based on title context
  let data: any[] = [];
  let xKey = 'category';
  let yKey = 'value';
  
  if (lowerTitle.includes('gdp') || lowerTitle.includes('country') || lowerTitle.includes('countries')) {
    data = [
      { country: "United States", gdp: 25.46 },
      { country: "China", gdp: 17.73 },
      { country: "Japan", gdp: 4.94 },
      { country: "Germany", gdp: 4.07 },
      { country: "India", gdp: 3.73 }
    ];
    xKey = 'country';
    yKey = 'gdp';
  } else if (lowerTitle.includes('sales') || lowerTitle.includes('revenue')) {
    data = [
      { month: "Jan", sales: 120 },
      { month: "Feb", sales: 150 },
      { month: "Mar", sales: 180 },
      { month: "Apr", sales: 200 },
      { month: "May", sales: 240 }
    ];
    xKey = 'month';
    yKey = 'sales';
  } else {
    // Generic fallback data
    data = [
      { category: "Category A", value: 30 },
      { category: "Category B", value: 70 },
      { category: "Category C", value: 45 },
      { category: "Category D", value: 85 },
      { category: "Category E", value: 60 }
    ];
  }
  
  return {
    chartType,
    title,
    xKey,
    yKey,
    data
  };
}

/**
 * Process and enhance chart content
 */
async function processChartContent(content: string, metadata: any, title: string): Promise<string> {
  // Handle empty or invalid content
  if (!content || content.trim().length === 0) {
    console.warn(`[CHART] Empty content received, creating fallback chart data`);
    
    // Create fallback chart data based on title
    const fallbackData = createFallbackChartData(title);
    return JSON.stringify(fallbackData);
  }
  
  try {
    const parsed = JSON.parse(content)
    
    // Merge metadata if available
    if (metadata) {
      Object.assign(parsed, metadata)
    }
    
    // Enhanced chart type detection
    if (!parsed.chartType) {
      parsed.chartType = detectChartType(title, parsed.data)
      console.log(`[CHART] Auto-detected chartType: ${parsed.chartType}`)
    }
    
    // Enhanced key detection
    if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
      const firstItem = parsed.data[0]
      const keys = Object.keys(firstItem)
      
      if (!parsed.xKey && keys.length > 0) {
        parsed.xKey = detectXKey(keys, firstItem)
        console.log(`[CHART] Auto-detected xKey: ${parsed.xKey}`)
      }
      
      if (!parsed.yKey && keys.length > 1) {
        parsed.yKey = detectYKey(keys, firstItem, parsed.xKey)
        console.log(`[CHART] Auto-detected yKey: ${parsed.yKey}`)
      }
    } else {
      // If no valid data, create fallback
      console.warn(`[CHART] No valid data found, creating fallback`);
      const fallbackData = createFallbackChartData(title);
      return JSON.stringify(fallbackData);
    }
    
    return JSON.stringify(parsed)
    
  } catch (parseError) {
    console.error(`[CHART] Failed to parse chart JSON:`, parseError)
    console.log(`[CHART] Raw content:`, content.substring(0, 500))
    
    // Create fallback chart data when parsing fails
    const fallbackData = createFallbackChartData(title);
    return JSON.stringify(fallbackData);
  }
}

/**
 * Detect chart type based on title and data
 */
function detectChartType(title: string, data?: any[]): string {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('pie') || lowerTitle.includes('distribution') || lowerTitle.includes('share')) {
    return 'pie'
  }
  if (lowerTitle.includes('trend') || lowerTitle.includes('over time') || lowerTitle.includes('timeline')) {
    return 'line'
  }
  if (lowerTitle.includes('area') || lowerTitle.includes('filled')) {
    return 'area'
  }
  
  // Data-based detection
  if (data && data.length > 0) {
    const keys = Object.keys(data[0])
    const hasTimeField = keys.some(key => 
      key.toLowerCase().includes('time') || 
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('month') ||
      key.toLowerCase().includes('year')
    )
    
    if (hasTimeField) return 'line'
  }
  
  return 'bar' // Default
}

/**
 * Detect appropriate X-axis key
 */
function detectXKey(keys: string[], firstItem: any): string {
  // Prefer string/date fields for X-axis
  const stringKeys = keys.filter(key => typeof firstItem[key] === 'string')
  if (stringKeys.length > 0) {
    // Prefer time/date fields
    const timeKey = stringKeys.find(key => 
      key.toLowerCase().includes('time') || 
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('month') ||
      key.toLowerCase().includes('year')
    )
    if (timeKey) return timeKey
    
    // Prefer name/label fields
    const nameKey = stringKeys.find(key =>
      key.toLowerCase().includes('name') ||
      key.toLowerCase().includes('label') ||
      key.toLowerCase().includes('category')
    )
    if (nameKey) return nameKey
    
    return stringKeys[0]
  }
  
  return keys[0]
}

/**
 * Detect appropriate Y-axis key
 */
function detectYKey(keys: string[], firstItem: any, xKey: string): string {
  // Find numeric fields excluding xKey
  const numericKeys = keys.filter(key => 
    key !== xKey && typeof firstItem[key] === 'number'
  )
  
  if (numericKeys.length > 0) {
    // Prefer value/amount fields
    const valueKey = numericKeys.find(key =>
      key.toLowerCase().includes('value') ||
      key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('count') ||
      key.toLowerCase().includes('total')
    )
    if (valueKey) return valueKey
    
    return numericKeys[0]
  }
  
  // Fallback to second key if no numeric fields
  return keys.filter(key => key !== xKey)[0] || keys[1] || keys[0]
}

/**
 * Load previous messages with optimized error handling
 */
async function loadChatMessages(chatId: string): Promise<CoreMessage[]> {
  if (!chatId) return []
  
  try {
    const [chat, messages] = await Promise.all([
      aiSdkChatPersistence.getChat(chatId),
      aiSdkChatPersistence.getMessages(chatId)
    ])
    
    if (!chat) {
      console.log(`[CHAT] Chat ${chatId} not found`)
      return []
    }

    return messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      createdAt: msg.createdAt
    }))
  } catch (error) {
    console.error(`[CHAT] Failed to load messages for ${chatId}:`, error)
    return []
  }
}

/**
 * Save messages with improved error handling and batch operations
 */
async function saveChatMessage(chatId: string, message: any): Promise<void> {
  if (!chatId || !message) return
  
  try {
    await aiSdkChatPersistence.saveMessage({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt instanceof Date ? message.createdAt : new Date()
    }, chatId)
  } catch (error) {
    console.error(`[CHAT] Failed to save message ${message.id}:`, error)
    // Don't throw - message saving shouldn't break the chat flow
  }
}

/**
 * Enhanced user management with validation
 */
async function ensureUserExists(userId: string): Promise<void> {
  if (!userId || userId.length < 1) {
    throw new ValidationError('Invalid user ID provided')
  }
  
  try {
    await aiSdkChatPersistence.ensureUser({
      id: userId,
      email: userId.includes('@') ? userId : `${userId}@example.com`,
      name: userId.includes('@') ? userId.split('@')[0] : 'User'
    })
  } catch (error) {
    console.error(`[USER] Failed to ensure user ${userId}:`, error)
    throw new ValidationError(`Failed to initialize user: ${userId}`)
  }
}

/**
 * Create optimized system prompt
 */
function createSystemPrompt(connectedServers: any[], servers: any[], toolCount: number): string {
  const serverStatus = `${connectedServers.length}/${servers.length} servers connected`
  const toolStatus = `${toolCount} tools available`
  
  return `You are DiGIT, an enterprise data intelligence assistant powered by MCP (Model Context Protocol) and Azure OpenAI. You help data analysts and product owners discover insights from their data.

**System Status:** ${serverStatus}, ${toolStatus}

**Available MCP Servers:**
${connectedServers.length > 0 
  ? connectedServers.map((server) => `- ${server.name}: ${server.description} (${server.tools.length} tools)`).join("\n")
  : "⚠️ No MCP servers connected. Please check server configuration."
}

**Tool Categories:**
${connectedServers.length > 0
  ? connectedServers.map(server => 
      `${server.name}: ${server.tools.length > 0 ? server.tools.join(", ") : "No tools"}`
    ).join("\n")
  : "No tools available"
}

**Artifact Generation:**
1. **Code blocks**: Use \`\`\`language\\ncode\\n\`\`\` format
2. **Mermaid diagrams**: Use \`\`\`mermaid\\ndiagram\\n\`\`\` format  
3. **Interactive charts**: Use \`\`\`json:chart:type\\n{"data": [...], "title": "Chart Title"}\\n\`\`\`
4. **Data tables**: Use \`\`\`json:table\\n{"data": [...], "title": "Table Title"}\\n\`\`\`

Always provide clear, professional responses suitable for enterprise use. If you encounter errors, explain them clearly and suggest alternative approaches.`
}

export async function POST(req: Request) {
  const requestStartTime = Date.now()
  let chatId: string | undefined
  
  try {
    // Parse and validate request with timeout
    const bodyPromise = req.json()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request parsing timeout')), 10000)
    )
    
    const body = await Promise.race([bodyPromise, timeoutPromise])
    const parsed = chatRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      console.error(`[REQUEST] Invalid schema:`, parsed.error.flatten())
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: parsed.error.flatten().fieldErrors,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    const { id: requestChatId, messages, userId } = parsed.data
    
    // Enhanced user validation
    const effectiveUserId = userId || body.userId
    if (!effectiveUserId) {
      return new Response(
        JSON.stringify({ 
          error: 'User ID is required',
          hint: 'Include userId in request body',
          timestamp: new Date().toISOString()
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Ensure user exists with proper error handling
    try {
      await ensureUserExists(effectiveUserId)
    } catch (userError) {
      console.error(`[USER] User validation failed:`, userError)
      return new Response(
        JSON.stringify({
          error: 'User validation failed',
          details: userError instanceof Error ? userError.message : 'Unknown user error',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Optimized chat handling
    chatId = requestChatId || body.id
    if (!chatId) {
      try {
        const newChat = await aiSdkChatPersistence.createChat(effectiveUserId)
        chatId = newChat.id
        console.log(`[CHAT] Created new chat: ${chatId}`)
      } catch (chatError) {
        console.error(`[CHAT] Failed to create chat:`, chatError)
        return new Response(
          JSON.stringify({
            error: 'Failed to create chat',
            details: chatError instanceof Error ? chatError.message : 'Unknown chat error',
            timestamp: new Date().toISOString()
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Initialize MCP client with timeout
    if (!mcpClient.isReady()) {
      const initPromise = mcpClient.initialize()
      const initTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MCP initialization timeout')), 15000)
      )
      
      try {
        await Promise.race([initPromise, initTimeout])
        console.log(`[MCP] Client initialized successfully`)
      } catch (mcpError) {
        console.error(`[MCP] Initialization failed:`, mcpError)
        // Continue without MCP - don't fail the entire request
      }
    }

    // Prepare tools with error handling
    let tools: Record<string, any> = {}
    let connectedServers: any[] = []
    let servers: any[] = []
    
    try {
      const mcpResult = await prepareMcpTools()
      tools = mcpResult.tools
      connectedServers = mcpResult.connectedServers
      servers = mcpResult.servers
      console.log(`[MCP] Prepared ${Object.keys(tools).length} tools`)
    } catch (toolError) {
      console.error(`[MCP] Tool preparation failed:`, toolError)
      // Continue with empty tools - don't fail the request
    }

    // Validate Azure OpenAI configuration
    try {
      getAzureOpenAIModel()
    } catch (llmError) {
      console.error(`[AZURE] Configuration error:`, llmError)
      const errorMessage = llmError instanceof Error ? llmError.message : 'Unknown Azure OpenAI error'
      return new Response(
        JSON.stringify({
          error: 'Azure OpenAI configuration error', 
          details: errorMessage,
          provider: 'azure',
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process messages with validation
    const coreMessages = messages.map(msg => {
      // Validate message content length
      if (msg.content && msg.content.length > 50000) {
        console.warn(`[MESSAGE] Truncating long message: ${msg.content.length} chars`)
        msg.content = msg.content.substring(0, 50000) + '... [truncated]'
      }
      
      return {
        role: msg.role === 'tool' ? 'assistant' : msg.role,
        content: msg.content,
        name: msg.name,
        toolInvocations: msg.toolInvocations
      } as CoreMessage
    })

    const systemPrompt = createSystemPrompt(connectedServers, servers, Object.keys(tools).length)
    const setupTime = Date.now() - requestStartTime
    console.log(`[REQUEST] Setup completed in ${setupTime}ms, starting LLM stream...`)
    
    try {
      const result = await streamText({
        model: getAzureOpenAIModel(),
        system: systemPrompt,
        messages: coreMessages,
        tools,
        maxSteps: 5,
        onFinish: async ({ response, finishReason, usage, text }) => {
          const totalTime = Date.now() - requestStartTime
          console.log(`[STREAM] Completed in ${totalTime}ms, reason: ${finishReason}`)
          
          try {
            // Format messages for persistence
            const formattedMessages = messages.map(msg => ({
              ...msg,
              role: msg.role === 'tool' ? 'data' as const : msg.role,
              createdAt: msg.createdAt instanceof Date ? msg.createdAt : 
                       typeof msg.createdAt === 'string' ? new Date(msg.createdAt) : 
                       new Date()
            }))

            // Add assistant response
            const assistantMessage = {
              id: generateUUID(),
              role: 'assistant' as const,
              content: text,
              createdAt: new Date()
            }

            // Save with batch operation
            await aiSdkChatPersistence.handleMessageCompletion(
              [...formattedMessages, assistantMessage],
              chatId!,
              { updateTitle: true }
            )
            
            console.log(`[PERSISTENCE] Saved ${formattedMessages.length + 1} messages`)
          } catch (saveError) {
            console.error(`[PERSISTENCE] Failed to save messages:`, saveError)
            // Don't fail the stream for persistence errors
          }
        }
      })

      return result.toDataStreamResponse()
      
    } catch (streamError) {
      const totalTime = Date.now() - requestStartTime
      console.error(`[STREAM] Error after ${totalTime}ms:`, streamError)
      
      // Enhanced error categorization
      const errorMessage = streamError instanceof Error ? streamError.message : 'Unknown streaming error'
      const { statusCode, userMessage } = categorizeStreamError(errorMessage)
      
      return new Response(
        JSON.stringify({ 
          error: userMessage,
          details: errorMessage,
          provider: 'azure',
          duration: totalTime,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: statusCode, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
    
  } catch (outerError) {
    const totalTime = Date.now() - requestStartTime
    console.error(`[REQUEST] Fatal error after ${totalTime}ms:`, outerError)
    const errorMessage = outerError instanceof Error ? outerError.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage,
        duration: totalTime,
        chatId,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}

/**
 * Categorize streaming errors for better user experience
 */
function categorizeStreamError(errorMessage: string): { statusCode: number; userMessage: string } {
  const lowerError = errorMessage.toLowerCase()
  
  if (lowerError.includes('timeout')) {
    return {
      statusCode: 408,
      userMessage: 'Request timed out. Please try again with a shorter message.'
    }
  }
  
  if (lowerError.includes('quota') || lowerError.includes('rate limit')) {
    return {
      statusCode: 429,
      userMessage: 'Azure OpenAI quota exceeded. Please try again later.'
    }
  }
  
  if (lowerError.includes('authentication') || lowerError.includes('unauthorized')) {
    return {
      statusCode: 401,
      userMessage: 'Azure OpenAI authentication failed. Please check your configuration.'
    }
  }
  
  if (lowerError.includes('deployment') || lowerError.includes('not found')) {
    return {
      statusCode: 404,
      userMessage: 'Azure OpenAI deployment not found. Please verify your deployment name.'
    }
  }
  
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
    return {
      statusCode: 503,
      userMessage: 'Network error connecting to Azure OpenAI. Please check your connection.'
    }
  }
  
  if (lowerError.includes('content filter') || lowerError.includes('safety')) {
    return {
      statusCode: 400,
      userMessage: 'Content was filtered by Azure OpenAI safety systems. Please rephrase your message.'
    }
  }
  
  return {
    statusCode: 500,
    userMessage: 'Azure OpenAI service error. Please try again.'
  }
}
