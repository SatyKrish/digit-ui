import { NextResponse } from 'next/server'
import { mcpClient } from '../../../client/mcp-client'

export async function GET() {
  try {
    // Ensure MCP client is initialized
    if (!mcpClient.isReady()) {
      await mcpClient.initialize()
    }

    const servers = mcpClient.getAvailableServers()
    const tools = mcpClient.getAllTools()

    return NextResponse.json({
      servers,
      tools,
      connected: servers.filter(s => s.status === 'connected').length,
      total: servers.length
    })
  } catch (error) {
    console.error('Error fetching MCP status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MCP status' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { action, serverId, serverConfig } = await req.json()

    switch (action) {
      case 'connect':
        if (!serverId) {
          return NextResponse.json(
            { error: 'Server ID is required' },
            { status: 400 }
          )
        }
        const server = await mcpClient.connectToServer(serverId)
        return NextResponse.json({ server })

      case 'disconnect':
        if (!serverId) {
          return NextResponse.json(
            { error: 'Server ID is required' },
            { status: 400 }
          )
        }
        await mcpClient.disconnectFromServer(serverId)
        return NextResponse.json({ success: true })

      case 'add':
        if (!serverConfig) {
          return NextResponse.json(
            { error: 'Server configuration is required' },
            { status: 400 }
          )
        }
        const newServer = await mcpClient.addServer(serverConfig)
        return NextResponse.json({ server: newServer })

      case 'remove':
        if (!serverId) {
          return NextResponse.json(
            { error: 'Server ID is required' },
            { status: 400 }
          )
        }
        await mcpClient.removeServer(serverId)
        return NextResponse.json({ success: true })

      case 'refresh':
        if (!serverId) {
          return NextResponse.json(
            { error: 'Server ID is required' },
            { status: 400 }
          )
        }
        const tools = await mcpClient.refreshServerTools(serverId)
        return NextResponse.json({ tools })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error managing MCP server:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
