import { ChatSession, ChatMessage } from '@/types/chat';
import { API_ROUTES } from '@/constants/routes';
import { getUserRepository, getSessionRepository, getMessageRepository } from '@/database/repositories';
import { generateTopicBasedTitle } from '@/utils/format';
import type { CreateUser } from '@/database/types';

/**
 * Chat service for handling chat operations and state management with database
 */
export class ChatService {
  private userRepository: ReturnType<typeof getUserRepository> | null = null;
  private sessionRepository: ReturnType<typeof getSessionRepository> | null = null;
  private messageRepository: ReturnType<typeof getMessageRepository> | null = null;
  private currentUserId: string | null = null;
  private currentSessionId: string | null = null;
  private initializedUsers = new Set<string>(); 

  private getRepositories() {
    if (!this.userRepository) {
      this.userRepository = getUserRepository();
    }
    if (!this.sessionRepository) {
      this.sessionRepository = getSessionRepository();
    }
    if (!this.messageRepository) {
      this.messageRepository = getMessageRepository();
    }
    
    return {
      userRepository: this.userRepository,
      sessionRepository: this.sessionRepository,
      messageRepository: this.messageRepository
    };
  } 

  /**
   * Initialize service for a user
   */
  async initializeForUser(userData: { id: string; email: string; name: string }): Promise<void> {
    // Skip initialization if user is already initialized
    if (this.currentUserId === userData.id && this.initializedUsers.has(userData.id)) {
      return;
    }

    // Ensure repositories are initialized
    const { userRepository, sessionRepository } = this.getRepositories();

    this.currentUserId = userData.id;
    
    // Only upsert user if not already initialized
    if (!this.initializedUsers.has(userData.id)) {
      // Ensure user exists in database
      const createUserData: CreateUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name
      };
      
      userRepository.upsertUser(createUserData);
      this.initializedUsers.add(userData.id);
    }
    
    // Get or create a session for the user
    const sessions = sessionRepository.getSessionsForUser(userData.id, 1);
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

    const { sessionRepository } = this.getRepositories();

    const sessionId = this.generateSessionId();
    const sessionData = {
      id: sessionId,
      user_id: this.currentUserId,
      title: title || `Chat ${new Date().toLocaleDateString()}`
    };

    const dbSession = sessionRepository.createSession(sessionData);
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

    const { sessionRepository, messageRepository } = this.getRepositories();

    const dbSession = sessionRepository.getSessionById(this.currentSessionId);
    if (!dbSession) {
      return await this.createSession();
    }

    const session = this.mapDbSessionToSession(dbSession);
    
    // Load messages for the session
    const dbMessages = messageRepository.getMessagesForSession(this.currentSessionId);
    session.messages = dbMessages.map(this.mapDbMessageToMessage);
    
    return session;
  }

  /**
   * Switch to a different session or create it if it doesn't exist
   */
  async switchToSession(sessionId: string): Promise<ChatSession | null> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    const { sessionRepository } = this.getRepositories();

    const dbSession = sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return null;
    }

    this.currentSessionId = sessionId;
    sessionRepository.touchSession(sessionId);
    
    return this.mapDbSessionToSession(dbSession);
  }

  /**
   * Get or create a session by ID
   */
  async getOrCreateSession(sessionId?: string): Promise<ChatSession> {
    if (!this.currentUserId) {
      throw new Error('User not initialized. Call initializeForUser first.');
    }

    if (sessionId) {
      // Try to get existing session first
      const existingSession = await this.switchToSession(sessionId);
      if (existingSession) {
        return existingSession;
      }
      
      // If session doesn't exist, create it with the provided ID
      const { sessionRepository } = this.getRepositories();
      const sessionData = {
        id: sessionId,
        user_id: this.currentUserId,
        title: `Chat ${new Date().toLocaleDateString()}`
      };

      const dbSession = sessionRepository.createSession(sessionData);
      this.currentSessionId = sessionId;
      
      return this.mapDbSessionToSession(dbSession);
    } else {
      // No session ID provided, get or create current session
      const session = await this.getCurrentSession();
      if (!session) {
        // This should not happen since getCurrentSession creates one if none exists
        return await this.createSession();
      }
      return session;
    }
  }

  /**
   * Add message to current session
   */
  async addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const session = await this.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { messageRepository, sessionRepository } = this.getRepositories();

    const messageData = {
      id: this.generateMessageId(),
      session_id: session.id,
      role: message.role,
      content: message.content,
      model: message.model,
      is_error: message.isError || false
    };

    const dbMessage = messageRepository.createMessage(messageData);
    
    // If this is the first user message in the session, auto-generate a better title
    if (message.role === 'user' && message.content.trim()) {
      const existingMessages = messageRepository.getMessagesForSession(session.id);
      const userMessages = existingMessages.filter(msg => msg.role === 'user');
      
      // Only update title if this is the first user message and session has default title
      if (userMessages.length === 1 && session.title.startsWith('Chat ')) {
        const newTitle = generateTopicBasedTitle(message.content);
        await this.updateSessionTitle(session.id, newTitle);
      }
    }
    
    // Touch the session to update its timestamp
    sessionRepository.touchSession(session.id);
    
    return this.mapDbMessageToMessage(dbMessage);
  }

  /**
   * Get all sessions for current user
   */
  async getAllSessions(): Promise<ChatSession[]> {
    if (!this.currentUserId) {
      return [];
    }

    const { sessionRepository } = this.getRepositories();

    const dbSessions = sessionRepository.getSessionsForUser(this.currentUserId);
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

    const { sessionRepository } = this.getRepositories();

    // Verify session belongs to current user
    const dbSession = sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return false;
    }

    const success = sessionRepository.deleteSession(sessionId);
    
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

    const { sessionRepository } = this.getRepositories();

    // Verify session belongs to current user
    const dbSession = sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return false;
    }

    const updated = sessionRepository.updateSession(sessionId, { title });
    return !!updated;
  }

  /**
   * Touch session to update its timestamp (for auto-save)
   */
  async touchSession(sessionId: string): Promise<boolean> {
    if (!this.currentUserId) {
      return false;
    }

    const { sessionRepository } = this.getRepositories();

    // Verify session belongs to current user
    const dbSession = sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return false;
    }

    sessionRepository.touchSession(sessionId);
    return true;
  }

  /**
   * Clear all chat history for current user
   */
  async clearHistory(): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    const { sessionRepository } = this.getRepositories();

    sessionRepository.deleteAllSessionsForUser(this.currentUserId);
    await this.createSession();
  }

  /**
   * Get messages for a specific session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!this.currentUserId) {
      return [];
    }

    const { sessionRepository, messageRepository } = this.getRepositories();

    // Verify session belongs to current user
    const dbSession = sessionRepository.getSessionById(sessionId);
    if (!dbSession || dbSession.user_id !== this.currentUserId) {
      return [];
    }

    const dbMessages = messageRepository.getMessagesForSession(sessionId);
    return dbMessages.map(this.mapDbMessageToMessage);
  }

  /**
   * Clear user initialization cache (useful for logout or user switching)
   */
  clearUserCache(userId?: string): void {
    if (userId) {
      this.initializedUsers.delete(userId);
    } else {
      this.initializedUsers.clear();
      this.currentUserId = null;
      this.currentSessionId = null;
    }
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
