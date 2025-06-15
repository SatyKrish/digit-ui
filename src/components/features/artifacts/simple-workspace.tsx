"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Grid3X3, List } from "lucide-react"
import { Artifact } from "./artifact"
import { useArtifact } from "./artifact-provider"
import type { ArtifactKind, ArtifactDocument } from "@/lib/artifacts/types"

interface ArtifactWorkspaceProps {
  className?: string
}

export function ArtifactWorkspace({ className = "" }: ArtifactWorkspaceProps) {
  const { artifacts, createArtifact, updateArtifact, isLoading } = useArtifact()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null)

  // Convert Map to Array
  const artifactList = Array.from(artifacts.values())

  const handleCreateNew = async (kind: ArtifactKind) => {
    try {
      const artifact = await createArtifact({
        title: `New ${kind.charAt(0).toUpperCase() + kind.slice(1)}`,
        kind,
        metadata: {
          title: `New ${kind}`,
          description: `Generated ${kind} artifact`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      setActiveArtifact(artifact.id)
    } catch (error) {
      console.error('Failed to create artifact:', error)
    }
  }

  const artifactTypes: ArtifactKind[] = ["text", "code", "document", "chart", "visualization"]

  if (artifactList.length === 0) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>🚀 Start Creating</CardTitle>
              <p className="text-muted-foreground">
                Create your first artifact to get started
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {artifactTypes.map((kind) => (
                  <Button
                    key={kind}
                    variant="outline"
                    onClick={() => handleCreateNew(kind)}
                    disabled={isLoading}
                    className="h-20 flex flex-col gap-2"
                  >
                    <span className="text-2xl">
                      {kind === "text" && "📝"}
                      {kind === "code" && "💻"}
                      {kind === "document" && "📄"}
                      {kind === "chart" && "📊"}
                      {kind === "visualization" && "🎨"}
                    </span>
                    <span className="text-sm capitalize">{kind}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Artifacts</h2>
            <p className="text-muted-foreground">
              {artifactList.length} artifact{artifactList.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            
            <Button onClick={() => handleCreateNew("text")} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artifactList.map(artifact => (
              <Card 
                key={artifact.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeArtifact === artifact.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveArtifact(artifact.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium line-clamp-1">
                      {artifact.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {artifact.kind}
                    </Badge>
                    <Badge 
                      variant={artifact.status === "completed" ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {artifact.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {artifact.content.slice(0, 100)}...
                  </p>
                  
                  <div className="text-xs text-muted-foreground">
                    Updated {artifact.metadata.updatedAt.toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {artifactList.map(artifact => (
              <Card key={artifact.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium">{artifact.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {artifact.kind}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Updated {artifact.metadata.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={artifact.status === "completed" ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {artifact.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Active Artifact Viewer */}
      {activeArtifact && (
        <div className="border-t p-4 max-h-96">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Active Artifact</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveArtifact(null)}
            >
              Close
            </Button>
          </div>
          
          {(() => {
            const artifact = artifacts.get(activeArtifact)
            if (!artifact) return null
            
            return (
              <Artifact
                kind={artifact.kind}
                title={artifact.title}
                initialContent={artifact.content}
                mode="view"
                onUpdateArtifact={async (id, description) => {
                  await updateArtifact(id, description)
                }}
              />
            )
          })()}
        </div>
      )}
    </div>
  )
}
