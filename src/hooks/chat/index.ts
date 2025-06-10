export { useMessageArtifacts } from './use-message-artifacts';

// Directly export hook functions to avoid module resolution issues
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession, ChatMessage } from '@/types/chat';

/**
 * Enhanced chat session management hook using API calls
 */
export function useChatSessions(user?: { id: string; email: string; name: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef(user);
  
  // Keep user ref updated
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /**
   * Load sessions from API
   */
  const loadSessions = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/sessions?userId=${encodeURIComponent(currentUser.id)}`);
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }
      
      const data = await response.json();
      setSessions(data.sessions || []);
      
      // Set current session to the first one if none is set and no current session exists
      setCurrentSession(prev => {
        if (!prev && data.sessions?.length > 0) {
          return data.sessions[0];
        }
        return prev;
      });
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed since we use ref

  /**
   * Create a new chat session
   */
  const createSession = useCallback(async (title?: string) => {
    const currentUser = userRef.current;
    if (!currentUser) throw new Error('User not available');
    
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          title: title
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      const newSession = data.session;
      
      // Reload sessions to get updated list
      await loadSessions();
      setCurrentSession(newSession);
      
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, [loadSessions]);

  /**
   * Switch to a different session
   */
  const switchToSession = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      return session;
    }
    return null;
  }, [sessions]);

  /**
   * Delete a session (placeholder - to be implemented)
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    console.warn('Delete session not yet implemented');
    return false;
  }, []);

  /**
   * Update session title (placeholder - to be implemented)
   */
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    const currentUser = userRef.current;
    if (!currentUser) return false

    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          title,
          userId: currentUser.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update session title')
      }

      // Reload sessions to get updated list
      await loadSessions()
      return true
    } catch (error) {
      console.error('Error updating session title:', error)
      return false
    }
  }, [loadSessions]);

  /**
   * Clear all chat history (placeholder - to be implemented)
   */
  const clearAllSessions = useCallback(async () => {
    console.warn('Clear all sessions not yet implemented');
  }, []);

  // Initialize sessions on mount when user is available
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user?.id]); // Only depend on user.id instead of the whole user object and loadSessions

  return {
    sessions,
    currentSession,
    isLoading,
    createSession,
    switchToSession,
    deleteSession,
    updateSessionTitle,
    clearAllSessions,
    refreshSessions: loadSessions
  };
}

/**
 * Hook for sending messages and managing chat state using API calls
 */
export function useChatMessages() {
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message via API
   */
  const sendMessage = useCallback(async (
    content: string, 
    userId: string,
    model: string = 'gpt-4'
  ): Promise<ChatMessage | null> => {
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          content,
          model
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Send message error:', err);
      return null;
    } finally {
      setIsTyping(false);
    }
  }, []);

  /**
   * Get messages for a session via API
   */
  const getSessionMessages = useCallback(async (sessionId: string, userId: string): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(`/api/chat/messages?sessionId=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error('Failed to get messages');
      }
      
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }, []);

  return {
    isTyping,
    error,
    sendMessage,
    getSessionMessages,
    clearError: () => setError(null)
  };
}

export { useGroupedChatSessions } from './use-grouped-sessions'
