import { useState, useEffect, useCallback, useRef } from 'react';
import { Chat } from '@/types/chat';
import { sessionCache } from '@/services/chat/session-cache';
import { toast } from 'sonner';

/**
 * Enhanced chat management hook aligned with Vercel Chat SDK patterns
 * Focuses on chat list management while letting useChat handle messages
 * Updated terminology: sessions → chats (following Vercel Chat SDK)
 */
export function useChats(user?: { id: string; email: string; name: string }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef(user);
  
  // Keep user ref updated
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /**
   * Load chats from API with enhanced error handling
   * Following Chat SDK patterns for chat management
   */
  const loadChats = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    // Check cache first (still using session cache for backward compatibility)
    const cachedChats = sessionCache.get(currentUser.id);
    if (cachedChats) {
      setChats(cachedChats);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Updated API endpoint following Chat SDK patterns
      const response = await fetch(`/api/chat/chats?userId=${encodeURIComponent(currentUser.id)}`);
      if (!response.ok) {
        throw new Error('Failed to load chats');
      }
      
      const data = await response.json();
      const fetchedChats = data.chats || [];
      
      // Update cache
      sessionCache.set(currentUser.id, fetchedChats);
      setChats(fetchedChats);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chats');
      setIsLoading(false);
      toast.error('Failed to load chat history');
    }
  }, []);

  /**
   * Create a new chat following Chat SDK patterns
   */
  const createChat = useCallback(async (): Promise<Chat | null> => {
    const currentUser = userRef.current;
    if (!currentUser) {
      toast.error('User not authenticated');
      return null;
    }
    
    try {
      const response = await fetch('/api/chat/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          title: 'New Chat'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat');
      }
      
      const newChat = await response.json();
      
      // Update local state and cache
      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setCurrentChat(newChat);
      sessionCache.set(currentUser.id, updatedChats);
      
      return newChat;
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create new chat');
      return null;
    }
  }, [chats]);

  /**
   * Update chat title following Chat SDK patterns
   */
  const updateChatTitle = useCallback(async (chatId: string, title: string): Promise<boolean> => {
    const currentUser = userRef.current;
    if (!currentUser) return false;
    
    try {
      const response = await fetch(`/api/chat/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }
      
      // Update local state and cache
      const updatedChats = chats.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      );
      setChats(updatedChats);
      sessionCache.set(currentUser.id, updatedChats);
      
      // Update current chat if it's the one being updated
      if (currentChat?.id === chatId) {
        setCurrentChat({ ...currentChat, title });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update chat title:', error);
      toast.error('Failed to update chat title');
      return false;
    }
  }, [chats, currentChat]);

  /**
   * Delete chat following Chat SDK patterns
   */
  const deleteChat = useCallback(async (chatId: string): Promise<boolean> => {
    const currentUser = userRef.current;
    if (!currentUser) return false;
    
    try {
      const response = await fetch(`/api/chat/chats/${chatId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }
      
      // Update local state and cache
      const updatedChats = chats.filter(chat => chat.id !== chatId);
      setChats(updatedChats);
      sessionCache.set(currentUser.id, updatedChats);
      
      // Clear current chat if it's the one being deleted
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
      
      toast.success('Chat deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
      return false;
    }
  }, [chats, currentChat]);

  /**
   * Select a chat as current
   */
  const selectChat = useCallback((chat: Chat | null) => {
    setCurrentChat(chat);
  }, []);

  /**
   * Refresh chats from server
   */
  const refreshChats = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    
    // Clear cache to force fresh fetch
    sessionCache.clear(currentUser.id);
    await loadChats();
  }, [loadChats]);

  /**
   * Get chat by ID
   */
  const getChatById = useCallback((chatId: string): Chat | undefined => {
    return chats.find(chat => chat.id === chatId);
  }, [chats]);

  /**
   * Add message to chat (for optimistic updates)
   * This works alongside useChat for local state management
   */
  const updateChatPreview = useCallback((chatId: string, lastMessage: string, timestamp?: Date) => {
    const updatedChats = chats.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            lastMessage,
            updatedAt: timestamp || new Date()
          } 
        : chat
    );
    setChats(updatedChats);
    
    // Update cache
    const currentUser = userRef.current;
    if (currentUser) {
      sessionCache.set(currentUser.id, updatedChats);
    }
  }, [chats]);

  // Load chats on mount and user change
  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      // Clear state when user logs out
      setChats([]);
      setCurrentChat(null);
      setIsLoading(false);
      setError(null);
    }
  }, [user, loadChats]);

  return {
    // Updated naming following Chat SDK patterns
    chats,
    currentChat,
    isLoading,
    error,
    
    // Actions
    createChat,
    updateChatTitle,
    deleteChat,
    selectChat,
    refreshChats,
    getChatById,
    updateChatPreview,
    
    // Backward compatibility (deprecated, will be removed)
    sessions: chats,
    currentSession: currentChat,
    createSession: createChat,
    updateSessionTitle: updateChatTitle,
    deleteSession: deleteChat,
    selectSession: selectChat,
    refreshSessions: refreshChats,
    getSessionById: getChatById,
    switchToSession: async (sessionId: string) => {
      const chat = chats.find(c => c.id === sessionId);
      selectChat(chat || null);
      return chat || null;
    },
    clearAllSessions: async () => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      
      try {
        const response = await fetch('/api/chat/sessions/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear sessions');
        }
        
        setChats([]);
        setCurrentChat(null);
        sessionCache.clear(currentUser.id);
      } catch (error) {
        console.error('Error clearing sessions:', error);
        toast.error('Failed to clear chat history');
      }
    }
  };
}

// Backward compatibility export
export const useChatSessions = useChats;
