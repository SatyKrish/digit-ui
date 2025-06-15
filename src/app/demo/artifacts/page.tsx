"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArtifactWorkspace } from '@/components/features/artifacts/artifact-workspace-vercel'
import { useArtifact } from '@/hooks/use-artifact'
import { DataStreamHandler } from '@/components/features/artifacts/data-stream-handler'
import type { UIArtifact } from '@/lib/artifacts/types'

const sampleArtifacts = {
  text: {
    documentId: 'text-demo',
    content: `# Welcome to the Enhanced Artifacts System

This is a demonstration of the text artifact with **markdown support**.

## Features
- Real-time streaming updates
- MCP integration for AI-powered suggestions
- Version control with diff view
- Collaborative editing capabilities

## Getting Started
Start typing to see the live preview and suggestions.`,
    kind: 'text' as const,
    title: 'Sample Text Document',
    status: 'idle' as const,
    isVisible: true,
    boundingBox: { top: 0, left: 0, width: 600, height: 400 }
  },
  code: {
    documentId: 'code-demo',
    content: `// Sample JavaScript function
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Test the function
console.log('Fibonacci sequence:');
for (let i = 0; i < 10; i++) {
  console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
}

// More complex example with async/await
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}`,
    kind: 'code' as const,
    title: 'JavaScript Demo',
    status: 'idle' as const,
    isVisible: true,
    boundingBox: { top: 0, left: 620, width: 600, height: 400 }
  },
  image: {
    documentId: 'image-demo',
    content: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==',
    kind: 'image' as const,
    title: 'Sample Image',
    status: 'idle' as const,
    isVisible: true,
    boundingBox: { top: 420, left: 0, width: 400, height: 200 }
  },
  sheet: {
    documentId: 'sheet-demo',
    content: `Name,Age,City,Salary
John Doe,30,New York,75000
Jane Smith,25,Los Angeles,65000
Bob Johnson,35,Chicago,80000
Alice Brown,28,Boston,70000
Charlie Wilson,32,Seattle,85000`,
    kind: 'sheet' as const,
    title: 'Employee Data',
    status: 'idle' as const,
    isVisible: true,
    boundingBox: { top: 420, left: 420, width: 600, height: 300 }
  }
}

export default function ArtifactsDemo() {
  const [selectedDemo, setSelectedDemo] = useState<keyof typeof sampleArtifacts>('text')
  const { artifact, setArtifact } = useArtifact()

  const loadDemo = (demoType: keyof typeof sampleArtifacts) => {
    setSelectedDemo(demoType)
    setArtifact(sampleArtifacts[demoType])
  }

  const resetArtifact = () => {
    setArtifact({
      documentId: 'init',
      content: '',
      kind: 'text',
      title: '',
      status: 'idle',
      isVisible: false,
      boundingBox: { top: 0, left: 0, width: 0, height: 0 }
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Enhanced Artifacts System Demo</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Experience the next-generation artifact system with real-time streaming, 
          MCP integration, and collaborative workspace features.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Demo Controls
            <Badge variant="outline">Interactive</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(sampleArtifacts).map((type) => (
                <Button
                  key={type}
                  variant={selectedDemo === type ? "default" : "outline"}
                  onClick={() => loadDemo(type as keyof typeof sampleArtifacts)}
                  className="capitalize"
                >
                  {type} Artifact
                </Button>
              ))}
              <Button variant="ghost" onClick={resetArtifact}>
                Reset
              </Button>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Current: <strong>{artifact.kind}</strong></span>
              <span>Status: <strong>{artifact.status}</strong></span>
              <span>Visible: <strong>{artifact.isVisible ? 'Yes' : 'No'}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="workspace" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workspace">Workspace View</TabsTrigger>
          <TabsTrigger value="streaming">Streaming Demo</TabsTrigger>
          <TabsTrigger value="features">Feature Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Artifact Workspace</CardTitle>
              <p className="text-sm text-muted-foreground">
                Canvas-like interface for managing multiple artifacts with positioning and real-time collaboration.
              </p>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg min-h-[600px]">
                <ArtifactWorkspace
                  artifact={artifact}
                  setArtifact={setArtifact}
                  chatId="demo-chat"
                  input=""
                  setInput={() => {}}
                  handleSubmit={() => {}}
                  status="idle"
                  stop={() => {}}
                  attachments={[]}
                  setAttachments={() => {}}
                  messages={[]}
                  setMessages={() => {}}
                  reload={() => {}}
                  votes={[]}
                  append={() => {}}
                  isReadonly={false}
                  selectedVisibilityType="public"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streaming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Streaming Demo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Demonstrates real-time streaming updates and delta processing.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => {
                  // Simulate streaming updates
                  setArtifact(prev => ({
                    ...prev,
                    status: 'streaming',
                    content: 'Streaming content...'
                  }))
                  
                  setTimeout(() => {
                    setArtifact(prev => ({
                      ...prev,
                      status: 'idle',
                      content: prev.content + '\n\nStreaming complete!'
                    }))
                  }, 2000)
                }}>
                  Simulate Streaming
                </Button>
                
                <div className="p-4 bg-muted/20 rounded-lg">
                  <pre className="text-sm">{JSON.stringify(artifact, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vercel AI SDK Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">Streaming Support</Badge>
                <Badge variant="outline">Real-time Updates</Badge>
                <Badge variant="outline">Delta Processing</Badge>
                <p className="text-sm text-muted-foreground">
                  Full compatibility with Vercel AI SDK patterns for seamless streaming and real-time updates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MCP Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">Tool Calls</Badge>
                <Badge variant="outline">Server Integration</Badge>
                <Badge variant="outline">Fallback Support</Badge>
                <p className="text-sm text-muted-foreground">
                  Model Context Protocol integration for enhanced AI capabilities with graceful fallbacks.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workspace Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">Canvas Interface</Badge>
                <Badge variant="outline">Positioning</Badge>
                <Badge variant="outline">Multi-artifact</Badge>
                <p className="text-sm text-muted-foreground">
                  Advanced workspace with bounding boxes, positioning, and multi-artifact management.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enhanced UI/UX</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">Responsive Design</Badge>
                <Badge variant="outline">Animations</Badge>
                <Badge variant="outline">Accessibility</Badge>
                <p className="text-sm text-muted-foreground">
                  Modern, responsive interface with smooth animations and full accessibility support.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
