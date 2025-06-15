"use client"

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Image as ImageIcon, 
  Download, 
  Copy, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2,
  Edit3,
  Palette
} from 'lucide-react'

interface ImageEditorProps {
  content?: string // Base64 or URL
  title?: string
  isCurrentVersion?: boolean
  currentVersionIndex?: number
  status?: 'streaming' | 'idle'
  onSaveContent?: (content: string, debounce?: boolean) => void
  className?: string
  readOnly?: boolean
}

interface ImageToolbarProps {
  onDownload: () => void
  onCopy: () => void
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
  zoom: number
  disabled?: boolean
}

function ImageToolbar({ 
  onDownload, 
  onCopy, 
  onReset, 
  onZoomIn, 
  onZoomOut, 
  onToggleFullscreen,
  isFullscreen,
  zoom,
  disabled 
}: ImageToolbarProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {Math.round(zoom * 100)}%
        </Badge>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          disabled={disabled || zoom <= 0.25}
          className="h-8 w-8 p-0"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          disabled={disabled || zoom >= 3}
          className="h-8 w-8 p-0"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Reset zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Copy to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Download image"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFullscreen}
          className="h-8 w-8 p-0"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function ImagePlaceholder({ status }: { status?: string }) {
  return (
    <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed border-border">
      <div className="text-center space-y-3">
        <div className="relative">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
          {status === 'streaming' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/60 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {status === 'streaming' ? 'Generating image...' : 'No image available'}
          </p>
          {status === 'streaming' && (
            <div className="flex items-center justify-center gap-1">
              <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce delay-100"></div>
              <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce delay-200"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ImageEditor({ 
  content, 
  title,
  isCurrentVersion, 
  currentVersionIndex, 
  status, 
  onSaveContent,
  className,
  readOnly = false
}: ImageEditorProps) {
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setImageError(false)
  }, [content])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.25))
  }

  const handleZoomReset = () => {
    setZoom(1)
  }

  const handleDownload = () => {
    if (!content) return

    try {
      const link = document.createElement('a')
      link.href = content
      link.download = title ? `${title}.png` : 'image.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  const handleCopy = async () => {
    if (!content) return

    try {
      if (content.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(content)
        const blob = await response.blob()
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ])
      } else {
        // Copy URL to clipboard
        await navigator.clipboard.writeText(content)
      }
    } catch (error) {
      console.error('Failed to copy image:', error)
      // Fallback: copy URL
      try {
        await navigator.clipboard.writeText(content)
      } catch (fallbackError) {
        console.error('Failed to copy URL:', fallbackError)
      }
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageError(false)
  }

  const isValidImage = content && !imageError && (
    content.startsWith('data:image/') || 
    content.startsWith('http://') || 
    content.startsWith('https://') ||
    content.startsWith('/')
  )

  return (
    <div className={cn(
      "flex flex-col h-full border border-border rounded-lg overflow-hidden bg-background",
      isFullscreen && "fixed inset-0 z-50 rounded-none",
      className
    )}>
      <ImageToolbar
        onDownload={handleDownload}
        onCopy={handleCopy}
        onReset={handleZoomReset}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        isFullscreen={isFullscreen}
        zoom={zoom}
        disabled={!isValidImage || status === 'streaming'}
      />
      
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          {status === 'streaming' && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              Generating...
            </Badge>
          )}
          {title && (
            <Badge variant="outline" className="text-xs">
              {title}
            </Badge>
          )}
          {imageError && (
            <Badge variant="destructive" className="text-xs">
              Failed to load
            </Badge>
          )}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:20px_20px] p-4"
      >
        {isValidImage ? (
          <div className="flex items-center justify-center min-h-full">
            <img
              ref={imageRef}
              src={content}
              alt={title || "Generated image"}
              className="max-w-none transition-transform duration-200 rounded shadow-lg"
              style={{ 
                transform: `scale(${zoom})`,
                imageRendering: zoom > 1 ? 'pixelated' : 'auto'
              }}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </div>
        ) : (
          <ImagePlaceholder status={status} />
        )}
      </div>
      
      {isValidImage && (
        <div className="p-3 border-t border-border bg-muted/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Click and drag to pan</span>
              <span>Scroll to zoom</span>
            </div>
            {imageRef.current && (
              <span>
                {imageRef.current.naturalWidth} × {imageRef.current.naturalHeight}px
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageEditor
