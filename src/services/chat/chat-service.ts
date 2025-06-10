import { ChatSession, ChatMessage, ChatContextType } from '@/types/chat';
import { API_ROUTES } from '@/constants/routes';

/**
 * Chat service for handling chat operations and state management
 */
export class ChatService {
  private sessions: Map<string, ChatSession> = new Map();
  private currentSessionId: string | null = null;

  /**
   * Create a new chat session
   */
  createSession(title?: string): ChatSession {
    const sessionId = this.generateSessionId();
    const session: ChatSession = {
      id: sessionId,
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    
    return session;
  }

  /**
   * Get current active session
   */
  getCurrentSession(): ChatSession | null {
    if (!this.currentSessionId || !this.sessions.has(this.currentSessionId)) {
      return this.createSession();
    }
    return this.sessions.get(this.currentSessionId) || null;
  }

  /**
   * Switch to a different session
   */
  switchToSession(sessionId: string): ChatSession | null {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
      return this.sessions.get(sessionId) || null;
    }
    return null;
  }

  /**
   * Add message to current session
   */
  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const newMessage: ChatMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date()
    };

    session.messages.push(newMessage);
    session.updatedAt = new Date();
    
    return newMessage;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      
      // If we deleted the current session, create a new one
      if (this.currentSessionId === sessionId) {
        this.createSession();
      }
      
      return true;
    }
    return false;
  }

  /**
   * Update session title
   */
  updateSessionTitle(sessionId: string, title: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      session.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Send message to chat API
   */
  async sendMessage(content: string, model?: string): Promise<ChatMessage> {
    const userMessage = this.addMessage({
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
      
      const assistantMessage = this.addMessage({
        role: 'assistant',
        content: data.message || data.content,
        model: model || 'gpt-4'
      });

      return assistantMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage = this.addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        model: model || 'gpt-4',
        isError: true
      });

      throw error;
    }
  }

  /**
   * Load chat history from storage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('digit-chat-sessions');
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions.clear();
        
        for (const [id, sessionData] of Object.entries(data.sessions || {})) {
          const session = sessionData as any;
          this.sessions.set(id, {
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          });
        }
        
        this.currentSessionId = data.currentSessionId;
        
        // Ensure we have at least one session
        if (this.sessions.size === 0) {
          this.createSession();
        }
      } else {
        this.createSession();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.createSession();
    }
  }

  /**
   * Save chat history to storage
   */
  saveToStorage(): void {
    try {
      const data = {
        sessions: Object.fromEntries(this.sessions),
        currentSessionId: this.currentSessionId
      };
      localStorage.setItem('digit-chat-sessions', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Clear all chat history
   */
  clearHistory(): void {
    this.sessions.clear();
    this.currentSessionId = null;
    this.createSession();
    this.saveToStorage();
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
