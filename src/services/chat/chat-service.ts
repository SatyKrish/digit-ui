import { ChatSession, ChatMessage } from '@/types/chat';
import { API_ROUTES } from '@/constants/routes';
import { getUserRepository, getSessionRepository, getMessageRepository } from '@/database/repositories';
import { generateTopicBasedTitle } from '@/utils/format';
import type { CreateUser } from '@/database/types';

/**
 * Chat service for handling chat operations and state management with database
 */
export class ChatService {
  private userRepository = getUserRepository();
  private sessionRepository = getSessionRepository();
  private messageRepository = getMessageRepository();
  private currentUserId: string | null = null;
  private currentSessionId: string | null = null;

  /**
   * Initialize service for a user
   */
  async initializeForUser(userData: { id: string; email: string; name: string }): Promise<void> {
    this.currentUserId = userData.id;
    
    // Ensure user exists in database
    const createUserData: CreateUser = {
      id: userData.id,
      email: userData.email,
      name: userData.name
    };
    
    this.userRepository.upsertUser(createUserData);
    
    // Get or create a session for the user
    const sessions = this.sessionRepository.getSessionsForUser(userData.id, 1);
    if (sessions.length === 0) {
      await this.createSession();
    } else {
      this.currentSessionId = sessions[0].id;
    }
  }

  /**
   * Create a new chat session
   */
  async createSession(title?: string): Promise<ChatSession> {
    if (!this.currentUserId) {
      throw new Error('User not initialized. Call initializeForUser first.');
    }

    const sessionId = this.generateSessionId();
    const sessionData = {
      id: sessionId,
      user_id: this.currentUserId,
      title: title || `Chat ${new Date().toLocaleDateString()}`
    };

    const dbSession = this.sessionRepository.createSession(sessionData);
    this.currentSessionId = sessionId;
    
    return this.mapDbSessionToSession(dbSession);
  }

  /**
   * Get current active session
   */
  async getCurrentSession(): Promise<ChatSession | null> {
    if (!this.currentSessionId) {
      return await this.createSession();
    }

    const dbSession = this.sessionRepository.getSessionById(this.currentSessionId);
    if (!dbSession) {
      return await this.createSession();
    }

    const session = this.mapDbSessionToSession(dbSession);
    
    // Load messages for the session
    const dbMessages = this.messageRepository.getMessagesForSession(this.currentSessionId);
    session.messages = dbMessages.map(this.mapDbMessageToMessage);
    
    return session;
  }

  /**
   * Switch to a different session
   */
  async switchToSession(sessionId: string): Promise<ChatSession | null> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    const dbSession = this.sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return null;
    }

    this.currentSessionId = sessionId;
    this.sessionRepository.touchSession(sessionId);
    
    return this.mapDbSessionToSession(dbSession);
  }

  /**
   * Add message to current session
   */
  async addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const session = await this.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const messageData = {
      id: this.generateMessageId(),
      session_id: session.id,
      role: message.role,
      content: message.content,
      model: message.model,
      is_error: message.isError || false
    };

    const dbMessage = this.messageRepository.createMessage(messageData);
    
    // If this is the first user message in the session, auto-generate a better title
    if (message.role === 'user' && message.content.trim()) {
      const existingMessages = this.messageRepository.getMessagesForSession(session.id);
      const userMessages = existingMessages.filter(msg => msg.role === 'user');
      
      // Only update title if this is the first user message and session has default title
      if (userMessages.length === 1 && session.title.startsWith('Chat ')) {
        const newTitle = generateTopicBasedTitle(message.content);
        await this.updateSessionTitle(session.id, newTitle);
      }
    }
    
    // Touch the session to update its timestamp
    this.sessionRepository.touchSession(session.id);
    
    return this.mapDbMessageToMessage(dbMessage);
  }

  /**
   * Get all sessions for current user
   */
  async getAllSessions(): Promise<ChatSession[]> {
    if (!this.currentUserId) {
      return [];
    }

    const dbSessions = this.sessionRepository.getSessionsForUser(this.currentUserId);
    return dbSessions.map((dbSession: import('@/database/types').SessionWithMessageCount) => {
      const session = this.mapDbSessionToSession(dbSession);
      session.messageCount = dbSession.message_count;
      if (dbSession.last_message_at) {
        session.lastMessageAt = new Date(dbSession.last_message_at);
      }
      return session;
    });
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.currentUserId) {
      return false;
    }

    // Verify session belongs to current user
    const dbSession = this.sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return false;
    }

    const success = this.sessionRepository.deleteSession(sessionId);
    
    // If we deleted the current session, create a new one
    if (success && this.currentSessionId === sessionId) {
      await this.createSession();
    }
    
    return success;
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    if (!this.currentUserId) {
      return false;
    }

    // Verify session belongs to current user
    const dbSession = this.sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return false;
    }

    const updated = this.sessionRepository.updateSession(sessionId, { title });
    return !!updated;
  }

  /**
   * Send message to chat API
   */
  async sendMessage(content: string, model?: string): Promise<ChatMessage> {
    const userMessage = await this.addMessage({
      role: 'user',
      content,
      model: model || 'gpt-4'
    });

    try {
      const response = await fetch(API_ROUTES.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          model: model || 'gpt-4',
          sessionId: this.currentSessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage = await this.addMessage({
        role: 'assistant',
        content: data.message || data.content,
        model: model || 'gpt-4'
      });

      return assistantMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage = await this.addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        model: model || 'gpt-4',
        isError: true
      });

      throw error;
    }
  }

  /**
   * Clear all chat history for current user
   */
  async clearHistory(): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    this.sessionRepository.deleteAllSessionsForUser(this.currentUserId);
    await this.createSession();
  }

  /**
   * Get messages for a specific session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!this.currentUserId) {
      return [];
    }

    // Verify session belongs to current user
    const dbSession = this.sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return [];
    }

    const dbMessages = this.messageRepository.getMessagesForSession(sessionId);
    return dbMessages.map(this.mapDbMessageToMessage);
  }

  // Helper methods for mapping database types to application types
  private mapDbSessionToSession(dbSession: import('@/database/types').ChatSession): ChatSession {
    return {
      id: dbSession.id,
      title: dbSession.title,
      timestamp: dbSession.created_at,
      createdAt: new Date(dbSession.created_at),
      updatedAt: new Date(dbSession.updated_at),
      isActive: dbSession.id === this.currentSessionId
    };
  }

  private mapDbMessageToMessage(dbMessage: import('@/database/types').ChatMessage): ChatMessage {
    return {
      id: dbMessage.id,
      role: dbMessage.role,
      content: dbMessage.content,
      model: dbMessage.model,
      timestamp: new Date(dbMessage.created_at),
      isError: dbMessage.is_error
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const chatService = new ChatService();
