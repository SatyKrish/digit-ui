// Temporary legacy artifact types for extractor service
// TODO: Migrate to Vercel artifact types

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

export interface ChartData {
  data: any[]
  chartType: "bar" | "line" | "pie" | "area"
  title?: string
}

export interface TableData {
  headers: string[]
  rows: (string | number)[][]
  title?: string
}

export interface VisualizationData {
  type: "kpi" | "progress" | "custom"
  data: any
  title?: string
}

export interface HeatmapData {
  data: number[][]
  labels?: { x: string[], y: string[] }
  title?: string
}

export interface TreemapData {
  data: Array<{ name: string; value: number; children?: TreemapData["data"] }>
  title?: string
}

export interface GeospatialData {
  type: "points" | "regions" | "routes"
  data: any[]
  mapType?: "basic" | "satellite" | "dark"
  title?: string
}
