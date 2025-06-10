"use client"

import { useState } from "react"
import { ArtifactRenderer } from "@/components/artifact-renderer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Artifact {
  type: "markdown" | "code" | "mermaid" | "chart"
  content: string
  language?: string
  title?: string
}

interface ArtifactPanelProps {
  artifacts: Artifact[]
}

export function ArtifactPanel({ artifacts }: ArtifactPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState(0)

  if (artifacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">No Artifacts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Artifacts like code, diagrams, and charts will appear here
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-muted/10">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold text-foreground">Artifacts</h2>
      </div>

      {artifacts.length === 1 ? (
        <ScrollArea className="flex-1 p-4">
          <ArtifactRenderer artifact={artifacts[0]} />
        </ScrollArea>
      ) : (
        <Tabs
          value={selectedArtifact.toString()}
          onValueChange={(value) => setSelectedArtifact(Number.parseInt(value))}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            {artifacts.map((artifact, index) => (
              <TabsTrigger key={index} value={index.toString()} className="text-xs">
                {artifact.title || `${artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1)} ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>

          {artifacts.map((artifact, index) => (
            <TabsContent key={index} value={index.toString()} className="flex-1 mt-0">
              <ScrollArea className="h-full p-4">
                <ArtifactRenderer artifact={artifact} />
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
