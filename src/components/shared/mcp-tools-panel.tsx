"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mcpClient } from "@/client/mcp-client"
import { Database, BarChart3, FileText } from "lucide-react"

export function MCPToolsPanel() {
  const [servers, setServers] = useState<any[]>([])
  const [tools, setTools] = useState<any[]>([])

  useEffect(() => {
    // Get MCP servers and tools
    const availableServers = mcpClient.getAvailableServers()
    const allTools = mcpClient.getAllTools()

    setServers(availableServers)
    setTools(allTools)
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

  return (
    <Card className="w-full shadow-elegant hover:shadow-elegant-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Database className="h-4 w-4 text-primary" />
          </div>
          MCP Tools
        </CardTitle>
        <CardDescription>Available Model Context Protocol tools and servers</CardDescription>
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
              </TabsTrigger>
            ))}
          </TabsList>

          {servers.map((server) => (
            <TabsContent key={server.id} value={server.id} className="mt-6">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {getToolsByServer(server.id).map((tool, index) => (
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
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
