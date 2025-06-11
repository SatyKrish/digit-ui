import { ChatSession } from '@/types/chat';
import { chatConfig } from '@/config/chat';

interface CacheEntry {
  data: ChatSession[];
  timestamp: number;
  userId: string;
}

/**
 * Simple in-memory cache for chat sessions to reduce database queries
 */
class SessionCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Get cached sessions for a user
   */
  get(userId: string): ChatSession[] | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;

    // Check if cache entry is still valid
    const isExpired = Date.now() - entry.timestamp > chatConfig.sessionCacheTime;
    if (isExpired) {
      this.cache.delete(userId);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache sessions for a user
   */
  set(userId: string, sessions: ChatSession[]): void {
    // Limit cache size
    if (this.cache.size >= chatConfig.maxCachedSessions) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(userId, {
      data: [...sessions], // Create a copy to avoid mutations
      timestamp: Date.now(),
      userId
    });
  }

  /**
   * Update a specific session in cache
   */
  updateSession(userId: string, sessionId: string, updates: Partial<ChatSession>): void {
    const entry = this.cache.get(userId);
    if (!entry) return;

    const sessionIndex = entry.data.findIndex(s => s.id === sessionId);
    if (sessionIndex >= 0) {
      entry.data[sessionIndex] = { ...entry.data[sessionIndex], ...updates };
      entry.timestamp = Date.now(); // Update cache timestamp
    }
  }

  /**
   * Add a new session to cache
   */
  addSession(userId: string, session: ChatSession): void {
    const entry = this.cache.get(userId);
    if (!entry) return;

    entry.data.unshift(session); // Add to beginning of array
    entry.timestamp = Date.now();
  }

  /**
   * Remove a session from cache
   */
  removeSession(userId: string, sessionId: string): void {
    const entry = this.cache.get(userId);
    if (!entry) return;

    entry.data = entry.data.filter(s => s.id !== sessionId);
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
        sessionCount: entry.data.length,
        cacheAge: Date.now() - entry.timestamp
      }))
    };
  }
}

// Export singleton instance
export const sessionCache = new SessionCache();
