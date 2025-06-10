"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mcpClient } from "@/lib/mcp-client"
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">MCP Tools</CardTitle>
        <CardDescription>Available Model Context Protocol tools</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={servers[0]?.id || "database-server"}>
          <TabsList className="w-full">
            {servers.map((server) => (
              <TabsTrigger key={server.id} value={server.id} className="flex items-center gap-2">
                {getServerIcon(server.id)}
                <span>{server.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {servers.map((server) => (
            <TabsContent key={server.id} value={server.id}>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {getToolsByServer(server.id).map((tool) => (
                    <div key={tool.name} className="border rounded-md p-3">
                      <h4 className="font-medium">{tool.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>

                      {tool.inputSchema.properties && (
                        <div className="mt-2">
                          <h5 className="text-xs font-medium text-muted-foreground">Parameters:</h5>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {Object.entries(tool.inputSchema.properties).map(([key, schema]: [string, any]) => (
                              <div key={key} className="text-xs">
                                <span className="font-mono bg-muted px-1 py-0.5 rounded">{key}</span>
                                <span className="text-muted-foreground ml-1">
                                  ({schema.type})
                                  {tool.inputSchema.required?.includes(key) && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </span>
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
