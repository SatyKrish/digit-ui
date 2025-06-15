"use client"

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Square, Copy, Download, Settings, Maximize2, Minimize2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CodeEditorProps {
  content: string
  language?: string
  isCurrentVersion?: boolean
  currentVersionIndex?: number
  status?: 'streaming' | 'idle'
  onSaveContent?: (content: string, debounce?: boolean) => void
  onExecute?: (code: string) => Promise<any>
  placeholder?: string
  className?: string
  readOnly?: boolean
}

interface ToolbarProps {
  language: string
  onLanguageChange: (language: string) => void
  onExecute?: () => void
  onCopy: () => void
  onDownload: () => void
  isExecuting?: boolean
  disabled?: boolean
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Shell' },
]

function Toolbar({ 
  language, 
  onLanguageChange, 
  onExecute, 
  onCopy, 
  onDownload, 
  isExecuting, 
  disabled 
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
      <div className="flex items-center gap-3">
        <Select value={language} onValueChange={onLanguageChange} disabled={disabled}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {onExecute && (
          <Button
            size="sm"
            onClick={onExecute}
            disabled={disabled || isExecuting}
            className="gap-2"
          >
            {isExecuting ? (
              <>
                <Square className="h-4 w-4" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-8 w-8 p-0"
          title="Copy to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="h-8 w-8 p-0"
          title="Download file"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function LineNumbers({ content }: { content: string }) {
  const lineCount = content.split('\n').length
  
  return (
    <div className="flex flex-col text-right pr-3 py-4 text-xs text-muted-foreground bg-muted/10 border-r border-border min-w-[3rem] select-none">
      {Array.from({ length: lineCount }, (_, i) => (
        <div key={i + 1} className="leading-6 h-6">
          {i + 1}
        </div>
      ))}
    </div>
  )
}

export function CodeEditor({ 
  content, 
  language = 'javascript',
  isCurrentVersion, 
  currentVersionIndex, 
  status, 
  onSaveContent,
  onExecute,
  placeholder = "// Start coding...",
  className,
  readOnly = false
}: CodeEditorProps) {
  const [localContent, setLocalContent] = useState(content)
  const [currentLanguage, setCurrentLanguage] = useState(language)
  const [isEditing, setIsEditing] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  useEffect(() => {
    setCurrentLanguage(language)
  }, [language])

  const handleContentChange = (newContent: string) => {
    if (readOnly) return
    
    setLocalContent(newContent)
    setIsEditing(true)
    
    // Auto-save with debounce
    if (onSaveContent) {
      onSaveContent(newContent, true)
    }
  }

  const handleSave = () => {
    if (onSaveContent) {
      onSaveContent(localContent, false)
      setIsEditing(false)
    }
  }

  const handleExecute = async () => {
    if (!onExecute || isExecuting) return
    
    setIsExecuting(true)
    try {
      await onExecute(localContent)
    } catch (error) {
      console.error('Code execution failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localContent)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    const extension = getFileExtension(currentLanguage)
    const filename = `code.${extension}`
    const blob = new Blob([localContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      rust: 'rs',
      go: 'go',
      sql: 'sql',
      html: 'html',
      css: 'css',
      json: 'json',
      yaml: 'yml',
      markdown: 'md',
      bash: 'sh',
    }
    return extensions[lang] || 'txt'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = 
        localContent.substring(0, start) + 
        '  ' + 
        localContent.substring(end)

      handleContentChange(newContent)
      
      // Move cursor after the inserted tab
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2)
      }, 0)
    }
  }

  return (
    <div className={cn(
      "flex flex-col h-full border border-border rounded-lg overflow-hidden bg-background",
      isFullscreen && "fixed inset-0 z-50 rounded-none",
      className
    )}>
      <Toolbar
        language={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        onExecute={onExecute ? handleExecute : undefined}
        onCopy={handleCopy}
        onDownload={handleDownload}
        isExecuting={isExecuting}
        disabled={status === 'streaming' || readOnly}
      />
      
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          {status === 'streaming' && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              Generating...
            </Badge>
          )}
          {isEditing && !readOnly && (
            <Badge variant="outline" className="text-xs">
              Unsaved
            </Badge>
          )}
          {readOnly && (
            <Badge variant="outline" className="text-xs">
              Read-only
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && !readOnly && (
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 min-h-0">
        <LineNumbers content={localContent} />
        
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-full border-0 rounded-none resize-none focus:ring-0 font-mono text-sm leading-6 whitespace-pre"
            disabled={status === 'streaming' || readOnly}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
