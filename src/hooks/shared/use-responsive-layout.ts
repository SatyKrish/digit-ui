// Enhanced layout hook for chat interface with adaptive responsive behavior
import { useState, useEffect } from 'react'

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

// Enhanced utility to get adaptive CSS classes for layout
export function getAdaptiveLayoutClasses(showArtifacts: boolean, breakpoints?: LayoutBreakpoints) {
  if (!showArtifacts) {
    return {
      chatClasses: 'w-full',
      artifactClasses: ''
    }
  }

  // Unified layout approach - chat gets fixed 35%, artifact gets remaining space
  const baseClasses = {
    chatClasses: 'flex-[0_0_35%] min-w-[350px] max-w-[35%] chat-area',
    artifactClasses: 'flex-[1_0_auto] min-w-[500px] artifact-panel'
  }

  // Desktop gets slightly more space for artifacts
  if (breakpoints?.isDesktop || breakpoints?.isLargeDesktop) {
    return {
      chatClasses: 'flex-[0_0_30%] min-w-[400px] max-w-[30%] chat-area',
      artifactClasses: 'flex-[1_0_auto] min-w-[500px] artifact-panel'
    }
  }

  return baseClasses
}
