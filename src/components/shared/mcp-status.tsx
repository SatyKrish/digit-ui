"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Database, BarChart3, FileText } from "lucide-react"
import { getSlideInStaggerClass } from "@/utils/animations"

interface MCPServer {
  id: string
  name: string
  description: string
  status: "connected" | "disconnected" | "error" | "connecting"
  tools: string[]
  error?: string
  url?: string
}

export function MCPStatus() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  useEffect(() => {
    // Initial load
    const loadServers = async () => {
      try {
        // Fetch status from server-side API instead of client-side MCP client
        const response = await fetch('/api/mcp')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        setServers(data.servers || [])
        setLastUpdate(Date.now())
        console.log('MCP servers loaded:', data.servers?.map((s: MCPServer) => `${s.name}: ${s.status}`))
      } catch (error) {
        console.error('Failed to load MCP servers:', error)
      }
    }

    loadServers()

    // Refresh every 10 seconds for more responsive UI
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/mcp')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const updatedServers = data.servers || []
        
        // Only update if there are actual changes
        const currentServerStates = servers.map((s: MCPServer) => `${s.id}:${s.status}`).join(',')
        const newServerStates = updatedServers.map((s: MCPServer) => `${s.id}:${s.status}`).join(',')
        
        if (currentServerStates !== newServerStates) {
          console.log('MCP server status changed:', updatedServers.map((s: MCPServer) => `${s.name}: ${s.status}`))
          setServers(updatedServers)
          setLastUpdate(Date.now())
        }
      } catch (error) {
        console.error('Failed to refresh MCP servers:', error)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getServerIcon = (serverId: string) => {
    switch (serverId) {
      case "database-server":
        return <Database className="h-4 w-4" />
      case "analytics-server":
        return <BarChart3 className="h-4 w-4" />
      case "file-server":
        return <FileText className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "success"
      case "connecting":
        return "default"
      case "disconnected":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-success shadow-glow"
      case "connecting":
        return "bg-primary animate-pulse"
      case "disconnected":
        return "bg-muted"
      case "error":
        return "bg-destructive animate-pulse"
      default:
        return "bg-muted"
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <span className="text-xs text-muted-foreground font-medium">MCP:</span>
      {servers.map((server, index) => (
        <TooltipProvider key={server.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={getStatusColor(server.status)} 
                className={`flex items-center gap-2 py-1 h-7 px-3 transition-all duration-200 hover:scale-105 animate-slide-in-left ${getSlideInStaggerClass(index)}`}
              >
                {getServerIcon(server.id)}
                <span className="text-xs font-medium">{server.name}</span>
                <span className={`h-2 w-2 rounded-full ${getStatusIndicator(server.status)}`} />
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="shadow-elegant">
              <div className="text-xs space-y-2">
                <p className="font-semibold">{server.name}</p>
                <p className="text-muted-foreground leading-relaxed">{server.description}</p>
                <div className="flex items-center gap-2">
                  <span>Status:</span>
                  <Badge 
                    variant={getStatusColor(server.status)} 
                    className="capitalize text-xs"
                  >
                    {server.status}
                  </Badge>
                </div>
                {server.error && (
                  <p className="text-red-600 text-xs">
                    Error: {server.error}
                  </p>
                )}
                <p className="text-muted-foreground">
                  <span className="font-medium">{server.tools.length}</span> tools available
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
