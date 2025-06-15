import { useState, useEffect } from 'react'
import { getWelcomeMessage } from '@/services/welcome/welcome-messages'

interface User {
  name: string
  email: string
}

interface WelcomeMessageData {
  title: string
  subtitle: string
  context: string
  tone: string
  isLoading: boolean
}

/**
 * React hook for managing welcome messages
 * Provides intelligent, personalized welcome messages with caching
 */
export function useWelcomeMessage(user: User): WelcomeMessageData {
  const [messageData, setMessageData] = useState<WelcomeMessageData>({
    title: `Welcome, ${user.name.split(' ')[0]}!`,
    subtitle: 'How can I help you today?',
    context: 'default',
    tone: 'professional',
    isLoading: true
  })

  useEffect(() => {
    if (!user?.name || !user?.email) {
      setMessageData(prev => ({ ...prev, isLoading: false }))
      return
    }

    // Simulate minimal processing time for smooth UX
    const timer = setTimeout(() => {
      try {
        const welcomeMessage = getWelcomeMessage(user)
        setMessageData({
          ...welcomeMessage,
          isLoading: false
        })
      } catch (error) {
        console.error('Error generating welcome message:', error)
        // Fall back to default message
        setMessageData({
          title: `Welcome, ${user.name.split(' ')[0]}!`,
          subtitle: 'How can I help you today?',
          context: 'default',
          tone: 'professional',
          isLoading: false
        })
      }
    }, 50) // Minimal delay for smooth transition

    return () => clearTimeout(timer)
  }, [user?.name, user?.email])

  return messageData
}

/**
 * Hook variant that refreshes message periodically (useful for long sessions)
 */
export function useRefreshingWelcomeMessage(
  user: User, 
  refreshIntervalMs: number = 300000 // 5 minutes default
): WelcomeMessageData {
  const [messageData, setMessageData] = useState<WelcomeMessageData>({
    title: `Welcome, ${user.name.split(' ')[0]}!`,
    subtitle: 'How can I help you today?',
    context: 'default',
    tone: 'professional',
    isLoading: true
  })

  useEffect(() => {
    if (!user?.name || !user?.email) {
      setMessageData(prev => ({ ...prev, isLoading: false }))
      return
    }

    const updateMessage = () => {
      try {
        const welcomeMessage = getWelcomeMessage(user)
        setMessageData({
          ...welcomeMessage,
          isLoading: false
        })
      } catch (error) {
        console.error('Error generating welcome message:', error)
        setMessageData({
          title: `Welcome, ${user.name.split(' ')[0]}!`,
          subtitle: 'How can I help you today?',
          context: 'default',
          tone: 'professional',
          isLoading: false
        })
      }
    }

    // Initial load
    updateMessage()

    // Set up refresh interval
    const interval = setInterval(updateMessage, refreshIntervalMs)

    return () => clearInterval(interval)
  }, [user?.name, user?.email, refreshIntervalMs])

  return messageData
}
