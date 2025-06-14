// Simple layout hook for chat interface
import { useState, useEffect } from 'react'

interface LayoutDimensions {
  width: number
  height: number
}

export function useResponsiveLayout() {
  const [dimensions, setDimensions] = useState<LayoutDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return dimensions
}

// Simple utility to get CSS classes for layout
export function getLayoutClasses(showArtifacts: boolean) {
  if (!showArtifacts) {
    return {
      chatClasses: 'flex-1',
      artifactClasses: ''
    }
  }

  return {
    chatClasses: 'flex-1 min-w-[55%]',
    artifactClasses: 'w-[45%] flex-shrink-0 max-w-[600px]'
  }
}
