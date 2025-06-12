export interface Artifact {
  type: "markdown" | "code" | "mermaid" | "chart" | "table" | "visualization" | "heatmap" | "treemap" | "geospatial"
  content: string
  language?: string
  title?: string
  data?: any
  chartType?: "bar" | "line" | "pie" | "area"
  visualizationType?: "kpi" | "progress" | "custom"
  mapType?: "basic" | "satellite" | "dark"
}

export interface ArtifactPanelProps {
  artifacts: Artifact[]
  onClose?: () => void
}

export interface ArtifactRendererProps {
  artifact: Artifact
}

export interface ChartData {
  data: any[]
  chartType: "bar" | "line" | "pie" | "area"
  title?: string
}

export interface TableData {
  data: any[]
  title?: string
}

export interface VisualizationData {
  data: any[]
  visualizationType: "kpi" | "progress" | "custom"
  title?: string
}

export interface HeatmapData {
  data: any[]
  title?: string
}

export interface TreemapData {
  data: any[]
  title?: string
}

export interface GeospatialData {
  data: any[]
  mapType: "basic" | "satellite" | "dark"
  title?: string
}
