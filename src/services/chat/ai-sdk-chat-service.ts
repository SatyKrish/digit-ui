import { Message, CreateMessage } from 'ai';
import { ChatRepository } from '@/database/repositories/chat-repository';
import { Chat, DbMessage, convertMessageToDb, convertDbToMessage } from '@/database/types-ai-sdk';

/**
 * Simplified chat service aligned with AI SDK patterns
 * Removes complex session management and focuses on chat-level operations
 */
export class AiSdkChatService {
  private chatRepository: ChatRepository;

  constructor() {
    this.chatRepository = new ChatRepository();
  }

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

  /**
   * Get initial messages for AI SDK useChat hook
   * This replaces the complex session loading logic
   */
  async getInitialMessages(chatId: string): Promise<Message[]> {
    const messages = await this.chatRepository.getMessages(chatId);
    return messages.map(convertDbToMessage);
  }

  /**
   * Save messages after AI SDK conversation
   * This should be called periodically or on conversation end
   */
  async saveMessages(chatId: string, messages: Message[]): Promise<void> {
    const dbMessages = messages.map(convertMessageToDb);
    await this.chatRepository.saveMessages(chatId, dbMessages);
  }

  /**
   * Add a single message (for real-time updates)
   */
  async addMessage(chatId: string, message: Message): Promise<void> {
    const dbMessage = convertMessageToDb(message);
    await this.chatRepository.addMessage(chatId, dbMessage);
  }

  /**
   * Update the last message in a chat (useful for streaming updates)
   */
  async updateLastMessage(chatId: string, content: string): Promise<void> {
    await this.chatRepository.updateLastMessage(chatId, content);
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
   * Search messages across all user chats
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
   * Auto-generate chat title based on first few messages
   * This can be called after the first exchange
   */
  async generateChatTitle(chatId: string, messages: Message[]): Promise<string> {
    if (messages.length === 0) return 'New Chat';
    
    // Simple title generation based on first user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Chat';
    
    const content = firstUserMessage.content;
    if (typeof content === 'string') {
      // Take first 50 characters and clean up
      const title = content
        .slice(0, 50)
        .trim()
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ');
      
      return title.length < content.length ? `${title}...` : title;
    }
    
    return 'New Chat';
  }

  /**
   * Clean up old chats (useful for maintenance)
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
export const aiSdkChatService = new AiSdkChatService();
