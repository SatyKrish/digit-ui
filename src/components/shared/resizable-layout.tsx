"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResizableLayoutProps {
  children: [ReactNode, ReactNode]
  defaultChatWidth?: number
  minChatWidth?: number
  minArtifactWidth?: number
  onResize?: (chatWidth: number) => void
  className?: string
}

export function ResizableLayout({
  children,
  defaultChatWidth = 50,
  minChatWidth = 30,
  minArtifactWidth = 30,
  onResize,
  className
}: ResizableLayoutProps) {
  const [chatWidth, setChatWidth] = useState(defaultChatWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newChatWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Enforce minimum widths
      const clampedWidth = Math.max(
        minChatWidth,
        Math.min(100 - minArtifactWidth, newChatWidth)
      )

      setChatWidth(clampedWidth)
      onResize?.(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, minChatWidth, minArtifactWidth, onResize])

  return (
    <div 
      ref={containerRef}
      className={cn("flex h-full w-full", className)}
    >
      {/* Chat Area */}
      <div 
        style={{ width: `${chatWidth}%` }} 
        className="min-w-0 overflow-hidden"
      >
        {children[0]}
      </div>
      
      {/* Resize Handle */}
      <div
        className={cn(
          "w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors flex-shrink-0 relative group",
          isResizing && "bg-primary/70"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-current opacity-30 group-hover:opacity-70 transition-opacity" />
        
        {/* Hit area */}
        <div className="absolute inset-y-0 -left-2 -right-2" />
      </div>
      
      {/* Artifact Area */}
      <div 
        style={{ width: `${100 - chatWidth}%` }} 
        className="min-w-0 overflow-hidden"
      >
        {children[1]}
      </div>
    </div>
  )
}
