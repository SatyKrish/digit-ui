import { NextResponse } from 'next/server'
import { mcpClient } from '../../../../client/mcp-client'

export async function POST(req: Request) {
  try {
    const { serverId, toolName, args } = await req.json()

    if (!serverId || !toolName) {
      return NextResponse.json(
        { error: 'Server ID and tool name are required' },
        { status: 400 }
      )
    }

    // Ensure MCP client is initialized
    if (!mcpClient.isReady()) {
      await mcpClient.initialize()
    }

    const result = await mcpClient.callTool(serverId, toolName, args || {})
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error calling MCP tool:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
