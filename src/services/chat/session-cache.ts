import { Chat } from '@/types/chat';
import { chatConfig } from '@/config/chat';

interface CacheEntry {
  data: Chat[];
  timestamp: number;
  userId: string;
}

/**
 * Simple in-memory cache for chats to reduce database queries
 * TODO: Gradually migrate from "session" terminology to "chat"
 */
class ChatCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Get cached chats for a user
   */
  get(userId: string): Chat[] | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;

    // Check if cache entry is still valid
    const isExpired = Date.now() - entry.timestamp > chatConfig.chatCacheTime;
    if (isExpired) {
      this.cache.delete(userId);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache chats for a user
   */
  set(userId: string, chats: Chat[]): void {
    // Limit cache size
    if (this.cache.size >= chatConfig.maxCachedChats) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(userId, {
      data: [...chats], // Create a copy to avoid mutations
      timestamp: Date.now(),
      userId
    });
  }

  /**
   * Update a specific chat in cache
   */
  updateSession(userId: string, chatId: string, updates: Partial<Chat>): void {
    const entry = this.cache.get(userId);
    if (!entry) return;

    const chatIndex = entry.data.findIndex(s => s.id === chatId);
    if (chatIndex >= 0) {
      entry.data[chatIndex] = { ...entry.data[chatIndex], ...updates };
      entry.timestamp = Date.now(); // Update cache timestamp
    }
  }

  /**
   * Add a new chat to cache
   */
  addSession(userId: string, chat: Chat): void {
    const entry = this.cache.get(userId);
    if (!entry) return;

    entry.data.unshift(chat); // Add to beginning of array
    entry.timestamp = Date.now();
  }

  /**
   * Remove a chat from cache
   */
  removeSession(userId: string, chatId: string): void {
    const entry = this.cache.get(userId);
    if (!entry) return;

    entry.data = entry.data.filter(s => s.id !== chatId);
    entry.timestamp = Date.now();
  }

  /**
   * Clear cache for a specific user
   */
  clear(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([userId, entry]) => ({
        userId,
        chatCount: entry.data.length,
        cacheAge: Date.now() - entry.timestamp
      }))
    };
  }
}

// Export singleton instance - keep name for backward compatibility
export const sessionCache = new ChatCache();
