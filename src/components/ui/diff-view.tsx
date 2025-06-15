"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface DiffViewProps {
  oldContent: string
  newContent: string
  className?: string
  language?: string
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber?: number
}

function generateDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const diff: DiffLine[] = []

  let oldIndex = 0
  let newIndex = 0

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex]
    const newLine = newLines[newIndex]

    if (oldIndex >= oldLines.length) {
      // Only new lines remaining
      diff.push({
        type: 'added',
        content: newLine,
        lineNumber: newIndex + 1
      })
      newIndex++
    } else if (newIndex >= newLines.length) {
      // Only old lines remaining
      diff.push({
        type: 'removed',
        content: oldLine,
        lineNumber: oldIndex + 1
      })
      oldIndex++
    } else if (oldLine === newLine) {
      // Lines are the same
      diff.push({
        type: 'unchanged',
        content: oldLine,
        lineNumber: newIndex + 1
      })
      oldIndex++
      newIndex++
    } else {
      // Lines are different - for simplicity, mark as removed then added
      diff.push({
        type: 'removed',
        content: oldLine,
        lineNumber: oldIndex + 1
      })
      diff.push({
        type: 'added',
        content: newLine,
        lineNumber: newIndex + 1
      })
      oldIndex++
      newIndex++
    }
  }

  return diff
}

function DiffLineComponent({ line, showLineNumbers = true }: { 
  line: DiffLine
  showLineNumbers?: boolean 
}) {
  const getLineStyles = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
      case 'removed':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
      case 'unchanged':
        return 'bg-background'
      default:
        return 'bg-background'
    }
  }

  const getTextStyles = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'text-green-800 dark:text-green-200'
      case 'removed':
        return 'text-red-800 dark:text-red-200'
      case 'unchanged':
        return 'text-foreground'
      default:
        return 'text-foreground'
    }
  }

  const getPrefix = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      case 'unchanged':
        return ' '
      default:
        return ' '
    }
  }

  return (
    <div className={cn(
      "flex items-start font-mono text-sm leading-6 px-4 py-1",
      getLineStyles(line.type)
    )}>
      <div className="flex items-center gap-4 min-w-0 w-full">
        {showLineNumbers && (
          <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
            {line.lineNumber}
          </span>
        )}
        <span className={cn(
          "w-4 text-center shrink-0 font-bold",
          line.type === 'added' && "text-green-600",
          line.type === 'removed' && "text-red-600",
          line.type === 'unchanged' && "text-muted-foreground"
        )}>
          {getPrefix(line.type)}
        </span>
        <pre className={cn(
          "flex-1 whitespace-pre-wrap break-words min-w-0",
          getTextStyles(line.type)
        )}>
          {line.content}
        </pre>
      </div>
    </div>
  )
}

export function DiffView({ 
  oldContent, 
  newContent, 
  className,
  language 
}: DiffViewProps) {
  const diffLines = generateDiff(oldContent, newContent)
  
  const stats = diffLines.reduce(
    (acc, line) => {
      acc[line.type]++
      return acc
    },
    { added: 0, removed: 0, unchanged: 0 }
  )

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      {/* Diff Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold">Changes</h3>
          {language && (
            <span className="text-xs text-muted-foreground">{language}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            +{stats.added}
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            -{stats.removed}
          </span>
          <span className="text-muted-foreground">
            {stats.unchanged} unchanged
          </span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="max-h-96 overflow-auto">
        {diffLines.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No changes detected</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {diffLines.map((line, index) => (
              <DiffLineComponent
                key={index}
                line={line}
                showLineNumbers={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Diff Footer */}
      {diffLines.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {diffLines.length} total lines
            </span>
            <span>
              {stats.added + stats.removed} changes
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiffView
