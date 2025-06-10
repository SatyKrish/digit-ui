import { useState, useCallback } from 'react'

/**
 * Hook for managing enhanced interactive states with consistent animations
 * and feedback across the application
 */
export function useInteractiveState() {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])
  
  const handleMouseDown = useCallback(() => setIsPressed(true), [])
  const handleMouseUp = useCallback(() => setIsPressed(false), [])
  
  const handleFocus = useCallback(() => setIsFocused(true), [])
  const handleBlur = useCallback(() => setIsFocused(false), [])

  const interactiveProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onFocus: handleFocus,
    onBlur: handleBlur,
  }

  const getInteractiveClasses = (baseClasses: string = '') => {
    const classes = [baseClasses]
    
    if (isHovered) classes.push('hover:shadow-medium hover:-translate-y-0.5')
    if (isPressed) classes.push('active:scale-[0.98]')
    if (isFocused) classes.push('focus-visible:ring-2 focus-visible:ring-ring')
    
    return classes.filter(Boolean).join(' ')
  }

  return {
    isHovered,
    isPressed,
    isFocused,
    interactiveProps,
    getInteractiveClasses,
  }
}

/**
 * Hook for loading states with consistent UI feedback
 */
export function useLoadingState() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const startLoading = useCallback(() => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  const setErrorState = useCallback((errorMessage: string) => {
    setIsLoading(false)
    setError(errorMessage)
    setSuccess(false)
  }, [])

  const setSuccessState = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setSuccess(true)
    
    // Auto-clear success state after 3 seconds
    setTimeout(() => setSuccess(false), 3000)
  }, [])

  const getLoadingClasses = (baseClasses: string = '') => {
    const classes = [baseClasses]
    
    if (isLoading) classes.push('btn-loading animate-pulse')
    if (error) classes.push('shake')
    if (success) classes.push('bounce-gentle')
    
    return classes.filter(Boolean).join(' ')
  }

  return {
    isLoading,
    error,
    success,
    startLoading,
    stopLoading,
    setErrorState,
    setSuccessState,
    getLoadingClasses,
  }
}

/**
 * Hook for managing focus states with enhanced accessibility
 */
export function useFocusManagement() {
  const [focusRingStyle, setFocusRingStyle] = useState<'default' | 'success' | 'warning' | 'error'>('default')

  const setFocusStyle = useCallback((style: 'default' | 'success' | 'warning' | 'error') => {
    setFocusRingStyle(style)
  }, [])

  const getFocusClasses = () => {
    switch (focusRingStyle) {
      case 'success':
        return 'focus-ring-success'
      case 'warning':
        return 'focus-ring-warning'
      case 'error':
        return 'focus-ring-error'
      default:
        return 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    }
  }

  return {
    focusRingStyle,
    setFocusStyle,
    getFocusClasses,
  }
}

/**
 * Hook for managing staggered animations in lists
 */
export function useStaggeredAnimation(itemCount: number, baseDelay: number = 100) {
  const getStaggerDelay = useCallback((index: number) => {
    return Math.min(index * baseDelay, 500) // Cap at 500ms
  }, [baseDelay])

  const getStaggerClasses = useCallback((index: number) => {
    const delay = getStaggerDelay(index)
    const staggerClass = Math.min(Math.floor(delay / 100) + 1, 4) // Max stagger-4
    return `animate-slide-in-up animate-stagger-${staggerClass}`
  }, [getStaggerDelay])

  return {
    getStaggerDelay,
    getStaggerClasses,
  }
}
