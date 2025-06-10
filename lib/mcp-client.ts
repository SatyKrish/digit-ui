// MCP Server types
export interface MCPServer {
  id: string
  name: string
  description: string
  status: "connected" | "disconnected" | "error"
  tools: string[]
  error?: string
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

// Mock MCP servers for demonstration
const mockServers: MCPServer[] = [
  {
    id: "database-server",
    name: "Database Server",
    description: "Provides access to enterprise databases",
    status: "connected",
    tools: ["query_database", "get_schema", "get_table_data"],
  },
  {
    id: "analytics-server",
    name: "Analytics Server",
    description: "Provides analytics and reporting capabilities",
    status: "connected",
    tools: ["generate_report", "create_visualization", "calculate_kpis"],
  },
  {
    id: "file-server",
    name: "File Server",
    description: "Provides access to enterprise files and documents",
    status: "connected",
    tools: ["read_file", "list_files", "search_files"],
  },
]

// Mock MCP tools for demonstration
const mockTools: MCPTool[] = [
  // Database tools
  {
    name: "query_database",
    description: "Execute SQL queries against the database",
    serverId: "database-server",
    serverName: "Database Server",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query to execute" },
        database: { type: "string", description: "Database name (optional)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_schema",
    description: "Get database schema information",
    serverId: "database-server",
    serverName: "Database Server",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string", description: "Specific table name (optional)" },
      },
    },
  },
  {
    name: "get_table_data",
    description: "Get sample data from a table",
    serverId: "database-server",
    serverName: "Database Server",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string", description: "Table name" },
        limit: { type: "number", description: "Number of rows to return", default: 10 },
      },
      required: ["table"],
    },
  },

  // Analytics tools
  {
    name: "generate_report",
    description: "Generate analytical reports",
    serverId: "analytics-server",
    serverName: "Analytics Server",
    inputSchema: {
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
  },
  {
    name: "create_visualization",
    description: "Create data visualizations",
    serverId: "analytics-server",
    serverName: "Analytics Server",
    inputSchema: {
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
  },
  {
    name: "calculate_kpis",
    description: "Calculate key performance indicators",
    serverId: "analytics-server",
    serverName: "Analytics Server",
    inputSchema: {
      type: "object",
      properties: {
        kpiType: { type: "string", description: "Type of KPI to calculate" },
        period: { type: "string", description: "Time period for calculation" },
      },
      required: ["kpiType"],
    },
  },

  // File tools
  {
    name: "read_file",
    description: "Read file contents",
    serverId: "file-server",
    serverName: "File Server",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path" },
        encoding: { type: "string", description: "File encoding", default: "utf-8" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List files in a directory",
    serverId: "file-server",
    serverName: "File Server",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path" },
        pattern: { type: "string", description: "File pattern filter" },
      },
      required: ["path"],
    },
  },
  {
    name: "search_files",
    description: "Search for files by content",
    serverId: "file-server",
    serverName: "File Server",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        path: { type: "string", description: "Search path" },
        fileTypes: { type: "array", items: { type: "string" }, description: "File types to search" },
      },
      required: ["query"],
    },
  },
]

// Mock data for tool responses
const mockData = {
  // Database mock data
  tables: [
    { name: "customers", description: "Customer information" },
    { name: "products", description: "Product catalog" },
    { name: "orders", description: "Order transactions" },
    { name: "invoices", description: "Invoice records" },
    { name: "employees", description: "Employee information" },
  ],
  schemas: {
    customers: [
      { column: "customer_id", type: "INTEGER", nullable: false, isPrimary: true },
      { column: "first_name", type: "VARCHAR(50)", nullable: false },
      { column: "last_name", type: "VARCHAR(50)", nullable: false },
      { column: "email", type: "VARCHAR(100)", nullable: false },
      { column: "phone", type: "VARCHAR(20)", nullable: true },
      { column: "address", type: "VARCHAR(200)", nullable: true },
      { column: "city", type: "VARCHAR(50)", nullable: true },
      { column: "state", type: "VARCHAR(50)", nullable: true },
      { column: "postal_code", type: "VARCHAR(20)", nullable: true },
      { column: "country", type: "VARCHAR(50)", nullable: true },
      { column: "created_at", type: "TIMESTAMP", nullable: false },
      { column: "updated_at", type: "TIMESTAMP", nullable: false },
    ],
    products: [
      { column: "product_id", type: "INTEGER", nullable: false, isPrimary: true },
      { column: "name", type: "VARCHAR(100)", nullable: false },
      { column: "description", type: "TEXT", nullable: true },
      { column: "price", type: "DECIMAL(10,2)", nullable: false },
      { column: "category", type: "VARCHAR(50)", nullable: true },
      { column: "inventory", type: "INTEGER", nullable: false },
      { column: "created_at", type: "TIMESTAMP", nullable: false },
      { column: "updated_at", type: "TIMESTAMP", nullable: false },
    ],
    orders: [
      { column: "order_id", type: "INTEGER", nullable: false, isPrimary: true },
      { column: "customer_id", type: "INTEGER", nullable: false, isForeign: true },
      { column: "order_date", type: "TIMESTAMP", nullable: false },
      { column: "status", type: "VARCHAR(20)", nullable: false },
      { column: "total_amount", type: "DECIMAL(10,2)", nullable: false },
      { column: "payment_method", type: "VARCHAR(50)", nullable: true },
      { column: "shipping_address", type: "VARCHAR(200)", nullable: true },
      { column: "shipping_city", type: "VARCHAR(50)", nullable: true },
      { column: "shipping_state", type: "VARCHAR(50)", nullable: true },
      { column: "shipping_postal_code", type: "VARCHAR(20)", nullable: true },
      { column: "shipping_country", type: "VARCHAR(50)", nullable: true },
      { column: "created_at", type: "TIMESTAMP", nullable: false },
      { column: "updated_at", type: "TIMESTAMP", nullable: false },
    ],
  },
  tableData: {
    customers: [
      {
        customer_id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "555-123-4567",
        country: "USA",
        created_at: "2023-01-15T08:30:00Z",
      },
      {
        customer_id: 2,
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@example.com",
        phone: "555-987-6543",
        country: "Canada",
        created_at: "2023-02-20T10:15:00Z",
      },
      {
        customer_id: 3,
        first_name: "Robert",
        last_name: "Johnson",
        email: "robert.j@example.com",
        phone: "555-456-7890",
        country: "UK",
        created_at: "2023-03-05T14:45:00Z",
      },
      {
        customer_id: 4,
        first_name: "Sarah",
        last_name: "Williams",
        email: "sarah.w@example.com",
        phone: "555-789-0123",
        country: "Australia",
        created_at: "2023-04-10T09:20:00Z",
      },
      {
        customer_id: 5,
        first_name: "Michael",
        last_name: "Brown",
        email: "michael.b@example.com",
        phone: "555-321-6547",
        country: "USA",
        created_at: "2023-05-25T11:30:00Z",
      },
    ],
    products: [
      {
        product_id: 1,
        name: "Laptop Pro",
        description: "High-performance laptop for professionals",
        price: 1299.99,
        category: "Electronics",
        inventory: 45,
      },
      {
        product_id: 2,
        name: "Smartphone X",
        description: "Latest smartphone with advanced features",
        price: 899.99,
        category: "Electronics",
        inventory: 120,
      },
      {
        product_id: 3,
        name: "Wireless Headphones",
        description: "Noise-cancelling wireless headphones",
        price: 199.99,
        category: "Audio",
        inventory: 78,
      },
      {
        product_id: 4,
        name: "Smart Watch",
        description: "Fitness and health tracking smartwatch",
        price: 249.99,
        category: "Wearables",
        inventory: 53,
      },
      {
        product_id: 5,
        name: "Tablet Mini",
        description: "Compact tablet for everyday use",
        price: 399.99,
        category: "Electronics",
        inventory: 92,
      },
    ],
    orders: [
      {
        order_id: 1,
        customer_id: 1,
        order_date: "2023-06-10T15:30:00Z",
        status: "Delivered",
        total_amount: 1499.98,
        payment_method: "Credit Card",
      },
      {
        order_id: 2,
        customer_id: 2,
        order_date: "2023-06-15T09:45:00Z",
        status: "Shipped",
        total_amount: 899.99,
        payment_method: "PayPal",
      },
      {
        order_id: 3,
        customer_id: 3,
        order_date: "2023-06-20T14:15:00Z",
        status: "Processing",
        total_amount: 449.98,
        payment_method: "Credit Card",
      },
      {
        order_id: 4,
        customer_id: 1,
        order_date: "2023-06-25T11:20:00Z",
        status: "Delivered",
        total_amount: 199.99,
        payment_method: "Debit Card",
      },
      {
        order_id: 5,
        customer_id: 4,
        order_date: "2023-06-30T16:40:00Z",
        status: "Shipped",
        total_amount: 649.98,
        payment_method: "Credit Card",
      },
    ],
  },

  // Analytics mock data
  reports: {
    sales: {
      title: "Sales Performance Report",
      period: "Last 30 Days",
      summary: "Overall sales have increased by 12% compared to the previous period.",
      kpis: [
        { name: "Total Revenue", value: "$245,678.90", change: 12.3, trend: "up" },
        { name: "Average Order Value", value: "$127.45", change: 3.7, trend: "up" },
        { name: "Conversion Rate", value: "3.2%", change: 0.5, trend: "up" },
        { name: "Return Rate", value: "2.1%", change: -0.3, trend: "down" },
      ],
      charts: [
        {
          type: "bar",
          title: "Revenue by Product Category",
          data: [
            { name: "Electronics", value: 98500 },
            { name: "Clothing", value: 54200 },
            { name: "Home & Kitchen", value: 38700 },
            { name: "Sports & Outdoors", value: 29800 },
            { name: "Books", value: 24400 },
          ],
        },
        {
          type: "line",
          title: "Daily Sales Trend",
          data: [
            { name: "Week 1", value: 45600 },
            { name: "Week 2", value: 52300 },
            { name: "Week 3", value: 59800 },
            { name: "Week 4", value: 87900 },
          ],
        },
      ],
      tables: [
        {
          title: "Top Selling Products",
          data: [
            { rank: 1, product: "Smartphone X", units: 1245, revenue: "$1,120,500" },
            { rank: 2, product: "Laptop Pro", units: 890, revenue: "$1,067,890" },
            { rank: 3, product: "Wireless Earbuds", units: 1520, revenue: "$182,400" },
            { rank: 4, product: "Smart Watch", units: 760, revenue: "$167,200" },
            { rank: 5, product: "Tablet Mini", units: 675, revenue: "$236,250" },
          ],
        },
      ],
    },
    customer: {
      title: "Customer Analytics Report",
      period: "Q2 2023",
      summary: "Customer acquisition cost has decreased while lifetime value has increased.",
      kpis: [
        { name: "New Customers", value: "1,245", change: 8.7, trend: "up" },
        { name: "Customer Retention", value: "76.3%", change: 2.1, trend: "up" },
        { name: "Avg. Lifetime Value", value: "$438.25", change: 5.4, trend: "up" },
        { name: "Acquisition Cost", value: "$28.50", change: -3.2, trend: "down" },
      ],
      charts: [
        {
          type: "pie",
          title: "Customer Segmentation",
          data: [
            { name: "New", value: 25 },
            { name: "Occasional", value: 30 },
            { name: "Regular", value: 35 },
            { name: "Loyal", value: 10 },
          ],
        },
        {
          type: "bar",
          title: "Customers by Region",
          data: [
            { name: "North America", value: 4500 },
            { name: "Europe", value: 3200 },
            { name: "Asia Pacific", value: 2800 },
            { name: "Latin America", value: 1200 },
            { name: "Africa & Middle East", value: 800 },
          ],
        },
      ],
    },
  },

  // File mock data
  files: {
    "data/": [
      { name: "customer_data.csv", type: "file", size: "2.4 MB", modified: "2023-06-15T10:30:00Z" },
      { name: "product_catalog.json", type: "file", size: "1.8 MB", modified: "2023-06-20T14:15:00Z" },
      { name: "sales_q2_2023.xlsx", type: "file", size: "3.7 MB", modified: "2023-07-01T09:45:00Z" },
      { name: "marketing_assets/", type: "directory", modified: "2023-06-25T11:20:00Z" },
      { name: "analytics/", type: "directory", modified: "2023-06-30T16:40:00Z" },
    ],
    "data/marketing_assets/": [
      { name: "logo.png", type: "file", size: "0.5 MB", modified: "2023-05-10T08:30:00Z" },
      { name: "banner.jpg", type: "file", size: "1.2 MB", modified: "2023-05-15T13:45:00Z" },
      { name: "product_photos/", type: "directory", modified: "2023-05-20T10:15:00Z" },
      { name: "videos/", type: "directory", modified: "2023-05-25T14:30:00Z" },
    ],
    "data/analytics/": [
      { name: "user_behavior.csv", type: "file", size: "4.1 MB", modified: "2023-06-05T09:20:00Z" },
      { name: "conversion_funnel.json", type: "file", size: "0.8 MB", modified: "2023-06-10T11:45:00Z" },
      { name: "ab_test_results.xlsx", type: "file", size: "1.5 MB", modified: "2023-06-15T15:30:00Z" },
      { name: "dashboards/", type: "directory", modified: "2023-06-20T10:10:00Z" },
    ],
  },
  fileContents: {
    "data/customer_data.csv": `customer_id,first_name,last_name,email,country,purchase_count,total_spent
1,John,Doe,john.doe@example.com,USA,12,1245.67
2,Jane,Smith,jane.smith@example.com,Canada,8,876.50
3,Robert,Johnson,robert.j@example.com,UK,15,1678.90
4,Sarah,Williams,sarah.w@example.com,Australia,5,567.25
5,Michael,Brown,michael.b@example.com,USA,20,2134.80`,
    "data/product_catalog.json": `{
  "products": [
    {
      "id": 1,
      "name": "Laptop Pro",
      "category": "Electronics",
      "price": 1299.99,
      "stock": 45,
      "rating": 4.8
    },
    {
      "id": 2,
      "name": "Smartphone X",
      "category": "Electronics",
      "price": 899.99,
      "stock": 120,
      "rating": 4.7
    },
    {
      "id": 3,
      "name": "Wireless Headphones",
      "category": "Audio",
      "price": 199.99,
      "stock": 78,
      "rating": 4.5
    },
    {
      "id": 4,
      "name": "Smart Watch",
      "category": "Wearables",
      "price": 249.99,
      "stock": 53,
      "rating": 4.6
    },
    {
      "id": 5,
      "name": "Tablet Mini",
      "category": "Electronics",
      "price": 399.99,
      "stock": 92,
      "rating": 4.4
    }
  ]
}`,
  },
}

// MCP Client class
class MCPClientImpl {
  private servers: MCPServer[] = []
  private tools: MCPTool[] = []
  private isInitialized = false

  constructor() {
    // Initialize with mock data for demonstration
    this.servers = mockServers
    this.tools = mockTools
    this.isInitialized = true
  }

  // Get all available MCP servers
  getAvailableServers(): MCPServer[] {
    return this.servers
  }

  // Get all connected MCP servers
  getConnectedServers(): MCPServer[] {
    return this.servers.filter((server) => server.status === "connected")
  }

  // Get all tools from all servers
  getAllTools(): MCPTool[] {
    return this.tools
  }

  // Get tools for a specific server
  getServerTools(serverId: string): MCPTool[] {
    return this.tools.filter((tool) => tool.serverId === serverId)
  }

  // Call a tool on a specific server
  async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    console.log(`Calling tool ${toolName} on server ${serverId} with args:`, args)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Find the tool
    const tool = this.tools.find((t) => t.serverId === serverId && t.name === toolName)
    if (!tool) {
      return {
        success: false,
        error: `Tool ${toolName} not found on server ${serverId}`,
      }
    }

    try {
      // Mock responses based on the tool
      switch (toolName) {
        // Database tools
        case "query_database":
          if (args.query.toLowerCase().includes("select") && args.query.toLowerCase().includes("from")) {
            const tableName = args.query
              .toLowerCase()
              .split("from")[1]
              .trim()
              .split(" ")[0]
              .replace(/[^a-zA-Z0-9_]/g, "")
            if (mockData.tableData[tableName]) {
              return {
                success: true,
                data: {
                  columns: Object.keys(mockData.tableData[tableName][0]),
                  rows: mockData.tableData[tableName],
                  rowCount: mockData.tableData[tableName].length,
                  query: args.query,
                },
              }
            }
          }
          return {
            success: true,
            data: {
              columns: ["result"],
              rows: [{ result: "Query executed successfully" }],
              rowCount: 1,
              query: args.query,
            },
          }

        case "get_schema":
          if (args.table && mockData.schemas[args.table]) {
            return {
              success: true,
              data: {
                table: args.table,
                columns: mockData.schemas[args.table],
              },
            }
          }
          return {
            success: true,
            data: {
              tables: mockData.tables,
            },
          }

        case "get_table_data":
          if (mockData.tableData[args.table]) {
            const limit = args.limit || 10
            return {
              success: true,
              data: {
                table: args.table,
                columns: Object.keys(mockData.tableData[args.table][0]),
                rows: mockData.tableData[args.table].slice(0, limit),
                rowCount: Math.min(mockData.tableData[args.table].length, limit),
                totalRows: mockData.tableData[args.table].length,
              },
            }
          }
          return {
            success: false,
            error: `Table ${args.table} not found`,
          }

        // Analytics tools
        case "generate_report":
          if (mockData.reports[args.reportType]) {
            return {
              success: true,
              data: mockData.reports[args.reportType],
            }
          }
          return {
            success: false,
            error: `Report type ${args.reportType} not found`,
          }

        case "create_visualization":
          return {
            success: true,
            data: {
              chartType: args.chartType,
              title: `${args.dataSource} ${args.chartType} Chart`,
              data:
                args.chartType === "pie"
                  ? mockData.reports.customer.charts[0].data
                  : mockData.reports.sales.charts[0].data,
            },
          }

        case "calculate_kpis":
          return {
            success: true,
            data: {
              kpiType: args.kpiType,
              period: args.period || "Last 30 days",
              kpis: mockData.reports.sales.kpis,
            },
          }

        // File tools
        case "list_files":
          const path = args.path || "data/"
          if (mockData.files[path]) {
            return {
              success: true,
              data: {
                path: path,
                files: mockData.files[path],
              },
            }
          }
          return {
            success: false,
            error: `Path ${path} not found`,
          }

        case "read_file":
          if (mockData.fileContents[args.path]) {
            return {
              success: true,
              data: {
                path: args.path,
                content: mockData.fileContents[args.path],
                encoding: args.encoding || "utf-8",
              },
            }
          }
          return {
            success: false,
            error: `File ${args.path} not found`,
          }

        case "search_files":
          return {
            success: true,
            data: {
              query: args.query,
              path: args.path || "data/",
              results: [
                { path: "data/customer_data.csv", matches: 3 },
                { path: "data/product_catalog.json", matches: 1 },
              ],
            },
          }

        default:
          return {
            success: false,
            error: `Tool ${toolName} not implemented`,
          }
      }
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Connect to an MCP server
  async connectToServer(serverUrl: string): Promise<MCPServer> {
    console.log(`Connecting to MCP server: ${serverUrl}`)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demonstration, just return the first mock server
    return this.servers[0]
  }
}

// Export singleton instance
export const mcpClient = new MCPClientImpl()
