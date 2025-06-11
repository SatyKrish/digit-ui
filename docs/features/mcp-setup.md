# MCP Server Configuration Guide

This guide explains how to configure Model Context Protocol (MCP) servers for your Digit UI application.

## Overview

Digit UI uses the Model Context Protocol to connect to external servers that provide tools and capabilities for data analysis, file operations, and other functionality. The application supports both real MCP servers and fallback mode for development.

## Environment Configuration

Configure MCP servers using environment variables in your `.env.local` file:

```env
# Enable MCP functionality
ENABLE_MCP=true

# MCP Server URLs (leave empty for fallback mode)
MCP_DATABASE_SERVER_URL=http://localhost:3001
MCP_ANALYTICS_SERVER_URL=http://localhost:3002
MCP_FILE_SERVER_URL=http://localhost:3003
```

## Supported Server Types

### 1. Database Server (`database-server`)
Provides database query capabilities and schema introspection.

**Tools:**
- `query_database` - Execute SQL queries
- `get_schema` - Get database schema information
- `get_table_data` - Retrieve table data

**Example URL:** `http://localhost:3001`

### 2. Analytics Server (`analytics-server`)
Generates reports, visualizations, and analytical insights.

**Tools:**
- `generate_report` - Create analytical reports
- `create_visualization` - Generate charts and graphs
- `calculate_kpis` - Calculate key performance indicators

**Example URL:** `http://localhost:3002`

### 3. File Server (`file-server`)
Handles file system operations, reading, writing, and searching files.

**Tools:**
- `read_file` - Read file contents
- `list_files` - List directory contents
- `search_files` - Search file contents
- `write_file` - Write file contents

**Example URL:** `http://localhost:3003`

## Transport Protocols

The MCP client supports multiple transport protocols with automatic fallback:

1. **Streamable HTTP** (preferred) - Modern transport with session management
2. **SSE (Server-Sent Events)** - Legacy transport for compatibility
3. **WebSocket** - Real-time bidirectional communication
4. **stdio** - Process-based communication

## Fallback Mode

When server URLs are not configured, the application provides mock implementations of tools for development and testing purposes.

Fallback tools return helpful error messages indicating that real MCP servers need to be configured.

## Connection Management

The MCP client automatically:
- Connects to configured servers on startup
- Retries failed connections with exponential backoff
- Handles transport fallback (Streamable HTTP → SSE)
- Manages session state and reconnection
- Refreshes server capabilities periodically

## Retry Configuration

Connection retry behavior is configured in `src/config/mcp-config.ts`:

```typescript
export const mcpTransportConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  connectionTimeout: 10000,
  requestTimeout: 30000,
  keepAliveInterval: 30000
}
```

## Adding Custom Servers

To add a custom MCP server:

1. Set the environment variable:
   ```env
   MCP_CUSTOM_SERVER_URL=http://localhost:3004
   ```

2. Add server configuration in `src/config/mcp-config.ts`:
   ```typescript
   {
     id: "custom-server",
     name: "Custom Server",
     description: "Your custom MCP server",
     url: env.MCP_CUSTOM_SERVER_URL || undefined,
     transport: "http",
     enabled: true,
     fallback: true
   }
   ```

3. Optionally add fallback tools in the `getFallbackTools` method.

## API Endpoints

### GET /api/mcp
Get MCP server status and available tools.

### POST /api/mcp
Manage MCP servers with actions:
- `connect` - Connect to a server
- `disconnect` - Disconnect from a server  
- `add` - Add a new server
- `remove` - Remove a server
- `refresh` - Refresh server tools

## Monitoring

Monitor MCP server status in the UI:
- Status indicators in the header show connection state
- Tools panel displays available tools per server
- Console logs provide detailed connection information

## Troubleshooting

### Connection Issues
1. Verify server URLs are correct and accessible
2. Check server is running and responding to HTTP requests
3. Review console logs for detailed error messages
4. Try connecting to servers individually using the API

### Tool Execution Issues
1. Ensure server is connected (green status indicator)
2. Verify tool parameters match server expectations
3. Check server logs for execution errors
4. Test tools directly via the API endpoint

### Fallback Mode
If servers aren't connecting:
1. Tools will return helpful error messages when URLs aren't configured
2. Use for development when real servers aren't available
3. Each server type has predefined fallback tools available

## Security Considerations

1. **Server URLs** - Only connect to trusted MCP servers
2. **Network Access** - Ensure proper firewall configuration
3. **Authentication** - MCP servers should implement proper auth
4. **Input Validation** - Server responses are validated client-side
5. **Error Handling** - Sensitive information isn't exposed in errors

## Development

For local development:
1. Start your MCP servers on different ports
2. Configure environment variables to point to local servers
3. Use fallback mode when servers aren't available
4. Monitor connection status in the browser console

## Production Deployment

For production:
1. Deploy MCP servers to stable endpoints
2. Use HTTPS URLs for all server connections
3. Configure proper retry and timeout settings
4. Set up monitoring for server health
