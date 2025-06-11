import { NextResponse } from 'next/server'
import { getActiveMCPServers } from '@/config/mcp-config'

export async function GET() {
  try {
    const serverConfigs = getActiveMCPServers()
    
    return NextResponse.json({
      servers: serverConfigs,
      enabled: process.env.ENABLE_MCP === 'true'
    })
  } catch (error) {
    console.error('Error fetching MCP config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MCP configuration' },
      { status: 500 }
    )
  }
}
