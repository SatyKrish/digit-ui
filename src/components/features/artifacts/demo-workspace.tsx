"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArtifactWorkspace } from "./artifact-workspace-vercel"
import { initialArtifactData } from "./artifact-workspace-vercel"
import type { UIArtifact } from "@/lib/artifacts/types"

interface DemoWorkspaceProps {
  className?: string
}

export function DemoArtifactWorkspace({ className = "" }: DemoWorkspaceProps) {
  // Demo state following Vercel patterns
  const [artifact, setArtifact] = useState<UIArtifact>(initialArtifactData)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'streaming'>('idle')

  // Mock handlers for demo
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Demo submit:', input)
  }

  const stop = () => {
    setStatus('idle')
  }

  const reload = () => {
    console.log('Demo reload')
  }

  const append = (message: any) => {
    setMessages(prev => [...prev, message])
  }

  return (
    <div className={`h-full ${className}`}>
      {artifact.isVisible ? (
        <ArtifactWorkspace
          artifact={artifact}
          setArtifact={setArtifact}
          chatId="demo-chat"
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          attachments={[]}
          setAttachments={() => {}}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={undefined}
          append={append}
          isReadonly={false}
          selectedVisibilityType="public"
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>🎨 Vercel Artifacts Workspace</CardTitle>
              <p className="text-muted-foreground">
                Experience the official Vercel AI SDK artifacts patterns
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setArtifact(prev => ({ ...prev, isVisible: true }))}
                className="w-full"
              >
                Open Workspace
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Canvas-like interface with real-time streaming and MCP integration
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
