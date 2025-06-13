// Custom hook for responsive layout management
import { useState, useEffect } from 'react'

interface LayoutDimensions {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  chatWidth: number
  artifactWidth: number
}

export function useResponsiveLayout(showArtifacts: boolean, isChatMinimized: boolean) {
  const [dimensions, setDimensions] = useState<LayoutDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    chatWidth: 0,
    artifactWidth: 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024

      let chatWidth = width
      let artifactWidth = 0

      if (showArtifacts) {
        if (isMobile) {
          // Mobile: artifacts take full width, chat is hidden/minimized
          artifactWidth = width
          chatWidth = isChatMinimized ? 0 : width
        } else if (isTablet) {
          // Tablet: artifacts take 50% max, chat takes rest
          artifactWidth = Math.min(width * 0.5, 480)
          chatWidth = width - artifactWidth
        } else {
          // Desktop: more flexible sizing
          if (isChatMinimized) {
            chatWidth = 384 // 24rem
            artifactWidth = width - chatWidth
          } else {
            // Artifacts get fixed width, chat gets the rest
            artifactWidth = Math.min(520, width * 0.4) // Max 520px or 40% of width
            chatWidth = width - artifactWidth
          }
        }
      }

      setDimensions({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        chatWidth: Math.max(chatWidth, isMobile ? 0 : 320), // Minimum chat width
        artifactWidth: Math.max(artifactWidth, 0)
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [showArtifacts, isChatMinimized])

  return dimensions
}

// Utility to get responsive class names based on layout state
export function getResponsiveLayoutClasses(
  showArtifacts: boolean,
  isChatMinimized: boolean,
  isMobile: boolean,
  isTablet: boolean
) {
  const chatClasses = []
  const artifactClasses = []

  if (showArtifacts) {
    if (isMobile) {
      // Mobile layout
      if (isChatMinimized) {
        chatClasses.push('hidden') // Hide chat on mobile when minimized
        artifactClasses.push('flex-1')
      } else {
        chatClasses.push('flex-1')
        artifactClasses.push('hidden') // Hide artifacts when chat is active
      }
    } else if (isTablet) {
      // Tablet layout
      if (isChatMinimized) {
        chatClasses.push('w-80 flex-shrink-0')
        artifactClasses.push('flex-1')
      } else {
        chatClasses.push('flex-1 min-w-80')
        artifactClasses.push('w-96 flex-shrink-0 max-w-[50vw]')
      }
    } else {
      // Desktop layout
      if (isChatMinimized) {
        chatClasses.push('w-96 flex-shrink-0')
        artifactClasses.push('flex-1')
      } else {
        chatClasses.push('flex-1 min-w-80')
        artifactClasses.push('w-96 lg:w-[420px] xl:w-[480px] 2xl:w-[520px] flex-shrink-0 max-w-[50vw]')
      }
    }
  } else {
    // No artifacts - chat takes full width
    chatClasses.push('flex-1')
  }

  return {
    chatClasses: chatClasses.join(' '),
    artifactClasses: artifactClasses.join(' ')
  }
}
