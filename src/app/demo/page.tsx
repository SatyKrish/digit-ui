"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Artifact, 
  ArtifactProvider, 
  useArtifact 
} from "@/components/features/artifacts"
import { DemoArtifactWorkspace } from "@/components/features/artifacts/demo-workspace"
import type { ArtifactKind } from "@/lib/artifacts/types"
import { toast } from "sonner"

// Development-only protection
export default function ArtifactsDemo() {
  // Only show in development environment
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">
          Demo page not available in production
        </h1>
      </div>
    )
  }

  return (
    <ArtifactProvider>
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            Chat SDK Artifacts Demo
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience the new artifacts system inspired by the Vercel Chat SDK.
            Create, stream, and manage different types of artifacts with a 
            beautiful workspace interface.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">Real-time Streaming</Badge>
            <Badge variant="secondary">Workspace Interface</Badge>
            <Badge variant="secondary">Multiple Types</Badge>
            <Badge variant="secondary">Chat SDK Patterns</Badge>
            <Badge variant="outline">Development Only</Badge>
          </div>
        </div>

        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workspace">Workspace View</TabsTrigger>
            <TabsTrigger value="individual">Individual Artifacts</TabsTrigger>
            <TabsTrigger value="streaming">Streaming Demo</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🏗️ Artifact Workspace</CardTitle>
                <p className="text-muted-foreground">
                  A complete workspace for managing all your artifacts, similar to 
                  ChatGPT Canvas or Claude Artifacts.
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[70vh] min-h-[600px] xl:h-[75vh] 2xl:h-[80vh] border rounded-lg overflow-hidden">
                  <DemoArtifactWorkspace />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            <IndividualArtifactsDemo />
          </TabsContent>

          <TabsContent value="streaming" className="space-y-4">
            <StreamingDemo />
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <ExamplesSection />
          </TabsContent>
        </Tabs>
      </div>
    </ArtifactProvider>
  )
}

function IndividualArtifactsDemo() {
  const { createArtifact } = useArtifact()
  const [selectedType, setSelectedType] = useState<ArtifactKind>("text")
  const [title, setTitle] = useState("")
  const [initialContent, setInitialContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [currentArtifact, setCurrentArtifact] = useState<any>(null)

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    setIsCreating(true)
    try {
      const artifact = await createArtifact({
        title: title.trim(),
        kind: selectedType,
        initialContent,
        metadata: {
          title: title.trim(),
          description: `Demo ${selectedType} artifact`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      setCurrentArtifact(artifact)
      toast.success(`${selectedType} artifact created!`)
    } catch (error) {
      toast.error("Failed to create artifact")
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  const artifactTypes: { kind: ArtifactKind; label: string; description: string }[] = [
    { kind: "text", label: "Text", description: "Create formatted text content" },
    { kind: "code", label: "Code", description: "Generate code in any language" },
    { kind: "document", label: "Document", description: "Create structured documentation" },
    { kind: "chart", label: "Chart", description: "Generate data visualizations" },
    { kind: "visualization", label: "Visualization", description: "Create interactive visuals" }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Creation Panel */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Create Individual Artifacts</CardTitle>
          <p className="text-muted-foreground">
            Test creating specific artifact types with custom content.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Artifact Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {artifactTypes.map(type => (
                <Button
                  key={type.kind}
                  variant={selectedType === type.kind ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.kind)}
                  className="justify-start text-left"
                >
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={`Enter ${selectedType} title...`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Initial Content (Optional)</Label>
            <Textarea
              id="content"
              placeholder={`Initial ${selectedType} content...`}
              value={initialContent}
              onChange={(e) => setInitialContent(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={isCreating || !title.trim()}
            className="w-full"
          >
            {isCreating ? "Creating..." : `Create ${selectedType}`}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle>👀 Artifact Preview</CardTitle>
          <p className="text-muted-foreground">
            Live preview of your created artifact.
          </p>
        </CardHeader>
        <CardContent>
          {currentArtifact ? (
            <div className="space-y-4">
              <Artifact
                kind={currentArtifact.kind}
                title={currentArtifact.title}
                initialContent={currentArtifact.content}
                mode="view"
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🎨</div>
              <p>Create an artifact to see the preview</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StreamingDemo() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingType, setStreamingType] = useState<ArtifactKind>("code")

  const handleStartStreaming = () => {
    setIsStreaming(true)
    // Simulate streaming completion after 5 seconds
    setTimeout(() => {
      setIsStreaming(false)
    }, 5000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🌊 Streaming Artifacts Demo</CardTitle>
          <p className="text-muted-foreground">
            Watch artifacts generate in real-time with streaming updates.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Type:</Label>
              <select 
                value={streamingType}
                onChange={(e) => setStreamingType(e.target.value as ArtifactKind)}
                className="border rounded px-2 py-1"
              >
                <option value="code">Code</option>
                <option value="text">Text</option>
                <option value="document">Document</option>
                <option value="chart">Chart</option>
              </select>
            </div>
            
            <Button 
              onClick={handleStartStreaming}
              disabled={isStreaming}
            >
              {isStreaming ? "Streaming..." : "Start Streaming Demo"}
            </Button>
          </div>

          {isStreaming && (
            <div className="space-y-4">
              <div className="animate-pulse">
                <Artifact
                  kind={streamingType}
                  title={`Streaming ${streamingType} Demo`}
                  initialContent="// Generating content..."
                  mode="view"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ExamplesSection() {
  const exampleArtifacts = [
    {
      kind: "code" as ArtifactKind,
      title: "React Component",
      description: "A modern React component with TypeScript",
      content: `import React, { useState } from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  onClick, 
  children 
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  
  return (
    <button
      className={\`btn btn-\${variant} \${isPressed ? 'pressed' : ''}\`}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {children}
    </button>
  )
}`
    },
    {
      kind: "document" as ArtifactKind,
      title: "API Documentation",
      description: "Comprehensive API documentation with examples",
      content: `# User Management API

## Overview
This API provides endpoints for managing user accounts, authentication, and profile information.

## Authentication
All endpoints require a valid JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Endpoints

### GET /api/users
Retrieve a list of users.

**Parameters:**
- \`page\` (optional): Page number for pagination
- \`limit\` (optional): Number of users per page

**Response:**
\`\`\`json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
\`\`\``
    },
    {
      kind: "chart" as ArtifactKind,
      title: "Sales Dashboard",
      description: "Interactive sales data visualization",
      content: `{
  "type": "line",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [{
      "label": "Sales Revenue",
      "data": [12000, 19000, 15000, 25000, 22000, 30000],
      "borderColor": "rgb(75, 192, 192)",
      "backgroundColor": "rgba(75, 192, 192, 0.2)"
    }]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "title": {
        "display": true,
        "text": "Monthly Sales Revenue"
      }
    },
    "scales": {
      "y": {
        "beginAtZero": true
      }
    }
  }
}`
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📚 Example Artifacts</CardTitle>
          <p className="text-muted-foreground">
            Explore different types of artifacts and their capabilities.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {exampleArtifacts.map((example, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {example.title}
                    <Badge variant="outline">{example.kind}</Badge>
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {example.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Artifact
                kind={example.kind}
                title={example.title}
                initialContent={example.content}
                mode="view"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
