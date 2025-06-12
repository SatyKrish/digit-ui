import type { Artifact } from "@/types/artifacts"
import { ARTIFACT_REGEX, ARTIFACT_TYPES, CHART_TYPES, MAP_TYPES } from "@/constants/artifacts"

/**
 * Enhanced function to extract artifacts from message content
 * Only extracts substantial code blocks and special JSON artifacts
 */
export function extractArtifacts(content: string): Artifact[] {
  const artifacts: Artifact[] = []

  // Reset regex state
  ARTIFACT_REGEX.CODE_BLOCK.lastIndex = 0
  ARTIFACT_REGEX.JSON_BLOCK.lastIndex = 0

  // Extract code blocks (but be more selective)
  let match
  while ((match = ARTIFACT_REGEX.CODE_BLOCK.exec(content)) !== null) {
    const language = match[1] || "text"
    const code = match[2].trim()

    // Always include mermaid diagrams
    if (language === "mermaid") {
      artifacts.push({
        type: ARTIFACT_TYPES.MERMAID,
        content: code,
        title: "Diagram",
      })
    } else {
      // For other code, only include if it's substantial
      const lineCount = code.split('\n').length
      const isSubstantial = lineCount > 5 || code.length > 200
      
      if (isSubstantial) {
        artifacts.push({
          type: ARTIFACT_TYPES.CODE,
          content: code,
          language: language,
          title: `${language.toUpperCase()} Code`,
        })
      }
    }
  }

  // Reset regex state before second loop
  ARTIFACT_REGEX.JSON_BLOCK.lastIndex = 0

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
 * Only considers content with code blocks or specific JSON artifact blocks as artifacts
 */
export function hasArtifacts(content: string): boolean {
  // Reset regex state
  ARTIFACT_REGEX.JSON_BLOCK.lastIndex = 0
  ARTIFACT_REGEX.CODE_BLOCK.lastIndex = 0
  
  // Check for JSON artifact blocks (charts, tables, visualizations, etc.)
  if (ARTIFACT_REGEX.JSON_BLOCK.test(content)) {
    return true
  }
  
  // Reset after test
  ARTIFACT_REGEX.JSON_BLOCK.lastIndex = 0
  
  // Check for code blocks (but be more selective)
  const codeBlockMatches = content.match(ARTIFACT_REGEX.CODE_BLOCK)
  if (codeBlockMatches && codeBlockMatches.length > 0) {
    // Only consider it an artifact if:
    // 1. It's a substantial code block (more than a few lines)
    // 2. Or it's a specific language that warrants artifact treatment
    return codeBlockMatches.some(match => {
      const fullMatch = match.match(/```(\w+)?\n([\s\S]*?)```/)
      if (!fullMatch) return false
      
      const language = fullMatch[1] || "text"
      const code = fullMatch[2].trim()
      
      // Always treat mermaid diagrams as artifacts
      if (language === "mermaid") return true
      
      // For other code, only treat as artifact if it's substantial
      const lineCount = code.split('\n').length
      return lineCount > 5 || code.length > 200
    })
  }
  
  return false
}

/**
 * Count artifacts in content
 * More accurately counts actual artifacts rather than just any code blocks
 */
export function countArtifacts(content: string): number {
  let count = 0
  
  // Count JSON artifact blocks
  const jsonMatches = content.match(/```json:(\w+)(?::(\w+))?\n([\s\S]*?)```/g)
  if (jsonMatches) {
    count += jsonMatches.length
  }
  
  // Count significant code blocks
  const codeMatches = content.match(/```(\w+)?\n([\s\S]*?)```/g)
  if (codeMatches) {
    count += codeMatches.filter(match => {
      const fullMatch = match.match(/```(\w+)?\n([\s\S]*?)```/)
      if (!fullMatch) return false
      
      const language = fullMatch[1] || "text"
      const code = fullMatch[2].trim()
      
      // Always count mermaid diagrams
      if (language === "mermaid") return true
      
      // For other code, only count if substantial
      const lineCount = code.split('\n').length
      return lineCount > 5 || code.length > 200
    }).length
  }
  
  return count
}
