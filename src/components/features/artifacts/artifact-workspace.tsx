"use client"

import React, { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar"
import { 
  PanelLeft, 
  PanelRight, 
  Plus, 
  Search, 
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Archive,
  Star,
  Clock
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Artifact } from "./artifact"
import { useArtifact } from "./artifact-provider"
import type { ArtifactKind, ArtifactDocument } from "@/lib/artifacts/types"

interface ArtifactWorkspaceProps {
  className?: string
}

type ViewMode = "grid" | "list" | "canvas"
type FilterMode = "all" | "recent" | "starred" | "archived"

export function ArtifactWorkspace({ className = "" }: ArtifactWorkspaceProps) {
  const { artifacts, createArtifact, updateArtifact, isLoading } = useArtifact()
  
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArtifacts, setSelectedArtifacts] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null)

  // Convert Map to Array for easier filtering/sorting
  const artifactList = Array.from(artifacts.values())

  // Filter and search artifacts
  const filteredArtifacts = artifactList.filter(artifact => {
    const matchesSearch = artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         artifact.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    switch (filterMode) {
      case "recent":
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return matchesSearch && artifact.metadata.updatedAt > oneWeekAgo
      case "starred":
        return matchesSearch && artifact.metadata.tags?.includes("starred")
      case "archived":
        return matchesSearch && artifact.metadata.tags?.includes("archived")
      default:
        return matchesSearch
    }
  })

  // Group artifacts by type
  const artifactsByKind = filteredArtifacts.reduce((acc, artifact) => {
    if (!acc[artifact.kind]) acc[artifact.kind] = []
    acc[artifact.kind].push(artifact)
    return acc
  }, {} as Record<ArtifactKind, ArtifactDocument[]>)

  const handleCreateNew = useCallback(async (kind: ArtifactKind) => {
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
      console.error("Failed to create artifact:", error)
    }
  }, [createArtifact])

  const handleSelectArtifact = useCallback((id: string) => {
    setSelectedArtifacts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  return (
    <div className={`flex h-full bg-background ${className}`}>
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar className="w-64 border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Artifacts</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <div className="p-4 space-y-4">
              {/* Quick Create */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Create New</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["text", "code", "chart", "document"] as ArtifactKind[]).map(kind => (
                    <Button
                      key={kind}
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateNew(kind)}
                      className="text-xs"
                      disabled={isLoading}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {kind}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Filters */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Filters</h3>
                <SidebarMenu>
                  {[
                    { id: "all", label: "All", icon: List },
                    { id: "recent", label: "Recent", icon: Clock },
                    { id: "starred", label: "Starred", icon: Star },
                    { id: "archived", label: "Archived", icon: Archive }
                  ].map(filter => (
                    <SidebarMenuItem key={filter.id}>
                      <SidebarMenuButton
                        onClick={() => setFilterMode(filter.id as FilterMode)}
                        isActive={filterMode === filter.id}
                      >
                        <filter.icon className="h-4 w-4" />
                        <span>{filter.label}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {filter.id === "all" 
                            ? artifactList.length 
                            : filteredArtifacts.length
                          }
                        </Badge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>

              <Separator />

              {/* Types */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Types</h3>
                <SidebarMenu>
                  {Object.entries(artifactsByKind).map(([kind, artifacts]) => (
                    <SidebarMenuItem key={kind}>
                      <SidebarMenuButton>
                        <span className="capitalize">{kind}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {artifacts.length}
                        </Badge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search artifacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-md border p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              {selectedArtifacts.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      Actions ({selectedArtifacts.size})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Archive Selected</DropdownMenuItem>
                    <DropdownMenuItem>Delete Selected</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Export Selected</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {filteredArtifacts.length === 0 ? (
              <EmptyState 
                searchQuery={searchQuery}
                filterMode={filterMode}
                onCreateNew={handleCreateNew}
              />
            ) : (
              <div className="space-y-6">
                {viewMode === "grid" && (
                  <ArtifactGrid
                    artifacts={filteredArtifacts}
                    selectedArtifacts={selectedArtifacts}
                    onSelectArtifact={handleSelectArtifact}
                    onUpdateArtifact={updateArtifact}
                    activeArtifact={activeArtifact}
                    onSetActive={setActiveArtifact}
                  />
                )}

                {viewMode === "list" && (
                  <ArtifactList
                    artifacts={filteredArtifacts}
                    selectedArtifacts={selectedArtifacts}
                    onSelectArtifact={handleSelectArtifact}
                    onUpdateArtifact={updateArtifact}
                  />
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

// Supporting Components

function EmptyState({ 
  searchQuery, 
  filterMode, 
  onCreateNew 
}: {
  searchQuery: string
  filterMode: FilterMode
  onCreateNew: (kind: ArtifactKind) => void
}) {
  return (
    <div className="text-center py-12 space-y-4">
      <div className="text-6xl">📝</div>
      <div>
        <h3 className="text-lg font-semibold">
          {searchQuery 
            ? `No artifacts found for "${searchQuery}"` 
            : `No ${filterMode} artifacts`
          }
        </h3>
        <p className="text-muted-foreground mt-1">
          {searchQuery 
            ? "Try adjusting your search terms or filters" 
            : "Create your first artifact to get started"
          }
        </p>
      </div>
      
      {!searchQuery && (
        <div className="flex items-center justify-center gap-2">
          {(["text", "code", "chart", "document"] as ArtifactKind[]).map(kind => (
            <Button
              key={kind}
              variant="outline"
              onClick={() => onCreateNew(kind)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create {kind}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function ArtifactGrid({
  artifacts,
  selectedArtifacts,
  onSelectArtifact,
  onUpdateArtifact,
  activeArtifact,
  onSetActive
}: {
  artifacts: ArtifactDocument[]
  selectedArtifacts: Set<string>
  onSelectArtifact: (id: string) => void
  onUpdateArtifact: (id: string, description: string) => Promise<void>
  activeArtifact: string | null
  onSetActive: (id: string | null) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artifacts.map(artifact => (
        <Card 
          key={artifact.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedArtifacts.has(artifact.id) ? 'ring-2 ring-primary' : ''
          } ${
            activeArtifact === artifact.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onSetActive(artifact.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium line-clamp-1">
                {artifact.title}
              </CardTitle>
              <input
                type="checkbox"
                checked={selectedArtifacts.has(artifact.id)}
                onChange={() => onSelectArtifact(artifact.id)}
                onClick={(e) => e.stopPropagation()}
                className="rounded"
              />
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
  )
}

function ArtifactList({
  artifacts,
  selectedArtifacts,
  onSelectArtifact,
  onUpdateArtifact
}: {
  artifacts: ArtifactDocument[]
  selectedArtifacts: Set<string>
  onSelectArtifact: (id: string) => void
  onUpdateArtifact: (id: string, description: string) => Promise<void>
}) {
  return (
    <div className="space-y-2">
      {artifacts.map(artifact => (
        <Card key={artifact.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedArtifacts.has(artifact.id)}
                onChange={() => onSelectArtifact(artifact.id)}
                className="rounded"
              />
              
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
  )
}
