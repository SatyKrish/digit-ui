"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Development-only protection
export default function Demo() {
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
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Enhanced Artifacts Demo
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the next generation of interactive content with our Vercel-inspired artifacts system.
          Create, edit, and interact with various types of content in real-time.
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">Real-time streaming</Badge>
          <Badge variant="secondary">Version control</Badge>
          <Badge variant="secondary">Collaborative editing</Badge>
          <Badge variant="secondary">MCP integration</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artifact Workspace</CardTitle>
          <p className="text-sm text-muted-foreground">
            Interactive workspace for creating and managing artifacts with streaming support
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Demo content will be available soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
