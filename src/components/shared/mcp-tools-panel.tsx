"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, BarChart3, FileText, RefreshCw, ChevronDown, ChevronRight } from "lucide-react"
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

interface MCPTool {
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

export function MCPToolsPanel() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [tools, setTools] = useState<MCPTool[]>([])
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [collapsedServers, setCollapsedServers] = useState<Record<string, boolean>>({})

  const loadMCPData = async () => {
    try {
      setIsRefreshing(true)
      
      // Fetch status from server-side API instead of client-side MCP client
      const response = await fetch('/api/mcp')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const updatedServers = data.servers || []
      setServers(updatedServers)
      setTools(data.tools || [])
      setLastUpdate(Date.now())

      // Initialize all servers as collapsed by default
      const initialCollapsedState: Record<string, boolean> = {}
      updatedServers.forEach((server: MCPServer) => {
        if (!(server.id in collapsedServers)) {
          initialCollapsedState[server.id] = true // Collapsed by default
        }
      })
      if (Object.keys(initialCollapsedState).length > 0) {
        setCollapsedServers(prev => ({ ...prev, ...initialCollapsedState }))
      }
    } catch (error) {
      console.error('Failed to load MCP data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleServerCollapse = (serverId: string) => {
    setCollapsedServers(prev => ({
      ...prev,
      [serverId]: !prev[serverId]
    }))
  }

  const handleManualRefresh = async () => {
    await loadMCPData()
  }

  useEffect(() => {
    // Initial load
    loadMCPData()

    // Refresh every 15 seconds to keep status updated
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/mcp')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const updatedServers = data.servers || []
        const updatedTools = data.tools || []
        
        // Check for changes before updating
        const serverStatusChanged = JSON.stringify(servers.map((s: MCPServer) => ({id: s.id, status: s.status}))) !== 
                                  JSON.stringify(updatedServers.map((s: MCPServer) => ({id: s.id, status: s.status})))
        const toolsChanged = tools.length !== updatedTools.length
        
        if (serverStatusChanged || toolsChanged) {
          console.log('MCP status update:', {
            servers: updatedServers.map((s: MCPServer) => `${s.name}: ${s.status}`),
            toolCount: updatedTools.length
          })
          setServers(updatedServers)
          setTools(updatedTools)
          setLastUpdate(Date.now())
        }
      } catch (error) {
        console.error('Failed to refresh MCP data:', error)
      }
    }, 15000)

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

  const getToolsByServer = (serverId: string) => {
    return tools.filter((tool) => tool.serverId === serverId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "success"
      case "connecting":
        return "default"
      case "disconnected":
        return "warning"
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
        return "bg-warning animate-pulse"
      case "error":
        return "bg-destructive animate-pulse"
      default:
        return "bg-muted"
    }
  }

  return (
    <div className="space-y-4">
      {servers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No MCP servers configured</p>
          <p className="text-xs">Configure MCP servers to see available tools</p>
        </div>
      ) : (
        servers.map((server, index) => (
              <Card key={server.id} className={`border border-border/50 shadow-soft hover:shadow-medium transition-all duration-200 ${getSlideInStaggerClass(index)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getServerIcon(server.id)}
                        <div>
                          <h3 className="font-semibold text-foreground">{server.name}</h3>
                          <p className="text-sm text-muted-foreground">{server.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Connection Status */}
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${getStatusIndicator(server.status)}`} />
                        <Badge 
                          variant={getStatusColor(server.status)} 
                          className="capitalize text-xs"
                        >
                          {server.status}
                        </Badge>
                      </div>
                      
                      {/* Tools Count */}
                      <Badge variant="outline" className="text-xs">
                        {getToolsByServer(server.id).length} tools
                      </Badge>
                      
                      {/* Collapse Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleServerCollapse(server.id)}
                        className="h-8 w-8 p-0 transition-all duration-200 hover:bg-muted/50"
                        aria-label={collapsedServers[server.id] ? `Expand ${server.name}` : `Collapse ${server.name}`}
                      >
                        {collapsedServers[server.id] ? (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {server.error && (
                    <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                      <strong>Error:</strong> {server.error}
                    </div>
                  )}
                  
                  {/* Server URL */}
                  {server.url && !collapsedServers[server.id] && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <strong>URL:</strong> {server.url}
                    </div>
                  )}
                </CardHeader>

                {/* Collapsible Content */}
                {!collapsedServers[server.id] && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <CardContent className="pt-0">
                      <ScrollArea className="max-h-[500px] pr-4">
                        <div className="space-y-3">
                          {getToolsByServer(server.id).length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <Database className="h-6 w-6 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No tools available</p>
                              <p className="text-xs">
                                {server.status === "disconnected" ? "Server is disconnected" : 
                                 server.status === "error" ? "Server connection failed" :
                                 server.status === "connecting" ? "Connecting..." : "No tools found"}
                              </p>
                            </div>
                          ) : (
                            getToolsByServer(server.id).map((tool, toolIndex) => (
                              <div 
                                key={tool.name} 
                                className={`border border-border/30 rounded-lg p-3 bg-muted/20 hover:bg-muted/30 transition-all duration-200 ${getSlideInStaggerClass(toolIndex)}`}
                              >
                                <h4 className="font-semibold text-foreground text-sm">{tool.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tool.description}</p>

                                {tool.inputSchema.properties && (
                                  <div className="mt-3">
                                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parameters:</h5>
                                    <div className="grid grid-cols-1 gap-1">
                                      {Object.entries(tool.inputSchema.properties).map(([key, schema]: [string, any]) => (
                                        <div key={key} className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1">
                                          <span className="font-mono text-foreground">{key}</span>
                                          <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">({schema.type})</span>
                                            {tool.inputSchema.required?.includes(key) && (
                                              <span className="text-destructive font-semibold">*</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </div>
                )}
              </Card>
            ))
          )}
    </div>
  )
}
