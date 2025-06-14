"use client"

import { useState, useEffect } from "react"
import { ArtifactRenderer } from "./artifact-renderer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, Pin, PinOff, X } from "lucide-react"
import type { Artifact, ArtifactPanelProps } from "@/types/artifacts"

export function ArtifactPanel({ 
  artifacts, 
  onClose,
  isFullScreen = false,
  onToggleFullScreen
}: ArtifactPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState(0)

  // Handle escape key to exit full-screen mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen && onToggleFullScreen) {
        onToggleFullScreen()
      }
    }

    if (isFullScreen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isFullScreen, onToggleFullScreen])

  if (artifacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/5 via-muted/10 to-muted/5 animate-fade-in">
        <div className="text-center space-y-8 p-16 animate-scale-in max-w-md">
          <div className="relative group">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 rounded-3xl flex items-center justify-center shadow-soft hover:shadow-medium transition-all duration-500 hover:scale-105 group-hover:rotate-3">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-primary/70 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            {/* Floating particles effect */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary/30 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-primary/20 rounded-full animate-pulse delay-300"></div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground animate-stagger-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Ready for Artifacts
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed animate-stagger-2 max-w-sm mx-auto">
              Interactive content like <span className="font-medium text-foreground">charts</span>, <span className="font-medium text-foreground">diagrams</span>, and <span className="font-medium text-foreground">code</span> will appear here when generated
            </p>
            <div className="flex justify-center gap-2 animate-stagger-3">
              <Badge variant="outline" className="text-xs">Charts</Badge>
              <Badge variant="outline" className="text-xs">Tables</Badge>
              <Badge variant="outline" className="text-xs">Code</Badge>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden bg-gradient-to-b from-background/50 to-muted/5 animate-fade-in artifact-panel ${
      isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''
    }`}>
      {/* Enhanced Header */}
      <div className={`flex-shrink-0 border-b border-border/50 shadow-soft bg-background/95 backdrop-blur-sm ${isFullScreen ? 'p-6 lg:p-8' : 'p-4 lg:p-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center shadow-soft">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center border-2 border-background">
                <span className="text-xs font-bold text-primary">{artifacts.length}</span>
              </div>
            </div>
            <div>
              <h2 className={`font-bold text-foreground tracking-tight ${isFullScreen ? 'text-2xl' : 'text-xl'}`}>Interactive Artifacts</h2>
              <p className="text-xs text-muted-foreground font-medium">
                {artifacts.length} {artifacts.length === 1 ? 'visualization' : 'visualizations'} ready
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onToggleFullScreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFullScreen}
                className="h-8 w-8 p-0 hover:bg-muted/50"
                title={isFullScreen ? "Exit full screen" : "Enter full screen"}
              >
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-muted/50"
                title="Close artifacts"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area with proper scrolling support */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {artifacts.length === 1 ? (
          <ScrollArea className="h-full">
            <div className={`space-y-4 ${isFullScreen ? 'p-8 lg:p-12' : 'p-4 lg:p-6'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs font-medium">
                  {artifacts[0].type.charAt(0).toUpperCase() + artifacts[0].type.slice(1)}
                </Badge>
                {artifacts[0].title && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {artifacts[0].title}
                  </span>
                )}
              </div>
              <ArtifactRenderer artifact={artifacts[0]} isFullScreen={isFullScreen} />
            </div>
          </ScrollArea>
        ) : (
          <Tabs
            value={selectedArtifact.toString()}
            onValueChange={(value) => setSelectedArtifact(Number.parseInt(value))}
            className="flex flex-col h-full"
          >
            {/* Enhanced Tab Navigation */}
            <div className={`flex-shrink-0 pt-4 pb-2 ${isFullScreen ? 'px-8 lg:px-12' : 'px-4 lg:px-6'}`}>
              <TabsList className="grid w-full bg-muted/30 p-1 rounded-xl" style={{ gridTemplateColumns: `repeat(${Math.min(artifacts.length, 4)}, 1fr)` }}>
                {artifacts.slice(0, 4).map((artifact, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={index.toString()} 
                    className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                  >
                    <span className="mr-2">{getArtifactIcon(artifact.type)}</span>
                    {artifact.title || `${artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1)} ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>
              {artifacts.length > 4 && (
                <div className="flex gap-1 mt-2 justify-center">
                  {artifacts.slice(4).map((_, index) => (
                    <Button
                      key={index + 4}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedArtifact(index + 4)}
                      className={`h-6 px-2 text-xs ${selectedArtifact === index + 4 ? 'bg-muted' : ''}`}
                    >
                      {index + 5}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab Content with proper scrolling */}
            <div className="flex-1 min-h-0">
              {artifacts.map((artifact, index) => (
                <TabsContent 
                  key={index} 
                  value={index.toString()} 
                  className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <ScrollArea className="flex-1">
                    <div className={`space-y-4 ${isFullScreen ? 'p-8 lg:p-12' : 'p-4 lg:p-6'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1)}
                        </Badge>
                        {artifact.title && (
                          <span className="text-sm font-medium text-muted-foreground">
                            {artifact.title}
                          </span>
                        )}
                      </div>
                      <ArtifactRenderer artifact={artifact} isFullScreen={isFullScreen} />
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}
      </div>
    </div>
  )
}

// Helper function for artifact icons
function getArtifactIcon(type: string) {
  const icons = {
    code: "💻",
    markdown: "📝", 
    mermaid: "📊",
    chart: "📈",
    table: "📋",
    visualization: "🎯",
    heatmap: "🔥",
    treemap: "📦",
    geospatial: "🗺️",
  }
  return icons[type as keyof typeof icons] || "📄"
}
