import { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, ChatSession } from '@/types/chat'; // Chat is the new type, ChatSession is for backward compatibility
import { sessionCache } from '@/services/chat/session-cache';
import { toast } from 'sonner';

/**
 * Enhanced chat management hook with better error handling
 * Focuses on chat list management while letting useChat handle messages
 * TODO: Gradually migrate from "sessions" terminology to "chats"
 */
export function useChatSessions(user?: { id: string; email: string; name: string }) {
  const [sessions, setSessions] = useState<Chat[]>([]);
  const [currentSession, setCurrentSession] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef(user);
  
  // Keep user ref updated
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /**
   * Load sessions from API with enhanced error handling
   */
  const loadSessions = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    // Check cache first
    const cachedSessions = sessionCache.get(currentUser.id);
    if (cachedSessions) {
      setSessions(cachedSessions);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(errorMessage);
      console.error('Error loading chat sessions:', err);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new chat session (optimistic update)
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
      
      // Update cache and local state
      sessionCache.addSession(currentUser.id, newSession);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, []);

  /**
   * Switch to a different session (simplified for AI SDK)
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
   * Delete a session
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    const currentUser = userRef.current;
    if (!currentUser) return false;

    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userId: currentUser.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      // Update local state and cache
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      sessionCache.removeSession(currentUser.id, sessionId);
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }

      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }, [currentSession]);

  /**
   * Update session title
   */
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    const currentUser = userRef.current;
    if (!currentUser) return false;

    try {
      // Optimistically update local state
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
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        sessionCache.clear(currentUser.id);
        await loadSessions();
        throw new Error('Failed to update session title');
      }

      return true;
    } catch (error) {
      console.error('Error updating session title:', error);
      return false;
    }
  }, [loadSessions]);

  /**
   * Clear all chat history
   */
  const clearAllSessions = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    try {
      const response = await fetch('/api/chat/sessions/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear sessions');
      }

      // Clear local state and cache
      setSessions([]);
      setCurrentSession(null);
      sessionCache.clear(currentUser.id);
    } catch (error) {
      console.error('Error clearing sessions:', error);
    }
  }, []);

  // Initialize sessions on mount when user is available
  useEffect(() => {
    let isMounted = true;
    if (user && isMounted) {
      loadSessions();
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id, loadSessions]);

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
