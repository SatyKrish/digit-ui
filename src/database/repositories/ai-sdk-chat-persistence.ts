/**
 * Modern Chat Persistence Service for AI SDK
 * Unified service layer that combines all repositories with AI SDK patterns
 */

import type { Message } from 'ai';
import type { Chat, CreateChat, UpdateChat } from '../types-ai-sdk';
import { AiSdkChatRepository } from './ai-sdk-chat-repository';
import { AiSdkMessageRepository } from './ai-sdk-message-repository';
import { AiSdkUserRepository, type CreateUser } from './ai-sdk-user-repository';
import { convertMessageToDb } from '../types-ai-sdk';

export class AiSdkChatPersistence {
  private chatRepo = new AiSdkChatRepository();
  private messageRepo = new AiSdkMessageRepository();
  private userRepo = new AiSdkUserRepository();

  // ============================
  // User Management (for auth)
  // ============================

  /**
   * Ensure user exists (called from auth middleware)
   */
  async ensureUser(user: CreateUser) {
    return this.userRepo.upsertUser(user);
  }

  /**
   * Get user by ID
   */
  async getUser(id: string) {
    return this.userRepo.getUserById(id);
  }

  // ============================
  // Chat Management (AI SDK)
  // ============================

  /**
   * Create a new chat (AI SDK useChat pattern)
   */
  async createChat(userId: string, title?: string): Promise<Chat> {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const createData: CreateChat = {
      id: chatId,
      user_id: userId,
      title: title || 'New Chat'
    };

    return this.chatRepo.createChat(createData);
  }

  /**
   * Get chat by ID (used by AI SDK for initialization)
   */
  async getChat(id: string): Promise<Chat | null> {
    return this.chatRepo.getChatById(id);
  }

  /**
   * Get all chats for user (for sidebar)
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    return this.chatRepo.getChatsByUserId(userId);
  }

  /**
   * Update chat title
   */
  async updateChat(id: string, updates: UpdateChat): Promise<boolean> {
    return this.chatRepo.updateChat(id, updates);
  }

  /**
   * Delete chat
   */
  async deleteChat(id: string): Promise<boolean> {
    return this.chatRepo.deleteChat(id);
  }

  /**
   * Delete all chats for user
   */
  async deleteAllUserChats(userId: string): Promise<number> {
    return this.chatRepo.deleteAllChatsForUser(userId);
  }

  // ============================
  // Message Management (AI SDK)
  // ============================

  /**
   * Save a message (used by AI SDK onFinish)
   */
  async saveMessage(message: Message, chatId: string): Promise<void> {
    this.messageRepo.saveMessage(message, chatId);
    
    // Update chat metadata
    this.chatRepo.updateChatMetadata(chatId);
  }

  /**
   * Save multiple messages (batch operation)
   */
  async saveMessages(messages: Message[], chatId: string): Promise<void> {
    // Filter out duplicate messages that might already exist
    const uniqueMessages = this.deduplicateMessages(messages);
    
    if (uniqueMessages.length === 0) {
      console.log(`[PERSISTENCE] No new messages to save for chat ${chatId}`);
      return;
    }
    
    this.messageRepo.saveMessages(uniqueMessages, chatId);
    
    // Update chat metadata
    this.chatRepo.updateChatMetadata(chatId);
  }

  /**
   * Deduplicate messages to prevent UNIQUE constraint violations
   */
  private deduplicateMessages(messages: Message[]): Message[] {
    const seen = new Set<string>();
    const uniqueMessages: Message[] = [];
    
    for (const message of messages) {
      if (!seen.has(message.id)) {
        seen.add(message.id);
        uniqueMessages.push(message);
      } else {
        console.log(`[PERSISTENCE] Skipping duplicate message: ${message.id}`);
      }
    }
    
    return uniqueMessages;
  }

  /**
   * Load messages for AI SDK useChat (initialMessages)
   */
  async loadInitialMessages(chatId: string): Promise<Message[]> {
    return this.messageRepo.getMessagesByChatId(chatId);
  }

  /**
   * Get messages for chat (alias for consistency)
   */
  async getMessages(chatId: string): Promise<Message[]> {
    return this.messageRepo.getMessagesByChatId(chatId);
  }

  /**
   * Get paginated messages (for infinite scroll)
   */
  async getMessagesPaginated(
    chatId: string, 
    limit: number = 50, 
    beforeMessageId?: string
  ): Promise<Message[]> {
    return this.messageRepo.getMessagesPaginated(chatId, limit, beforeMessageId);
  }

  // ============================
  // Search and Analytics
  // ============================

  /**
   * Search chats
   */
  async searchChats(userId: string, query: string, limit?: number): Promise<Chat[]> {
    return this.chatRepo.searchChats(userId, query, limit);
  }

  /**
   * Search messages within a chat
   */
  async searchMessages(chatId: string, query: string, limit?: number): Promise<Message[]> {
    return this.messageRepo.searchMessages(chatId, query, limit);
  }

  /**
   * Global message search across all user chats
   */
  async searchMessagesGlobally(userId: string, query: string, limit?: number) {
    return this.messageRepo.searchMessagesGlobally(userId, query, limit);
  }

  /**
   * Get recent chats for quick access
   */
  async getRecentChats(userId: string, limit?: number): Promise<Chat[]> {
    return this.chatRepo.getRecentChats(userId, limit);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    return this.userRepo.getUserStats(userId);
  }

  // ============================
  // AI SDK Integration Helpers
  // ============================

  /**
   * Prepare chat for AI SDK useChat hook
   * Returns chat info and initial messages
   */
  async prepareChatForAiSdk(chatId: string): Promise<{
    chat: Chat | null;
    initialMessages: Message[];
  }> {
    const [chat, messages] = await Promise.all([
      this.getChat(chatId),
      this.loadInitialMessages(chatId)
    ]);

    return {
      chat,
      initialMessages: messages
    };
  }

  /**
   * Handle AI SDK message completion
   * Called from AI SDK's onFinish callback
   */
  async handleMessageCompletion(
    messages: Message[], 
    chatId: string,
    options?: {
      updateTitle?: boolean;
      titlePrompt?: string;
    }
  ): Promise<void> {
    try {
      // Save all new messages
      await this.saveMessages(messages, chatId);

      // Auto-generate title if this is the first conversation
      if (options?.updateTitle && messages.length <= 2) {
        const userMessage = messages.find(m => m.role === 'user');
        if (userMessage && userMessage.content.length > 0) {
          const title = this.generateTitleFromMessage(userMessage.content);
          await this.updateChat(chatId, { title });
        }
      }
    } catch (error) {
      console.error(`[PERSISTENCE] Failed to handle message completion for chat ${chatId}:`, error);
      
      // For SQLite constraint errors, provide more specific information
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        console.error(`[PERSISTENCE] Duplicate message ID detected, this should be handled by INSERT OR REPLACE`);
        throw new Error(`Message persistence failed due to duplicate ID: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Generate chat title from first user message
   */
  private generateTitleFromMessage(content: string): string {
    // Simple title generation - take first 50 chars and clean up
    const title = content
      .trim()
      .replace(/\n/g, ' ')
      .substring(0, 50)
      .trim();
    
    return title.length > 0 ? 
      (title.length === 50 ? title + '...' : title) : 
      'New Chat';
  }

  // ============================
  // Cleanup and Maintenance
  // ============================

  /**
   * Clean up old chats
   */
  async cleanupOldChats(userId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const userChats = await this.getUserChats(userId);
    let deletedCount = 0;
    
    for (const chat of userChats) {
      if (new Date(chat.updatedAt) < cutoffDate) {
        await this.deleteChat(chat.id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Validate chat integrity
   */
  async validateChat(chatId: string): Promise<{
    isValid: boolean;
    issues: string[];
    messageCount: number;
    actualMessageCount: number;
  }> {
    const issues: string[] = [];
    
    const chat = await this.getChat(chatId);
    if (!chat) {
      return {
        isValid: false,
        issues: ['Chat not found'],
        messageCount: 0,
        actualMessageCount: 0
      };
    }

    const actualCount = this.messageRepo.getMessageCount(chatId);
    const storedCount = chat.messageCount || 0;

    if (actualCount !== storedCount) {
      issues.push(`Message count mismatch: stored=${storedCount}, actual=${actualCount}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      messageCount: storedCount,
      actualMessageCount: actualCount
    };
  }
}

// Export singleton instance
export const aiSdkChatPersistence = new AiSdkChatPersistence();
