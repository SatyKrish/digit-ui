"use client"

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface Suggestion {
  id: string
  text: string
  type: 'improvement' | 'correction' | 'addition'
  position?: number
  description?: string
  originalText?: string
  suggestedText?: string
}

interface TextEditorProps {
  content: string
  suggestions?: Suggestion[]
  isCurrentVersion?: boolean
  currentVersionIndex?: number
  status?: 'streaming' | 'idle'
  onSaveContent?: (content: string, debounce?: boolean) => void
  placeholder?: string
  className?: string
}

interface ToolbarProps {
  onFormat: (format: string) => void
  disabled?: boolean
}

function Toolbar({ onFormat, disabled }: ToolbarProps) {
  const tools = [
    { icon: Bold, format: 'bold', label: 'Bold' },
    { icon: Italic, format: 'italic', label: 'Italic' },
    { icon: Underline, format: 'underline', label: 'Underline' },
    { icon: Heading1, format: 'h1', label: 'Heading 1' },
    { icon: Heading2, format: 'h2', label: 'Heading 2' },
    { icon: Heading3, format: 'h3', label: 'Heading 3' },
    { icon: List, format: 'ul', label: 'Bullet List' },
    { icon: ListOrdered, format: 'ol', label: 'Numbered List' },
    { icon: Quote, format: 'blockquote', label: 'Quote' },
    { icon: Code, format: 'code', label: 'Code' },
  ]

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/20">
      {tools.map(({ icon: Icon, format, label }) => (
        <Button
          key={format}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onFormat(format)}
          disabled={disabled}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}

function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="w-64 border-l border-border bg-muted/10">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Suggestions</h3>
      </div>
      <ScrollArea className="h-full max-h-96">
        <div className="p-3 space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
            >
              <p className="text-sm text-foreground leading-relaxed">
                {suggestion.description}
              </p>
              {suggestion.originalText && (
                <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                  <span className="font-medium">Original:</span> {suggestion.originalText}
                </div>
              )}
              {suggestion.suggestedText && (
                <div className="mt-1 p-2 bg-primary/10 rounded text-xs">
                  <span className="font-medium">Suggested:</span> {suggestion.suggestedText}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export function Editor({ 
  content, 
  suggestions, 
  isCurrentVersion, 
  currentVersionIndex, 
  status, 
  onSaveContent,
  placeholder = "Start writing...",
  className 
}: TextEditorProps) {
  const [localContent, setLocalContent] = useState(content)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent)
    setIsEditing(true)
    
    // Auto-save with debounce
    if (onSaveContent) {
      onSaveContent(newContent, true)
    }
  }

  const handleFormat = (format: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = localContent.substring(start, end)
    let newText = ''

    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`
        break
      case 'italic':
        newText = `*${selectedText}*`
        break
      case 'underline':
        newText = `<u>${selectedText}</u>`
        break
      case 'h1':
        newText = `# ${selectedText}`
        break
      case 'h2':
        newText = `## ${selectedText}`
        break
      case 'h3':
        newText = `### ${selectedText}`
        break
      case 'ul':
        newText = `- ${selectedText}`
        break
      case 'ol':
        newText = `1. ${selectedText}`
        break
      case 'blockquote':
        newText = `> ${selectedText}`
        break
      case 'code':
        newText = `\`${selectedText}\``
        break
      default:
        newText = selectedText
    }

    const newContent = 
      localContent.substring(0, start) + 
      newText + 
      localContent.substring(end)

    handleContentChange(newContent)

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start + newText.length)
    }, 0)
  }

  const handleSave = () => {
    if (onSaveContent) {
      onSaveContent(localContent, false)
      setIsEditing(false)
    }
  }

  return (
    <div className={cn("flex flex-col h-full border border-border rounded-lg overflow-hidden", className)}>
      <Toolbar onFormat={handleFormat} disabled={status === 'streaming'} />
      
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              {status === 'streaming' && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  Generating...
                </Badge>
              )}
              {isEditing && (
                <Badge variant="outline" className="text-xs">
                  Unsaved
                </Badge>
              )}
            </div>
            {isEditing && (
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            )}
          </div>
          
          <Textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 border-0 rounded-none resize-none focus:ring-0 font-mono text-sm leading-relaxed"
            disabled={status === 'streaming'}
          />
        </div>
        
        {suggestions && suggestions.length > 0 && (
          <SuggestionsPanel suggestions={suggestions} />
        )}
      </div>
    </div>
  )
}

export default Editor
