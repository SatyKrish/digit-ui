import { openai } from "@ai-sdk/openai"
import { streamText, convertToCoreMessages } from "ai"
import { mcpClient } from "@/client/mcp-client"
import { chatService } from "@/services/chat/chat-service"

export async function POST(req: Request) {
  const { messages, userId } = await req.json()

  // Initialize chat service for user if userId is provided
  if (userId) {
    await chatService.initializeForUser({
      id: userId,
      email: userId,
      name: 'User'
    })
  }

  // Get available MCP servers and their capabilities
  const servers = mcpClient.getAvailableServers()
  const connectedServers = mcpClient.getConnectedServers()
  const availableTools = mcpClient.getAllTools()

  // Create tools object for AI SDK
  const tools: Record<string, any> = {}

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
      const result = await mcpClient.callTool("database-server", "query_database", { query, database })
      return result
    },
  }

  tools.get_schema = {
    description: "Get database schema information",
    parameters: {
      type: "object",
      properties: {
        table: { type: "string", description: "Specific table name (optional)" },
      },
    },
    execute: async ({ table }: { table?: string }) => {
      const result = await mcpClient.callTool("database-server", "get_schema", { table })
      return result
    },
  }

  tools.get_table_data = {
    description: "Get sample data from a table",
    parameters: {
      type: "object",
      properties: {
        table: { type: "string", description: "Table name" },
        limit: { type: "number", description: "Number of rows to return", default: 10 },
      },
      required: ["table"],
    },
    execute: async ({ table, limit }: { table: string; limit?: number }) => {
      const result = await mcpClient.callTool("database-server", "get_table_data", { table, limit })
      return result
    },
  }

  // Analytics tools
  tools.generate_report = {
    description: "Generate analytical reports",
    parameters: {
      type: "object",
      properties: {
        reportType: {
          type: "string",
          enum: ["sales", "customer", "financial", "operational"],
          description: "Type of report to generate",
        },
        dateRange: { type: "string", description: "Date range for the report" },
        filters: { type: "object", description: "Additional filters" },
      },
      required: ["reportType"],
    },
    execute: async ({ reportType, dateRange, filters }: { reportType: string; dateRange?: string; filters?: any }) => {
      const result = await mcpClient.callTool("analytics-server", "generate_report", {
        reportType,
        dateRange,
        filters,
      })
      return result
    },
  }

  tools.create_visualization = {
    description: "Create data visualizations",
    parameters: {
      type: "object",
      properties: {
        chartType: {
          type: "string",
          enum: ["bar", "line", "pie", "heatmap", "treemap"],
          description: "Type of chart to create",
        },
        dataSource: { type: "string", description: "Data source identifier" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        dimensions: { type: "array", items: { type: "string" }, description: "Dimensions to include" },
      },
      required: ["chartType", "dataSource"],
    },
    execute: async ({ chartType, dataSource, metrics, dimensions }: { 
      chartType: string; 
      dataSource: string; 
      metrics?: string[]; 
      dimensions?: string[] 
    }) => {
      const result = await mcpClient.callTool("analytics-server", "create_visualization", {
        chartType,
        dataSource,
        metrics,
        dimensions,
      })
      return result
    },
  }

  tools.calculate_kpis = {
    description: "Calculate key performance indicators",
    parameters: {
      type: "object",
      properties: {
        kpiType: { type: "string", description: "Type of KPI to calculate" },
        period: { type: "string", description: "Time period for calculation" },
      },
      required: ["kpiType"],
    },
    execute: async ({ kpiType, period }: { kpiType: string; period?: string }) => {
      const result = await mcpClient.callTool("analytics-server", "calculate_kpis", { kpiType, period })
      return result
    },
  }

  // File tools
  tools.read_file = {
    description: "Read file contents",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path" },
        encoding: { type: "string", description: "File encoding", default: "utf-8" },
      },
      required: ["path"],
    },
    execute: async ({ path, encoding }: { path: string; encoding?: string }) => {
      const result = await mcpClient.callTool("file-server", "read_file", { path, encoding })
      return result
    },
  }

  tools.list_files = {
    description: "List files in a directory",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path" },
        pattern: { type: "string", description: "File pattern filter" },
      },
      required: ["path"],
    },
    execute: async ({ path, pattern }: { path: string; pattern?: string }) => {
      const result = await mcpClient.callTool("file-server", "list_files", { path, pattern })
      return result
    },
  }

  tools.search_files = {
    description: "Search for files by content",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        path: { type: "string", description: "Search path" },
        fileTypes: { type: "array", items: { type: "string" }, description: "File types to search" },
      },
      required: ["query"],
    },
    execute: async ({ query, path, fileTypes }: { query: string; path?: string; fileTypes?: string[] }) => {
      const result = await mcpClient.callTool("file-server", "search_files", { query, path, fileTypes })
      return result
    },
  }

  const systemPrompt = `You are DIGIT, an enterprise data intelligence assistant powered by MCP (Model Context Protocol). You help data analysts and product owners discover insights from their data.

You have access to MCP servers that provide real data access:

**Available MCP Servers:**
${connectedServers
  .map((server) => `- ${server.name}: ${server.description} (${server.tools.length} tools available)`)
  .join("\n")}

**Available Tools by Server:**
${connectedServers
  .map(
    (server) => `${server.name}:
${server.tools.map((tool) => `  - ${tool}`).join("\n")}`,
  )
  .join("\n\n")}

**Instructions:**
1. When users ask about data, use the appropriate MCP tools to fetch real information
2. For database queries, use tools like query_database, get_schema, get_table_data
3. For analytics, use generate_report, create_visualization, calculate_kpis
4. For file operations, use read_file, list_files, search_files
5. Always explain what data you're fetching and present results clearly
6. Create appropriate artifacts (charts, tables, etc.) from the tool results

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
Available domains: Account, Party, Holdings, Transaction, Customer, Product, Order, Payment`

  const result = await streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: convertToCoreMessages(messages),
    tools,
    maxSteps: 5,
    onFinish: async ({ response, finishReason, usage, text }) => {
      // Save messages to database if userId is provided
      if (userId) {
        try {
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
