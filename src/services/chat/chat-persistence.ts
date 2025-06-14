import { Message } from 'ai';
import { ChatRepository } from '@/database/repositories/chat-repository';
import { Chat, convertMessageToDb, convertDbToMessage } from '@/database/types-ai-sdk';

/**
 * Simplified chat persistence service aligned with AI SDK patterns
 * Focuses on chat-level operations and persistence, not complex session management
 */
export class ChatPersistence {
  private chatRepository: ChatRepository;

  constructor() {
    this.chatRepository = new ChatRepository();
  }

  // === Core Chat Operations ===

  /**
   * Create a new chat
   */
  async createChat(userId: string, title?: string): Promise<Chat> {
    return this.chatRepository.createChat(userId, title);
  }

  /**
   * Get a chat by ID
   */
  async getChat(chatId: string): Promise<Chat | null> {
    return this.chatRepository.getChatById(chatId);
  }

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    return this.chatRepository.getChatsByUserId(userId);
  }

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, title: string): Promise<void> {
    await this.chatRepository.updateChatTitle(chatId, title);
  }

  /**
   * Delete a chat and all its messages
   */
  async deleteChat(chatId: string): Promise<void> {
    await this.chatRepository.deleteChat(chatId);
  }

  // === AI SDK Integration ===

  /**
   * Load initial messages for AI SDK useChat hook
   * This is the primary integration point with AI SDK
   */
  async loadInitialMessages(chatId: string): Promise<Message[]> {
    const messages = await this.chatRepository.getMessages(chatId);
    return messages.map(convertDbToMessage);
  }

  /**
   * Save messages from AI SDK conversation
   * Call this periodically or on conversation end
   */
  async saveMessages(chatId: string, messages: Message[]): Promise<void> {
    const dbMessages = messages.map(convertMessageToDb);
    await this.chatRepository.saveMessages(chatId, dbMessages);
  }

  /**
   * Add a single message (for real-time persistence)
   */
  async persistMessage(chatId: string, message: Message): Promise<void> {
    const dbMessage = convertMessageToDb(message);
    await this.chatRepository.addMessage(chatId, dbMessage);
  }

  // === Utility Methods ===

  /**
   * Auto-generate chat title from conversation
   */
  async generateChatTitle(messages: Message[]): Promise<string> {
    if (messages.length === 0) return 'New Chat';
    
    // Find first meaningful user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Chat';
    
    // Extract text content from parts or fallback to content
    let content = '';
    if (firstUserMessage.parts) {
      content = firstUserMessage.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ');
    } else {
      content = firstUserMessage.content || '';
    }
    
    if (!content.trim()) return 'New Chat';
    
    // Create a meaningful title
    const title = content
      .slice(0, 50)
      .trim()
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ');
      
    return title.length < content.length ? `${title}...` : title;
  }

  /**
   * Get chat statistics
   */
  async getChatStats(chatId: string): Promise<{
    messageCount: number;
    lastMessageAt: Date | null;
  }> {
    return this.chatRepository.getChatStats(chatId);
  }

  /**
   * Search messages across user chats
   */
  async searchMessages(userId: string, query: string, limit = 10): Promise<{
    chatId: string;
    chatTitle: string;
    message: Message;
    snippet: string;
  }[]> {
    const results = await this.chatRepository.searchMessages(userId, query, limit);
    return results.map(result => ({
      chatId: result.chatId,
      chatTitle: result.chatTitle,
      message: convertDbToMessage(result.message),
      snippet: result.snippet
    }));
  }

  /**
   * Clean up old chats (maintenance operation)
   */
  async cleanupOldChats(userId: string, daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const oldChats = await this.chatRepository.getChatsByUserId(userId);
    let deletedCount = 0;
    
    for (const chat of oldChats) {
      if (new Date(chat.updatedAt) < cutoffDate) {
        await this.chatRepository.deleteChat(chat.id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

// Export singleton instance 
export const chatPersistence = new ChatPersistence();
