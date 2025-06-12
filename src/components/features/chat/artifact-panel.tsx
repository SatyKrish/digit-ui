"use client"

import { useState } from "react"
import { ArtifactRenderer } from "../artifacts/artifact-renderer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, Pin, PinOff } from "lucide-react"
import type { Artifact, ArtifactPanelProps } from "@/types/artifacts"

export function ArtifactPanel({ artifacts }: ArtifactPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

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
    <div className={`flex-1 flex flex-col bg-gradient-to-b from-background/50 to-muted/5 animate-fade-in transition-all duration-300 ${isExpanded ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Enhanced Header */}
      <div className="border-b border-border/50 p-4 lg:p-6 xl:p-8 2xl:p-10 shadow-soft bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{artifacts.length}</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Artifacts</h2>
              <p className="text-xs text-muted-foreground">
                {artifacts.length} {artifacts.length === 1 ? 'item' : 'items'} generated
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPinned(!isPinned)}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {artifacts.length === 1 ? (
        <ScrollArea className="flex-1 p-4 lg:p-6 xl:p-8 2xl:p-10">
          <div className="space-y-4">
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
            <ArtifactRenderer artifact={artifacts[0]} />
          </div>
        </ScrollArea>
      ) : (
        <Tabs
          value={selectedArtifact.toString()}
          onValueChange={(value) => setSelectedArtifact(Number.parseInt(value))}
          className="flex-1 flex flex-col"
        >
          {/* Enhanced Tab Navigation */}
          <div className="px-4 lg:px-6 xl:px-8 2xl:px-10 pt-4 xl:pt-6 2xl:pt-8">
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

          {/* Tab Content */}
          {artifacts.map((artifact, index) => (
            <TabsContent key={index} value={index.toString()} className="flex-1 mt-0 p-4 lg:p-6 xl:p-8 2xl:p-10">
              <div className="space-y-4">
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
                <ArtifactRenderer artifact={artifact} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
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
