"use client"

import { useState } from "react"
import { Copy, Check, Download, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartArtifact } from "./visualizations/chart-artifact"
import { TableArtifact } from "./visualizations/table-artifact"
import { VisualizationArtifact } from "./visualizations/visualization-artifact"
import { HeatmapArtifact } from "./visualizations/heatmap-artifact"
import { TreemapArtifact } from "./visualizations/treemap-artifact"
import { GeospatialArtifact } from "./visualizations/geospatial-artifact"
import { MarkdownRenderer as SharedMarkdownRenderer } from "@/components/shared/markdown-renderer"
import { useTheme } from "next-themes"
import type { Artifact, ArtifactRendererProps } from "@/types/artifacts"

// Mermaid diagram component with dark mode support
function MermaidDiagram({ content, title }: { content: string; title?: string }) {
  const { theme } = useTheme()
  const [diagramId] = useState(`mermaid-${Math.random().toString(36).substr(2, 9)}`)

  return (
    <div className="flex items-center justify-center p-8 bg-muted/30 dark:bg-muted/10 rounded border-2 border-dashed border-muted-foreground/20 dark:border-muted-foreground/30">
      <div className="text-center space-y-2">
        <div className="text-2xl">📊</div>
        <p className="text-sm font-medium text-foreground">Mermaid Diagram</p>
        <p className="text-xs text-muted-foreground">{title || "Interactive diagram would render here"}</p>
        <pre className="text-xs text-left mt-4 p-2 bg-background/50 dark:bg-background/20 rounded max-w-md overflow-auto border border-border/50">
          {content}
        </pre>
      </div>
    </div>
  )
}

// Code syntax highlighter component with dark mode support
function CodeBlock({ content, language }: { content: string; language?: string }) {
  return (
    <pre className="text-sm overflow-x-auto bg-muted/30 dark:bg-muted/10 p-4 rounded border border-border/50">
      <code className={`language-${language || "text"} text-foreground`}>{content}</code>
    </pre>
  )
}

// Markdown renderer component with dark mode support
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <SharedMarkdownRenderer 
      content={content} 
      className="prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground"
    />
  )
}

export function ArtifactRenderer({ artifact }: ArtifactRendererProps) {
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  const copyToClipboard = async () => {
    const textToCopy = artifact.data ? JSON.stringify(artifact.data, null, 2) : artifact.content
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getArtifactTitle = () => {
    if (artifact.title) return artifact.title

    switch (artifact.type) {
      case "code":
        return artifact.language ? artifact.language.toUpperCase() : "CODE"
      case "markdown":
        return "MARKDOWN"
      case "mermaid":
        return "MERMAID DIAGRAM"
      case "chart":
        return "INTERACTIVE CHART"
      case "table":
        return "DATA TABLE"
      case "visualization":
        return "VISUALIZATION"
      case "heatmap":
        return "HEATMAP"
      case "treemap":
        return "TREEMAP"
      case "geospatial":
        return "GEOSPATIAL MAP"
      default:
        return "ARTIFACT"
    }
  }

  const getArtifactIcon = () => {
    switch (artifact.type) {
      case "code":
        return "💻"
      case "markdown":
        return "📝"
      case "mermaid":
        return "📊"
      case "chart":
        return "📈"
      case "table":
        return "📋"
      case "visualization":
        return "🎯"
      case "heatmap":
        return "🔥"
      case "treemap":
        return "📦"
      case "geospatial":
        return "🗺️"
      default:
        return "📄"
    }
  }

  return (
    <div className="bg-card dark:bg-card/50 rounded-lg border border-border shadow-sm dark:shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 dark:bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getArtifactIcon()}</span>
          <span className="text-sm font-medium text-foreground">{getArtifactTitle()}</span>
          {artifact.language && (
            <Badge variant="secondary" className="text-xs">
              {artifact.language}
            </Badge>
          )}
          {artifact.chartType && (
            <Badge variant="secondary" className="text-xs">
              {artifact.chartType}
            </Badge>
          )}
          {artifact.mapType && (
            <Badge variant="secondary" className="text-xs">
              {artifact.mapType}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {(artifact.type === "mermaid" ||
            artifact.type === "chart" ||
            artifact.type === "visualization" ||
            artifact.type === "heatmap" ||
            artifact.type === "treemap" ||
            artifact.type === "geospatial") && (
            <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-muted/50">
              <Maximize2 className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-7 px-2 hover:bg-muted/50">
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-muted/50">
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-4 bg-background/50 dark:bg-background/20">
        {artifact.type === "code" && <CodeBlock content={artifact.content} language={artifact.language} />}

        {artifact.type === "markdown" && <MarkdownRenderer content={artifact.content} />}

        {artifact.type === "mermaid" && <MermaidDiagram content={artifact.content} title={artifact.title} />}

        {artifact.type === "chart" && artifact.data && (
          <ChartArtifact data={artifact.data} chartType={artifact.chartType} title={artifact.title} />
        )}

        {artifact.type === "table" && artifact.data && <TableArtifact data={artifact.data} title={artifact.title} />}

        {artifact.type === "visualization" && artifact.data && (
          <VisualizationArtifact
            type={artifact.visualizationType || "custom"}
            data={artifact.data}
            title={artifact.title}
          />
        )}

        {artifact.type === "heatmap" && artifact.data && (
          <HeatmapArtifact data={artifact.data} title={artifact.title} />
        )}

        {artifact.type === "treemap" && artifact.data && (
          <TreemapArtifact data={artifact.data} title={artifact.title} />
        )}

        {artifact.type === "geospatial" && artifact.data && (
          <GeospatialArtifact data={artifact.data} title={artifact.title} mapType={artifact.mapType} />
        )}
      </div>
    </div>
  )
}
