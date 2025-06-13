import { useEffect, useRef } from 'react'

export function useScrollToBottom(dependency: any, enabled: boolean = true) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled || !scrollRef.current) return

    // Clear any pending scroll
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce scroll to reduce flickering during rapid updates
    timeoutRef.current = setTimeout(() => {
      if (!isUserScrollingRef.current && scrollRef.current) {
        const container = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'auto' // Use auto instead of smooth during streaming
          })
        }
      }
    }, 16) // ~60fps debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [dependency, enabled])

  // Track user scrolling to prevent auto-scroll interruption
  useEffect(() => {
    const container = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50
      isUserScrollingRef.current = !isAtBottom
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return scrollRef
}
