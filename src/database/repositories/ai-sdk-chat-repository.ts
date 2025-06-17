/**
 * AI SDK-aligned Chat Repository
 * Modern implementation following Vercel Chat SDK patterns
 */

import { getDatabase } from '../index';
import type { Chat, CreateChat, UpdateChat } from '../types-ai-sdk';
import type { Message } from 'ai';

export class AiSdkChatRepository {
  private db = getDatabase();

  /**
   * Create a new chat (AI SDK pattern)
   */
  createChat(chat: CreateChat): Chat {
    const stmt = this.db.prepare(`
      INSERT INTO chats (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(chat.id, chat.user_id, chat.title || 'New Chat');
    
    return this.getChatById(chat.id)!;
  }

  /**
   * Get chat by ID (primary lookup for AI SDK)
   */
  getChatById(id: string): Chat | null {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        user_id as userId,
        title,
        created_at as createdAt,
        updated_at as updatedAt,
        message_count as messageCount,
        last_message_at as lastMessageAt
      FROM chats 
      WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt) : undefined
    };
  }

  /**
   * Get all chats for a user (for chat sidebar)
   */
  getChatsByUserId(userId: string): Chat[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        user_id as userId,
        title,
        created_at as createdAt,
        updated_at as updatedAt,
        message_count as messageCount,
        last_message_at as lastMessageAt
      FROM chats 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `);
    
    const rows = stmt.all(userId) as any[];
    
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt) : undefined
    }));
  }

  /**
   * Update chat (typically for title changes)
   */
  updateChat(id: string, updates: UpdateChat): boolean {
    const setParts: string[] = [];
    const values: any[] = [];
    
    if (updates.title !== undefined) {
      setParts.push('title = ?');
      values.push(updates.title);
    }
    
    if (setParts.length === 0) return false;
    
    // Always update the updated_at timestamp
    setParts.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE chats 
      SET ${setParts.join(', ')}
      WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * Delete chat and all associated messages
   */
  deleteChat(id: string): boolean {
    // Due to CASCADE foreign key, this will also delete all messages
    const stmt = this.db.prepare('DELETE FROM chats WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Update chat metadata when messages are added/removed
   */
  updateChatMetadata(chatId: string): void {
    const stmt = this.db.prepare(`
      UPDATE chats 
      SET 
        message_count = (SELECT COUNT(*) FROM messages WHERE chat_id = ?),
        last_message_at = (SELECT MAX(created_at) FROM messages WHERE chat_id = ?),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(chatId, chatId, chatId);
  }

  /**
   * Get chat with message count (useful for admin/stats)
   */
  getChatWithStats(id: string): (Chat & { actualMessageCount: number }) | null {
    const stmt = this.db.prepare(`
      SELECT 
        c.id,
        c.user_id as userId,
        c.title,
        c.created_at as createdAt,
        c.updated_at as updatedAt,
        c.message_count as messageCount,
        c.last_message_at as lastMessageAt,
        COUNT(m.id) as actualMessageCount
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.id = ?
      GROUP BY c.id
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt) : undefined
    };
  }

  /**
   * Search chats by title or content (for search functionality)
   */
  searchChats(userId: string, query: string, limit: number = 20): Chat[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT
        c.id,
        c.user_id as userId,
        c.title,
        c.created_at as createdAt,
        c.updated_at as updatedAt,
        c.message_count as messageCount,
        c.last_message_at as lastMessageAt
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.user_id = ? 
        AND (
          c.title LIKE ? 
          OR m.content LIKE ?
        )
      ORDER BY c.updated_at DESC
      LIMIT ?
    `);
    
    const searchPattern = `%${query}%`;
    const rows = stmt.all(userId, searchPattern, searchPattern, limit) as any[];
    
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt) : undefined
    }));
  }

  /**
   * Delete all chats for a user (for account cleanup)
   */
  deleteAllChatsForUser(userId: string): number {
    const stmt = this.db.prepare('DELETE FROM chats WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }

  /**
   * Get recent chats (for quick access)
   */
  getRecentChats(userId: string, limit: number = 10): Chat[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        user_id as userId,
        title,
        created_at as createdAt,
        updated_at as updatedAt,
        message_count as messageCount,
        last_message_at as lastMessageAt
      FROM chats 
      WHERE user_id = ?
        AND message_count > 0
      ORDER BY last_message_at DESC, updated_at DESC
      LIMIT ?
    `);
    
    const rows = stmt.all(userId, limit) as any[];
    
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt) : undefined
    }));
  }
}
