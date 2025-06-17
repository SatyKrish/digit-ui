"use client"

import { useState } from "react"
import { Settings, Database, ArrowLeft, ChevronDown, ChevronRight, User, Bell, Shield, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MCPToolsPanel } from "@/components/shared/mcp-tools-panel"
import { Separator } from "@/components/ui/separator"
import { ClientOnly } from "@/components/shared/client-only"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [selectedMenuItem, setSelectedMenuItem] = useState("mcp")

  const menuItems = [
    {
      id: "mcp",
      label: "Model Context Protocol",
      icon: Database,
      description: "Configure MCP servers and tools"
    },
    {
      id: "general",
      label: "General",
      icon: Settings,
      description: "General application settings"
    },
    {
      id: "account",
      label: "Account",
      icon: User,
      description: "Manage your account settings"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Configure notification preferences"
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      icon: Shield,
      description: "Privacy and security settings"
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      description: "Theme and display preferences"
    }
  ]

  const renderContent = () => {
    switch (selectedMenuItem) {
      case "mcp":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Model Context Protocol (MCP)</h2>
              <p className="text-muted-foreground mb-6">
                Configure and manage MCP servers and tools for enhanced AI capabilities
              </p>
            </div>
            
            {/* Direct MCP Tools Panel - no duplicate wrapper */}
            <MCPToolsPanel />
          </div>
        )
      
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                {menuItems.find(item => item.id === selectedMenuItem)?.label || "Settings"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {menuItems.find(item => item.id === selectedMenuItem)?.description || "Configure your preferences"}
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">This section is coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <ClientOnly>
      <div className="h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex-shrink-0">
          <div className="flex h-14 items-center px-4 lg:px-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Configure your application preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Settings Menu Sidebar */}
          <div className="w-64 border-r bg-card/50 flex-shrink-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMenuItem(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                          selectedMenuItem === item.id
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{item.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </ScrollArea>
          </div>

          {/* Settings Content */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                <div className="mx-auto max-w-4xl">
                  {renderContent()}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </ClientOnly>
  )
}
