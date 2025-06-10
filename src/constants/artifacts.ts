// Artifact type constants
export const ARTIFACT_TYPES = {
  MARKDOWN: "markdown",
  CODE: "code", 
  MERMAID: "mermaid",
  CHART: "chart",
  TABLE: "table",
  VISUALIZATION: "visualization",
  HEATMAP: "heatmap",
  TREEMAP: "treemap",
  GEOSPATIAL: "geospatial"
} as const

// Chart type constants
export const CHART_TYPES = {
  BAR: "bar",
  LINE: "line", 
  PIE: "pie",
  AREA: "area"
} as const

// Visualization type constants
export const VISUALIZATION_TYPES = {
  KPI: "kpi",
  PROGRESS: "progress",
  CUSTOM: "custom"
} as const

// Map type constants
export const MAP_TYPES = {
  BASIC: "basic",
  SATELLITE: "satellite", 
  DARK: "dark"
} as const

// Regular expressions for artifact extraction
export const ARTIFACT_REGEX = {
  CODE_BLOCK: /```(\w+)?\n([\s\S]*?)```/g,
  JSON_BLOCK: /```json:(\w+)(?::(\w+))?\n([\s\S]*?)```/g
} as const
