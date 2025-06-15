// Enhanced layout hook for chat interface with adaptive responsive behavior
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

interface LayoutDimensions {
  width: number
  height: number
}

interface LayoutBreakpoints {
  isDesktop: boolean
  isLargeDesktop: boolean
}

export function useResponsiveLayout() {
  const [dimensions, setDimensions] = useState<LayoutDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  const [breakpoints, setBreakpoints] = useState<LayoutBreakpoints>({
    isDesktop: false,
    isLargeDesktop: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setDimensions({ width, height })
      
      setBreakpoints({
        isDesktop: width >= 1200 && width < 1920,
        isLargeDesktop: width >= 1920
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return { dimensions, breakpoints }
}

// Enhanced utility to get adaptive CSS classes for layout - Vercel-inspired approach
export function getAdaptiveLayoutClasses(showArtifacts: boolean, breakpoints?: LayoutBreakpoints, containerWidth?: number) {
  if (!showArtifacts) {
    return {
      chatClasses: 'w-full',
      artifactClasses: ''
    }
  }

  // Container-based approach inspired by Vercel AI SDK patterns
  // Always prioritize preventing horizontal overflow over exact percentages
  const totalMinWidth = 850 // 350px (chat) + 500px (artifacts)
  const currentWidth = containerWidth || 1200
  
  if (currentWidth < totalMinWidth) {
    // Force stack layout on very small screens to prevent horizontal scroll
    return {
      chatClasses: 'w-full min-w-[320px] chat-area',
      artifactClasses: 'w-full min-w-[320px] artifact-panel'
    }
  }
  
  // Calculate optimal chat width: aim for 30-35% but never exceed container constraints
  const targetChatPercent = breakpoints?.isLargeDesktop ? 0.3 : 0.35
  const maxChatWidth = Math.floor(currentWidth * targetChatPercent)
  const chatWidth = Math.max(350, Math.min(maxChatWidth, 500)) // Between 350-500px
  const artifactWidth = currentWidth - chatWidth
  
  return {
    chatClasses: `chat-area`,
    artifactClasses: `artifact-panel`,
    containerStyle: {
      '--chat-width': `${chatWidth}px`,
      '--artifact-width': `${artifactWidth}px`
    } as CSSProperties
  }
}
