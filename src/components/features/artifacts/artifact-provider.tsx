"use client"

import React, { useState, useCallback, createContext, useContext } from "react"
import type { 
  ArtifactDocument, 
  ArtifactKind, 
  CreateArtifactOptions 
} from "@/lib/artifacts/types"

interface ArtifactContextType {
  createArtifact: (options: CreateArtifactOptions) => Promise<ArtifactDocument>
  updateArtifact: (id: string, description: string) => Promise<void>
  artifacts: Map<string, ArtifactDocument>
  isLoading: boolean
}

const ArtifactContext = createContext<ArtifactContextType | null>(null)

export function useArtifact() {
  const context = useContext(ArtifactContext)
  if (!context) {
    throw new Error("useArtifact must be used within ArtifactProvider")
  }
  return context
}

interface ArtifactProviderProps {
  children: React.ReactNode
}

export function ArtifactProvider({ children }: ArtifactProviderProps) {
  const [artifacts, setArtifacts] = useState<Map<string, ArtifactDocument>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  const createArtifact = useCallback(async (options: CreateArtifactOptions): Promise<ArtifactDocument> => {
    setIsLoading(true)

    try {
      // Create initial document with sample content based on type
      const sampleContent = getSampleContent(options.kind, options.title)
      
      const document: ArtifactDocument = {
        id: crypto.randomUUID(),
        kind: options.kind,
        title: options.title,
        content: options.initialContent || sampleContent,
        metadata: {
          title: options.title,
          description: options.metadata?.description || `Sample ${options.kind} artifact`,
          language: options.metadata?.language,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...options.metadata
        },
        status: "completed",
        versions: []
      }

      // Add to artifacts map
      setArtifacts(prev => new Map(prev).set(document.id, document))
      
      return document
    } catch (error) {
      console.error("Failed to create artifact:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateArtifact = useCallback(async (id: string, description: string): Promise<void> => {
    setIsLoading(true)

    try {
      const document = artifacts.get(id)
      if (!document) {
        throw new Error(`Artifact with id ${id} not found`)
      }

      // Create new version
      const newVersion = {
        id: crypto.randomUUID(),
        content: document.content,
        metadata: { ...document.metadata },
        createdAt: new Date()
      }

      const updatedDoc = {
        ...document,
        content: document.content + `\n\n// Updated: ${description}`,
        status: "completed" as const,
        versions: [...(document.versions || []), newVersion],
        metadata: {
          ...document.metadata,
          version: (document.metadata.version || 1) + 1,
          updatedAt: new Date()
        }
      }

      setArtifacts(prev => new Map(prev).set(id, updatedDoc))

    } catch (error) {
      console.error("Error updating artifact:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [artifacts])

  const value: ArtifactContextType = {
    createArtifact,
    updateArtifact,
    artifacts,
    isLoading
  }

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  )
}

// Helper function to generate sample content based on artifact type
function getSampleContent(kind: ArtifactKind, title: string): string {
  switch (kind) {
    case "text":
      return `# ${title}

This is a sample text artifact. You can write any content here including:

- Lists and bullet points
- **Bold** and *italic* formatting
- Links and references
- Multiple paragraphs

The content will be rendered with proper formatting and styling.`

    case "code":
      return `// ${title}
function helloWorld() {
  console.log("Hello, World!");
  console.log("This is a sample code artifact");
  
  const message = "Welcome to the artifacts system!";
  return message;
}

// Export the function
export default helloWorld;

// Usage example:
// const greeting = helloWorld();
// console.log(greeting);`

    case "document":
      return `# ${title}

## Overview

This is a sample documentation artifact that demonstrates how structured documents are displayed.

## Features

- **Structured Content**: Organized with headers and sections
- **Rich Formatting**: Support for various markdown elements
- **Code Examples**: Inline \`code\` and code blocks
- **Lists**: Both ordered and unordered lists

## Getting Started

1. First step in the process
2. Second step with more details
3. Final step to complete

## Code Example

\`\`\`javascript
const example = {
  name: "Sample Code",
  description: "Demonstrates code blocks in documentation"
};
\`\`\`

## Conclusion

This document shows how the artifacts system handles rich documentation content.`

    case "chart":
      return `{
  "type": "bar",
  "data": {
    "labels": ["January", "February", "March", "April", "May"],
    "datasets": [{
      "label": "Sample Data",
      "data": [65, 59, 80, 81, 56],
      "backgroundColor": [
        "rgba(255, 99, 132, 0.2)",
        "rgba(54, 162, 235, 0.2)",
        "rgba(255, 205, 86, 0.2)",
        "rgba(75, 192, 192, 0.2)",
        "rgba(153, 102, 255, 0.2)"
      ],
      "borderColor": [
        "rgba(255, 99, 132, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 205, 86, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(153, 102, 255, 1)"
      ],
      "borderWidth": 1
    }]
  },
  "options": {
    "scales": {
      "y": {
        "beginAtZero": true
      }
    },
    "responsive": true,
    "plugins": {
      "title": {
        "display": true,
        "text": "${title}"
      }
    }
  }
}`

    case "visualization":
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        .bar { fill: steelblue; }
        .bar:hover { fill: orange; }
        .axis { font: 10px sans-serif; }
        .axis path, .axis line { 
            fill: none; 
            stroke: #000; 
            shape-rendering: crispEdges; 
        }
    </style>
</head>
<body>
    <h2>${title}</h2>
    <div id="chart"></div>
    
    <script>
        const data = [30, 86, 168, 281, 303, 365];
        
        const margin = {top: 20, right: 30, bottom: 40, left: 40};
        const width = 960 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        
        const x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
            
        const y = d3.scaleLinear()
            .range([height, 0]);
            
        const svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
        x.domain(d3.range(data.length));
        y.domain([0, d3.max(data)]);
        
        svg.selectAll(".bar")
            .data(data)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", (d, i) => x(i))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d))
            .attr("height", d => height - y(d));
    </script>
</body>
</html>`

    default:
      return `Sample content for ${title}`
  }
}
