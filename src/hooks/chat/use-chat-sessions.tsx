import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession, ChatMessage } from '@/types/chat';
import { sessionCache } from '@/services/chat/session-cache';

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
   * Load sessions from API (only when needed, with caching)
   */
  const loadSessions = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    // Check cache first
    const cachedSessions = sessionCache.get(currentUser.id);
    if (cachedSessions) {
      setSessions(cachedSessions);
      // Don't automatically set current session from cache either
      // This ensures welcome screen is shown after login
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/sessions?userId=${encodeURIComponent(currentUser.id)}`);
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }
      
      const data = await response.json();
      const fetchedSessions = data.sessions || [];
      
      // Update cache
      sessionCache.set(currentUser.id, fetchedSessions);
      
      setSessions(fetchedSessions);
      
      // Don't automatically set a current session after login
      // Let the user explicitly choose or start a new chat to show welcome screen
      // setCurrentSession will only be called when user explicitly selects a session
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed since we use ref

  /**
   * Create a new chat session (optimistically with cache update)
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
      
      // Update cache
      sessionCache.addSession(currentUser.id, newSession);
      
      // Optimistically update sessions list without refetching all
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, []); // Removed dependency on loadSessions

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
   * Update session title (optimistically with cache update)
   */
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    const currentUser = userRef.current;
    if (!currentUser) return false

    try {
      // Optimistically update the title in local state and cache
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, title }
          : session
      ));
      sessionCache.updateSession(currentUser.id, sessionId, { title });

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
        // Revert the optimistic update on failure
        sessionCache.clear(currentUser.id); // Clear cache to force reload
        await loadSessions();
        throw new Error('Failed to update session title')
      }

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

  // Initialize sessions on mount when user is available (only once)
  useEffect(() => {
    let isMounted = true;
    if (user && isMounted) {
      loadSessions();
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id, loadSessions]); // Only load once when user changes

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
   * Send a message via API (optimistic update)
   */
  const sendMessage = useCallback(async (
    content: string, 
    userId: string,
    model: string = 'gpt-4'
  ): Promise<{ userMessage?: ChatMessage; assistantMessage?: ChatMessage; message?: ChatMessage } | null> => {
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
      return data;
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
   * Get messages for a session via API (cache locally)
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

/**
 * Hook for managing chat UI state
 */
export function useChatUI() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [artifactsPanelOpen, setArtifactsPanelOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleArtifactsPanel = useCallback(() => {
    setArtifactsPanelOpen(prev => !prev);
  }, []);

  const selectArtifact = useCallback((artifactId: string | null) => {
    setSelectedArtifact(artifactId);
    if (artifactId && !artifactsPanelOpen) {
      setArtifactsPanelOpen(true);
    }
  }, [artifactsPanelOpen]);

  return {
    sidebarOpen,
    artifactsPanelOpen,
    selectedArtifact,
    setSidebarOpen,
    setArtifactsPanelOpen,
    setSelectedArtifact,
    toggleSidebar,
    toggleArtifactsPanel,
    selectArtifact
  };
}
