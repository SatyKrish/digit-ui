"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { extractArtifacts } from '@/services/artifacts/artifact-extractor'
import type { UIArtifact } from '@/lib/artifacts/types'
import type { Artifact } from '@/services/artifacts/types'
import type { Message } from 'ai'

interface EnhancedArtifactContextValue {
  // Current artifacts from both systems
  legacyArtifacts: Artifact[]
  vercelArtifacts: UIArtifact[]
  
  // Active artifact management
  activeArtifact: UIArtifact | null
  setActiveArtifact: (artifact: UIArtifact | null) => void
  
  // Processing functions
  processMessageForArtifacts: (message: Message) => void
  clearArtifacts: () => void
  
  // Streaming support
  isStreaming: boolean
  setIsStreaming: (streaming: boolean) => void
  
  // Integration mode
  integrationMode: 'legacy' | 'vercel' | 'hybrid'
  setIntegrationMode: (mode: 'legacy' | 'vercel' | 'hybrid') => void
}

const EnhancedArtifactContext = createContext<EnhancedArtifactContextValue | null>(null)

interface EnhancedArtifactProviderProps {
  children: React.ReactNode
  initialMode?: 'legacy' | 'vercel' | 'hybrid'
}

export function EnhancedArtifactProvider({ 
  children, 
  initialMode = 'hybrid' 
}: EnhancedArtifactProviderProps) {
  const [legacyArtifacts, setLegacyArtifacts] = useState<Artifact[]>([])
  const [vercelArtifacts, setVercelArtifacts] = useState<UIArtifact[]>([])
  const [activeArtifact, setActiveArtifact] = useState<UIArtifact | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [integrationMode, setIntegrationMode] = useState<'legacy' | 'vercel' | 'hybrid'>(initialMode)

  // Process messages to extract artifacts
  const processMessageForArtifacts = useCallback((message: Message) => {
    if (message.role !== 'assistant') return

    const content = message.content || ''
    
    // Extract using legacy system
    const extractedArtifacts = extractArtifacts(content)
    
    if (extractedArtifacts.length > 0) {
      setLegacyArtifacts(extractedArtifacts)
      
      // Convert to Vercel format if in hybrid or vercel mode
      if (integrationMode === 'vercel' || integrationMode === 'hybrid') {
        const vercelArtifacts = extractedArtifacts.map((artifact, index) => 
          convertLegacyToVercel(artifact, message.id, index)
        )
        setVercelArtifacts(vercelArtifacts)
        
        // Set first artifact as active
        if (vercelArtifacts.length > 0) {
          setActiveArtifact(vercelArtifacts[0])
        }
      }
    }
  }, [integrationMode])

  // Clear all artifacts
  const clearArtifacts = useCallback(() => {
    setLegacyArtifacts([])
    setVercelArtifacts([])
    setActiveArtifact(null)
  }, [])

  // Auto-clear when switching modes
  useEffect(() => {
    if (integrationMode === 'legacy') {
      setVercelArtifacts([])
      setActiveArtifact(null)
    } else if (integrationMode === 'vercel') {
      setLegacyArtifacts([])
    }
  }, [integrationMode])

  const value: EnhancedArtifactContextValue = {
    legacyArtifacts,
    vercelArtifacts,
    activeArtifact,
    setActiveArtifact,
    processMessageForArtifacts,
    clearArtifacts,
    isStreaming,
    setIsStreaming,
    integrationMode,
    setIntegrationMode,
  }

  return (
    <EnhancedArtifactContext.Provider value={value}>
      {children}
    </EnhancedArtifactContext.Provider>
  )
}

export function useEnhancedArtifacts() {
  const context = useContext(EnhancedArtifactContext)
  if (!context) {
    throw new Error('useEnhancedArtifacts must be used within an EnhancedArtifactProvider')
  }
  return context
}

/**
 * Convert legacy artifact to Vercel UIArtifact format
 */
function convertLegacyToVercel(
  legacyArtifact: Artifact, 
  messageId: string, 
  index: number
): UIArtifact {
  return {
    documentId: `${messageId}-artifact-${index}`,
    content: legacyArtifact.content,
    kind: mapLegacyTypeToVercelKind(legacyArtifact.type),
    title: legacyArtifact.title || `${legacyArtifact.type} Artifact`,
    status: 'completed',
    isVisible: true,
    boundingBox: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    },
  }
}

/**
 * Map legacy artifact types to Vercel artifact kinds
 */
function mapLegacyTypeToVercelKind(legacyType: string): UIArtifact['kind'] {
  switch (legacyType) {
    case 'code':
      return 'code'
    case 'chart':
    case 'visualization':
    case 'table':
    case 'heatmap':
    case 'treemap':
    case 'geospatial':
      return 'chart'
    case 'mermaid':
      return 'visualization'
    case 'image':
      return 'image'
    case 'sheet':
      return 'sheet'
    case 'text':
    default:
      return 'text'
  }
}
