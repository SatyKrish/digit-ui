"use client"

import { useState, useEffect } from "react"
import { Copy, Download, Maximize2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChartArtifact } from "./visualizations/chart-artifact"
import { TableArtifact } from "./visualizations/table-artifact"
import { VisualizationArtifact } from "./visualizations/visualization-artifact"
import { HeatmapArtifact } from "./visualizations/heatmap-artifact"
import { TreemapArtifact } from "./visualizations/treemap-artifact"
import { GeospatialArtifact } from "./visualizations/geospatial-artifact"
import { MarkdownRenderer as SharedMarkdownRenderer } from "@/components/shared/markdown-renderer"
import { useTheme } from "next-themes"
import type { Artifact, ArtifactRendererProps } from "@/types/artifacts"

// Enhanced loading component following AI SDK patterns
function ArtifactLoadingState({ type }: { type: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

// Mermaid diagram component with enhanced visuals
function MermaidDiagram({ content, title }: { content: string; title?: string }) {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <ArtifactLoadingState type="mermaid" />
  }

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-xl"></div>
      <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-muted/20 via-muted/10 to-muted/20 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-all duration-300">
        <div className="text-center space-y-4 max-w-lg">
          <div className="relative">
            <div className="text-4xl mb-2 transition-transform group-hover:scale-110">📊</div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/60 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Interactive Mermaid Diagram</p>
            <p className="text-xs text-muted-foreground">{title || "Diagram ready for rendering"}</p>
          </div>
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 max-h-40 overflow-auto">
            <pre className="text-xs text-left font-mono text-foreground">
              {content}
            </pre>
          </div>
          <Badge variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Interactive Content
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Enhanced code block with syntax highlighting preview
function CodeBlock({ content, language }: { content: string; language?: string }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <ArtifactLoadingState type="code" />
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-muted/20 to-muted/5">
      <div className="absolute top-3 right-3 z-10">
        <Badge variant="secondary" className="text-xs font-mono backdrop-blur-sm bg-background/80">
          {language || "text"}
        </Badge>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent"></div>
      <pre className="relative text-sm overflow-x-auto p-6 font-mono leading-[1.6] selection:bg-primary/20">
        <code className={`language-${language || "text"} text-foreground`}>
          {content}
        </code>
      </pre>
      {/* Copy button overlay */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          variant="secondary"
          size="sm"
          className="h-8 w-8 p-0 backdrop-blur-sm bg-background/80 hover:bg-background/90"
          onClick={() => navigator.clipboard.writeText(content)}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// Enhanced markdown renderer
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <SharedMarkdownRenderer 
        content={content} 
        className="prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/50"
      />
    </div>
  )
}

export function ArtifactRenderer({ artifact, isFullScreen = false }: ArtifactRendererProps) {
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [artifact])

  const downloadArtifact = () => {
    const textToDownload = artifact.data ? JSON.stringify(artifact.data, null, 2) : artifact.content
    const blob = new Blob([textToDownload], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title || artifact.type}-${Date.now()}.${artifact.type === 'code' ? artifact.language || 'txt' : 'json'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getArtifactTitle = () => {
    if (artifact.title) return artifact.title

    const titles = {
      code: artifact.language ? `${artifact.language.toUpperCase()} Code` : "Source Code",
      markdown: "Markdown Document",
      mermaid: "Interactive Diagram",
      chart: "Data Visualization",
      table: "Data Table",
      visualization: "Custom Visualization",
      heatmap: "Heat Map",
      treemap: "Tree Map",
      geospatial: "Geographic Map",
    }

    return titles[artifact.type as keyof typeof titles] || "Artifact"
  }

  const getArtifactIcon = () => {
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
    return icons[artifact.type as keyof typeof icons] || "📄"
  }

  const getArtifactDescription = () => {
    const descriptions = {
      code: "Executable source code",
      markdown: "Formatted text document", 
      mermaid: "Interactive diagram",
      chart: "Data visualization",
      table: "Structured data",
      visualization: "Custom visual element",
      heatmap: "Intensity data map",
      treemap: "Hierarchical data view",
      geospatial: "Geographic data map",
    }
    return descriptions[artifact.type as keyof typeof descriptions] || "Generated content"
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4">
          <ArtifactLoadingState type={artifact.type} />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`group bg-card hover:bg-card/80 rounded-xl border border-border hover:border-border/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${isFullScreen ? 'min-h-[80vh]' : ''}`}>
        {/* Enhanced Header */}
        <div className={`flex items-center justify-between border-b border-border/50 bg-muted/20 ${isFullScreen ? 'px-8 py-6' : 'px-6 py-4'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-lg transition-transform group-hover:scale-110">{getArtifactIcon()}</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{getArtifactTitle()}</span>
                {artifact.language && (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {artifact.language}
                  </Badge>
                )}
                {artifact.chartType && (
                  <Badge variant="outline" className="text-xs">
                    {artifact.chartType}
                  </Badge>
                )}
                {artifact.mapType && (
                  <Badge variant="outline" className="text-xs">
                    {artifact.mapType}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{getArtifactDescription()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={downloadArtifact} className="h-8 w-8 p-0 hover:bg-muted/50">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download artifact</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className={`bg-gradient-to-br from-background/50 to-muted/5 ${isFullScreen ? 'p-8 lg:p-12' : 'p-6'}`}>
          {artifact.type === "code" && <CodeBlock content={artifact.content} language={artifact.language} />}

          {artifact.type === "markdown" && <MarkdownRenderer content={artifact.content} />}

          {artifact.type === "mermaid" && <MermaidDiagram content={artifact.content} title={undefined} />}

          {artifact.type === "chart" && artifact.data && (
            <div className="animate-fade-in">
              <ChartArtifact data={artifact.data} chartType={artifact.chartType} title={undefined} />
            </div>
          )}

          {artifact.type === "table" && artifact.data && (
            <div className="animate-fade-in">
              <TableArtifact data={artifact.data} title={undefined} />
            </div>
          )}

          {artifact.type === "visualization" && artifact.data && (
            <div className="animate-fade-in">
              <VisualizationArtifact
                type={artifact.visualizationType || "custom"}
                data={artifact.data}
                title={undefined}
              />
            </div>
          )}

          {artifact.type === "heatmap" && artifact.data && (
            <div className="animate-fade-in">
              <HeatmapArtifact data={artifact.data} title={undefined} />
            </div>
          )}

          {artifact.type === "treemap" && artifact.data && (
            <div className="animate-fade-in">
              <TreemapArtifact data={artifact.data} title={undefined} />
            </div>
          )}

          {artifact.type === "geospatial" && artifact.data && (
            <div className="animate-fade-in">
              <GeospatialArtifact data={artifact.data} title={undefined} mapType={artifact.mapType} />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
