import { useEffect, useState, useRef } from 'react'

interface Message {
  content: string
  [key: string]: any
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

export function useStreamingOptimization(isLoading: boolean, messages: any[]) {
  // During streaming, slightly delay updates to reduce flickering
  const debouncedLoading = useDebouncedValue(isLoading, isLoading ? 0 : 100)
  
  // Detect if we're actively streaming (new content being added)
  const lastMessageLength = useRef<number>(0)
  const [isActivelyStreaming, setIsActivelyStreaming] = useState(false)

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const currentLength = lastMessage?.content?.length || 0
      
      if (isLoading && currentLength > lastMessageLength.current) {
        setIsActivelyStreaming(true)
        lastMessageLength.current = currentLength
        
        // Reset streaming state after a brief delay
        const timeout = setTimeout(() => {
          setIsActivelyStreaming(false)
        }, 150)
        
        return () => clearTimeout(timeout)
      } else if (!isLoading) {
        setIsActivelyStreaming(false)
        lastMessageLength.current = 0
      }
    }
  }, [messages, isLoading])

  return {
    optimizedLoading: debouncedLoading,
    isActivelyStreaming
  }
}
