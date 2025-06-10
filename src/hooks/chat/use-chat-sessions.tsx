import { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage } from '@/types/chat';
import { chatService } from '@/services/chat';

/**
 * Enhanced chat session management hook
 */
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load sessions from storage and service
   */
  const loadSessions = useCallback(() => {
    setIsLoading(true);
    try {
      chatService.loadFromStorage();
      const allSessions = chatService.getAllSessions();
      const current = chatService.getCurrentSession();
      
      setSessions(allSessions);
      setCurrentSession(current);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new chat session
   */
  const createSession = useCallback((title?: string) => {
    const newSession = chatService.createSession(title);
    setSessions(chatService.getAllSessions());
    setCurrentSession(newSession);
    chatService.saveToStorage();
    return newSession;
  }, []);

  /**
   * Switch to a different session
   */
  const switchToSession = useCallback((sessionId: string) => {
    const session = chatService.switchToSession(sessionId);
    if (session) {
      setCurrentSession(session);
      return session;
    }
    return null;
  }, []);

  /**
   * Delete a session
   */
  const deleteSession = useCallback((sessionId: string) => {
    const success = chatService.deleteSession(sessionId);
    if (success) {
      setSessions(chatService.getAllSessions());
      setCurrentSession(chatService.getCurrentSession());
      chatService.saveToStorage();
    }
    return success;
  }, []);

  /**
   * Update session title
   */
  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    const success = chatService.updateSessionTitle(sessionId, title);
    if (success) {
      setSessions(chatService.getAllSessions());
      if (currentSession?.id === sessionId) {
        setCurrentSession(chatService.getCurrentSession());
      }
      chatService.saveToStorage();
    }
    return success;
  }, [currentSession?.id]);

  /**
   * Clear all chat history
   */
  const clearAllSessions = useCallback(() => {
    chatService.clearHistory();
    setSessions(chatService.getAllSessions());
    setCurrentSession(chatService.getCurrentSession());
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Save to storage when sessions change
  useEffect(() => {
    if (!isLoading && sessions.length > 0) {
      chatService.saveToStorage();
    }
  }, [sessions, isLoading]);

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
 * Hook for sending messages and managing chat state
 */
export function useChatMessages() {
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message to the chat API
   */
  const sendMessage = useCallback(async (
    content: string, 
    model: string = 'gpt-4'
  ): Promise<ChatMessage | null> => {
    setIsTyping(true);
    setError(null);

    try {
      const message = await chatService.sendMessage(content, model);
      return message;
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
   * Add a message to the current session (for system messages, etc.)
   */
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    try {
      const newMessage = chatService.addMessage(message);
      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, []);

  return {
    isTyping,
    error,
    sendMessage,
    addMessage,
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
