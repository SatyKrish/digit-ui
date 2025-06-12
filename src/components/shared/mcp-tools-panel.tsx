"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, BarChart3, FileText, RefreshCw } from "lucide-react"

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

  const loadMCPData = async () => {
    try {
      setIsRefreshing(true)
      
      // Fetch status from server-side API instead of client-side MCP client
      const response = await fetch('/api/mcp')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      setServers(data.servers || [])
      setTools(data.tools || [])
      setLastUpdate(Date.now())
      console.log('MCP data loaded:', {
        servers: data.servers?.length || 0,
        tools: data.tools?.length || 0,
        connected: data.connected || 0
      })
    } catch (error) {
      console.error('Failed to load MCP data:', error)
    } finally {
      setIsRefreshing(false)
    }
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
    <Card className="w-full shadow-elegant hover:shadow-elegant-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">MCP Tools</CardTitle>
              <CardDescription>Available Model Context Protocol tools and servers</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {servers.filter(s => s.status === "connected").length} / {servers.length} Connected
              </div>
              <div className="text-xs text-muted-foreground">
                {tools.length} tools available
              </div>
            </div>
            <div className="flex items-center gap-1">
              {servers.map((server) => (
                <span 
                  key={server.id}
                  className={`h-2 w-2 rounded-full ${getStatusIndicator(server.status)}`} 
                  title={`${server.name}: ${server.status}`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
              title="Refresh MCP status"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue={servers[0]?.id || "database-server"}>
          <TabsList className="w-full bg-muted/50 p-1 shadow-inner-soft">
            {servers.map((server, index) => (
              <TabsTrigger 
                key={server.id} 
                value={server.id} 
                className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 animate-slide-in-up animate-stagger-${Math.min(index + 1, 4)}`}
              >
                {getServerIcon(server.id)}
                <span>{server.name}</span>
                <span className={`h-2 w-2 rounded-full ${getStatusIndicator(server.status)}`} />
              </TabsTrigger>
            ))}
          </TabsList>

          {servers.map((server) => (
            <TabsContent key={server.id} value={server.id} className="mt-6">
              {/* Server Status Header */}
              <div className="mb-4 p-4 bg-muted/20 rounded-lg border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getServerIcon(server.id)}
                    <div>
                      <h3 className="font-semibold text-foreground">{server.name}</h3>
                      <p className="text-sm text-muted-foreground">{server.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge 
                        variant={getStatusColor(server.status)} 
                        className="capitalize text-xs"
                      >
                        {server.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tools:</span>
                      <Badge variant="outline" className="text-xs">
                        {getToolsByServer(server.id).length}
                      </Badge>
                    </div>
                  </div>
                </div>
                {server.error && (
                  <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                    <strong>Error:</strong> {server.error}
                  </div>
                )}
                {server.url && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <strong>URL:</strong> {server.url}
                  </div>
                )}
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {getToolsByServer(server.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tools available</p>
                      <p className="text-xs">
                        {server.status === "disconnected" ? "Server is disconnected" : 
                         server.status === "error" ? "Server connection failed" :
                         server.status === "connecting" ? "Connecting..." : "No tools found"}
                      </p>
                    </div>
                  ) : (
                    getToolsByServer(server.id).map((tool, index) => (
                      <div 
                        key={tool.name} 
                        className={`border border-border/50 rounded-lg p-4 shadow-soft hover:shadow-medium hover:border-border transition-all duration-200 hover:scale-[1.02] animate-slide-in-up animate-stagger-${Math.min(index + 1, 4)}`}
                      >
                        <h4 className="font-semibold text-foreground">{tool.name}</h4>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{tool.description}</p>

                        {tool.inputSchema.properties && (
                          <div className="mt-4">
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parameters:</h5>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(tool.inputSchema.properties).map(([key, schema]: [string, any]) => (
                                <div key={key} className="flex items-center justify-between text-xs bg-muted/30 rounded-md px-3 py-2">
                                  <span className="font-mono bg-background px-2 py-1 rounded text-foreground shadow-inner-soft">{key}</span>
                                  <div className="flex items-center gap-2">
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
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
