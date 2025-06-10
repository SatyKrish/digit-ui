import type { Artifact } from "@/types/artifacts"
import { ARTIFACT_REGEX, ARTIFACT_TYPES, CHART_TYPES, MAP_TYPES } from "@/constants/artifacts"

/**
 * Enhanced function to extract artifacts from message content
 */
export function extractArtifacts(content: string): Artifact[] {
  const artifacts: Artifact[] = []

  // Extract code blocks
  let match
  while ((match = ARTIFACT_REGEX.CODE_BLOCK.exec(content)) !== null) {
    const language = match[1] || "text"
    const code = match[2].trim()

    if (language === "mermaid") {
      artifacts.push({
        type: ARTIFACT_TYPES.MERMAID,
        content: code,
        title: "Diagram",
      })
    } else {
      artifacts.push({
        type: ARTIFACT_TYPES.CODE,
        content: code,
        language: language,
        title: `${language.toUpperCase()} Code`,
      })
    }
  }

  // Extract JSON data blocks for charts, tables, and visualizations
  while ((match = ARTIFACT_REGEX.JSON_BLOCK.exec(content)) !== null) {
    const artifactType = match[1] as "chart" | "table" | "visualization" | "heatmap" | "treemap" | "geospatial"
    const subType = match[2]
    const jsonContent = match[3].trim()

    try {
      const data = JSON.parse(jsonContent)

      switch (artifactType) {
        case ARTIFACT_TYPES.CHART:
          artifacts.push({
            type: ARTIFACT_TYPES.CHART,
            content: jsonContent,
            data: data.data || data,
            chartType: (subType as any) || data.chartType || CHART_TYPES.BAR,
            title: data.title || "Chart",
          })
          break

        case ARTIFACT_TYPES.TABLE:
          artifacts.push({
            type: ARTIFACT_TYPES.TABLE,
            content: jsonContent,
            data: data.data || data,
            title: data.title || "Data Table",
          })
          break

        case ARTIFACT_TYPES.VISUALIZATION:
          artifacts.push({
            type: ARTIFACT_TYPES.VISUALIZATION,
            content: jsonContent,
            data: data.data || data,
            visualizationType: (subType as any) || data.type || "custom",
            title: data.title || "Visualization",
          })
          break

        case ARTIFACT_TYPES.HEATMAP:
          artifacts.push({
            type: ARTIFACT_TYPES.HEATMAP,
            content: jsonContent,
            data: data.data || data,
            title: data.title || "Heatmap",
          })
          break

        case ARTIFACT_TYPES.TREEMAP:
          artifacts.push({
            type: ARTIFACT_TYPES.TREEMAP,
            content: jsonContent,
            data: data.data || data,
            title: data.title || "Treemap",
          })
          break

        case ARTIFACT_TYPES.GEOSPATIAL:
          artifacts.push({
            type: ARTIFACT_TYPES.GEOSPATIAL,
            content: jsonContent,
            data: data.data || data,
            mapType: (subType as any) || data.mapType || MAP_TYPES.BASIC,
            title: data.title || "Geospatial Map",
          })
          break
      }
    } catch (error) {
      console.error("Error parsing JSON artifact:", error)
    }
  }

  return artifacts
}

/**
 * Check if content has artifacts
 */
export function hasArtifacts(content: string): boolean {
  return /```[\s\S]*?```/.test(content)
}

/**
 * Count artifacts in content
 */
export function countArtifacts(content: string): number {
  const matches = content.match(/```[\s\S]*?```/g)
  return matches ? matches.length : 0
}
