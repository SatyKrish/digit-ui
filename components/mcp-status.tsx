"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { mcpClient } from "@/lib/mcp-client"
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
        return "bg-green-500"
      case "disconnected":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-muted-foreground mr-1">MCP:</span>
      {servers.map((server) => (
        <TooltipProvider key={server.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex items-center gap-1.5 py-0 h-5 px-2 border-muted">
                {getServerIcon(server.id)}
                <span className="text-xs">{server.name}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(server.status)}`} />
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-xs">
                <p className="font-medium">{server.name}</p>
                <p className="text-muted-foreground">{server.description}</p>
                <p className="capitalize mt-1">
                  Status:{" "}
                  <span className={server.status === "connected" ? "text-green-500" : "text-red-500"}>
                    {server.status}
                  </span>
                </p>
                <p className="text-muted-foreground mt-1">{server.tools.length} tools available</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
