"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { mcpClient } from "@/client/mcp-client"
import { Database, BarChart3, FileText } from "lucide-react"

export function MCPStatus() {
  const [servers, setServers] = useState<any[]>([])

  useEffect(() => {
    // Get MCP servers
    const availableServers = mcpClient.getAvailableServers()
    setServers(availableServers)

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      const updatedServers = mcpClient.getAvailableServers()
      setServers(updatedServers)
    }, 30000)

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
      case "fallback":
        return "warning"
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
      case "fallback":
        return "bg-yellow-500 animate-pulse"
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
                className={`flex items-center gap-2 py-1 h-7 px-3 transition-all duration-200 hover:scale-105 animate-slide-in-left animate-stagger-${Math.min(index + 1, 4)}`}
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
                {server.status === "fallback" && (
                  <p className="text-yellow-600 text-xs">
                    ⚠️ Running in fallback mode - configure URL to enable real connection
                  </p>
                )}
                {server.error && !server.error.includes("fallback mode") && (
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
