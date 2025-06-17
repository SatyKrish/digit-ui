"use client"

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Trash2, Download, Copy, Terminal } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export interface ConsoleOutputContent {
  type: 'stdout' | 'stderr' | 'error' | 'result'
  content: string
  timestamp?: Date
}

export interface ConsoleOutput {
  id: string
  contents: ConsoleOutputContent[]
  status: 'in_progress' | 'completed' | 'error'
  startTime?: Date
  endTime?: Date
}

interface ConsoleProps {
  consoleOutputs: ConsoleOutput[]
  setConsoleOutputs: (outputs: ConsoleOutput[]) => void
  className?: string
  maxHeight?: string
}

function OutputLine({ content, type, timestamp }: ConsoleOutputContent & { timestamp?: Date }) {
  const getTypeColor = (type: ConsoleOutputContent['type']) => {
    switch (type) {
      case 'stdout':
        return 'text-foreground'
      case 'stderr':
        return 'text-orange-500'
      case 'error':
        return 'text-red-500'
      case 'result':
        return 'text-green-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const getTypeIcon = (type: ConsoleOutputContent['type']) => {
    switch (type) {
      case 'stderr':
        return '⚠️'
      case 'error':
        return '❌'
      case 'result':
        return '✅'
      default:
        return ''
    }
  }

  return (
    <div className="flex items-start gap-2 py-1 hover:bg-muted/20 transition-colors">
      {timestamp && (
        <span className="text-xs text-muted-foreground min-w-[4rem] font-mono">
          {timestamp.toLocaleTimeString([], { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </span>
      )}
      <span className="text-xs text-muted-foreground w-4">
        {getTypeIcon(type)}
      </span>
      <pre className={cn(
        "flex-1 text-sm font-mono whitespace-pre-wrap break-words",
        getTypeColor(type)
      )}>
        {content}
      </pre>
    </div>
  )
}

function ConsoleOutputCard({ 
  output, 
  onClear, 
  onDownload, 
  onCopy 
}: { 
  output: ConsoleOutput
  onClear: () => void
  onDownload: () => void
  onCopy: () => void
}) {
  const getStatusColor = (status: ConsoleOutput['status']) => {
    switch (status) {
      case 'in_progress':
        return 'default'
      case 'completed':
        return 'success'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: ConsoleOutput['status']) => {
    switch (status) {
      case 'in_progress':
        return 'Running...'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  const duration = output.startTime && output.endTime 
    ? output.endTime.getTime() - output.startTime.getTime()
    : null

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Execution #{output.id.slice(-8)}</CardTitle>
            <Badge variant={getStatusColor(output.status)} className="text-xs">
              {getStatusText(output.status)}
              {status === 'in_progress' && <span className="ml-1 animate-pulse">•</span>}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {duration && (
              <span className="text-xs text-muted-foreground mr-2">
                {duration}ms
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="h-7 w-7 p-0"
              title="Copy output"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="h-7 w-7 p-0"
              title="Download output"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              title="Clear output"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {output.contents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No output yet...</p>
          </div>
        ) : (
          <ScrollArea className="h-48 w-full rounded border border-border bg-background/50 p-3">
            <div className="space-y-1">
              {output.contents.map((content, index) => (
                <OutputLine
                  key={index}
                  {...content}
                  timestamp={content.timestamp}
                />
              ))}
            </div>
          </ScrollArea>
        )}
        
        {output.startTime && (
          <div className="mt-3 text-xs text-muted-foreground">
            Started: {output.startTime.toLocaleString()}
            {output.endTime && (
              <> • Ended: {output.endTime.toLocaleString()}</>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Console({ 
  consoleOutputs, 
  setConsoleOutputs, 
  className,
  maxHeight = "400px"
}: ConsoleProps) {
  const handleClearOutput = (outputId: string) => {
    setConsoleOutputs(consoleOutputs.filter(output => output.id !== outputId))
  }

  const handleClearAll = () => {
    setConsoleOutputs([])
  }

  const handleCopyOutput = async (output: ConsoleOutput) => {
    const text = output.contents
      .map(content => `[${content.type.toUpperCase()}] ${content.content}`)
      .join('\n')
    
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy output:', error)
    }
  }

  const handleDownloadOutput = (output: ConsoleOutput) => {
    const text = output.contents
      .map(content => `[${content.type.toUpperCase()}] ${content.content}`)
      .join('\n')
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `execution-${output.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (consoleOutputs.length === 0) {
    return null
  }

  return (
    <div className={cn("border-t border-border bg-muted/5", className)}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Console Output</h3>
          <Badge variant="outline" className="text-xs">
            {consoleOutputs.length} execution{consoleOutputs.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {consoleOutputs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>
      
      <ScrollArea style={{ maxHeight }} className="p-4">
        {consoleOutputs.map((output) => (
          <ConsoleOutputCard
            key={output.id}
            output={output}
            onClear={() => handleClearOutput(output.id)}
            onCopy={() => handleCopyOutput(output)}
            onDownload={() => handleDownloadOutput(output)}
          />
        ))}
      </ScrollArea>
    </div>
  )
}

export default Console
