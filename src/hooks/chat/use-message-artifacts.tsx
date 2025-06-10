"use client"

import { useState, useEffect } from "react"
import { extractArtifacts, hasArtifacts, countArtifacts } from "@/services/artifacts/artifact-extractor"
import type { Artifact } from "@/types/artifacts"
import type { Message } from "ai"

/**
 * Hook for extracting and managing artifacts from chat messages
 */
export function useMessageArtifacts(messages: Message[]) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])

  useEffect(() => {
    const lastAssistantMessage = messages
      .filter(m => m.role === "assistant")
      .pop()

    if (lastAssistantMessage) {
      const extractedArtifacts = extractArtifacts(lastAssistantMessage.content)
      setArtifacts(extractedArtifacts)
    } else {
      setArtifacts([])
    }
  }, [messages])

  const getMessageArtifacts = (messageContent: string) => {
    return extractArtifacts(messageContent)
  }

  const messageHasArtifacts = (messageContent: string) => {
    return hasArtifacts(messageContent)
  }

  const getArtifactCount = (messageContent: string) => {
    return countArtifacts(messageContent)
  }

  return {
    artifacts,
    getMessageArtifacts,
    messageHasArtifacts,
    getArtifactCount,
    hasArtifacts: artifacts.length > 0,
  }
}
