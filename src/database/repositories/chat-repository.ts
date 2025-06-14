/**
 * AI SDK-aligned Chat Repository
 * Simplified repository focused on chat-level operations with new table structure
 */

import Database from 'better-sqlite3';
import { getDatabase } from '../index';
import { Chat, DbMessage } from '../types-ai-sdk';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export class ChatRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Create a new chat
   */
  async createChat(userId: string, title?: string): Promise<Chat> {
    const chatId = generateId();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO chats (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(chatId, userId, title || 'New Chat', now, now);
    
    return {
      id: chatId,
      userId,
      title: title || 'New Chat',
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  /**
   * Get a chat by ID
   */
  async getChatById(chatId: string): Promise<Chat | null> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, title, created_at, updated_at
      FROM chats
      WHERE id = ?
    `);
    
    const row = stmt.get(chatId) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Get all chats for a user
   */
  async getChatsByUserId(userId: string): Promise<Chat[]> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, title, created_at, updated_at
      FROM chats
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `);
    
    const rows = stmt.all(userId) as any[];
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, title: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE chats
      SET title = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(title, new Date().toISOString(), chatId);
  }

  /**
   * Delete a chat and all its messages
   */
  async deleteChat(chatId: string): Promise<void> {
    const transaction = this.db.transaction(() => {
      // Delete messages first (due to foreign key constraints)
      const deleteMessagesStmt = this.db.prepare(`DELETE FROM messages WHERE chat_id = ?`);
      deleteMessagesStmt.run(chatId);
      
      // Delete the chat
      const deleteChatStmt = this.db.prepare(`DELETE FROM chats WHERE id = ?`);
      deleteChatStmt.run(chatId);
    });
    
    transaction();
  }

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: string): Promise<DbMessage[]> {
    const stmt = this.db.prepare(`
      SELECT 
        id, chat_id, role, content, name, tool_call_id, 
        tool_invocations, experimental_attachments, annotations, 
        parts, reasoning, finish_reason, usage_stats, created_at
      FROM messages
      WHERE chat_id = ?
      ORDER BY created_at ASC
    `);
    
    const rows = stmt.all(chatId) as any[];
    return rows.map(row => ({
      id: row.id,
      chatId: row.chat_id,
      role: row.role,
      content: row.content,
      name: row.name,
      toolCallId: row.tool_call_id,
      toolInvocations: row.tool_invocations,
      experimentalAttachments: row.experimental_attachments,
      annotations: row.annotations,
      parts: row.parts,
      reasoning: row.reasoning,
      finishReason: row.finish_reason,
      usageStats: row.usage_stats,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Save multiple messages (batch operation)
   */
  async saveMessages(chatId: string, messages: DbMessage[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages (
        id, chat_id, role, content, name, tool_call_id, 
        tool_invocations, experimental_attachments, annotations, 
        parts, reasoning, finish_reason, usage_stats, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = this.db.transaction((msgs: DbMessage[]) => {
      for (const msg of msgs) {
        // Handle createdAt conversion to ISO string for database storage
        let createdAtISO: string;
        if (msg.createdAt instanceof Date) {
          createdAtISO = msg.createdAt.toISOString();
        } else if (typeof msg.createdAt === 'string') {
          const date = new Date(msg.createdAt);
          createdAtISO = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } else {
          createdAtISO = new Date().toISOString();
        }
        
        stmt.run(
          msg.id,
          chatId,
          msg.role,
          msg.content,
          msg.name || null,
          msg.toolCallId || null,
          msg.toolInvocations || null,
          msg.experimentalAttachments || null,
          msg.annotations || null,
          msg.parts || null,
          msg.reasoning || null,
          msg.finishReason || null,
          msg.usageStats || null,
          createdAtISO
        );
      }
    });
    
    transaction(messages);
    
    // Update chat's last_message_at and message_count
    await this.updateChatMetadata(chatId);
  }

  /**
   * Add a single message
   */
  async addMessage(chatId: string, message: DbMessage): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO messages (
        id, chat_id, role, content, name, tool_call_id, 
        tool_invocations, experimental_attachments, annotations, 
        parts, reasoning, finish_reason, usage_stats, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Handle createdAt conversion to ISO string for database storage
    let createdAtISO: string;
    if (message.createdAt instanceof Date) {
      createdAtISO = message.createdAt.toISOString();
    } else if (typeof message.createdAt === 'string') {
      // If it's already a string, validate it's a proper date
      const date = new Date(message.createdAt);
      createdAtISO = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } else {
      // Fallback to current time
      createdAtISO = new Date().toISOString();
    }
    
    stmt.run(
      message.id,
      chatId,
      message.role,
      message.content,
      message.name || null,
      message.toolCallId || null,
      message.toolInvocations || null,
      message.experimentalAttachments || null,
      message.annotations || null,
      message.parts || null,
      message.reasoning || null,
      message.finishReason || null,
      message.usageStats || null,
      createdAtISO
    );
    
    // Update chat's last_message_at and message_count
    await this.updateChatMetadata(chatId);
  }

  /**
   * Update the last message in a chat
   */
  async updateLastMessage(chatId: string, content: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE messages 
      SET content = ?
      WHERE chat_id = ? AND id = (
        SELECT id FROM messages 
        WHERE chat_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      )
    `);
    
    stmt.run(content, chatId, chatId);
  }

  /**
   * Get chat statistics
   */
  async getChatStats(chatId: string): Promise<{
    messageCount: number;
    lastMessageAt: Date | null;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as message_count,
        MAX(created_at) as last_message_at
      FROM messages
      WHERE chat_id = ?
    `);
    
    const result = stmt.get(chatId) as any;
    
    return {
      messageCount: result.message_count || 0,
      lastMessageAt: result.last_message_at ? new Date(result.last_message_at) : null
    };
  }

  /**
   * Search messages across all user chats
   */
  async searchMessages(userId: string, query: string, limit = 10): Promise<{
    chatId: string;
    chatTitle: string;
    message: DbMessage;
    snippet: string;
  }[]> {
    const stmt = this.db.prepare(`
      SELECT 
        m.id, m.chat_id, m.role, m.content, m.name, m.tool_call_id, 
        m.tool_invocations, m.experimental_attachments, m.annotations, m.created_at,
        c.title as chat_title
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE c.user_id = ? AND m.content LIKE ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    
    const searchPattern = `%${query}%`;
    const rows = stmt.all(userId, searchPattern, limit) as any[];
    
    return rows.map(row => ({
      chatId: row.chat_id,
      chatTitle: row.chat_title,
      message: {
        id: row.id,
        chatId: row.chat_id,
        role: row.role,
        content: row.content,
        name: row.name,
        toolCallId: row.tool_call_id,
        toolInvocations: row.tool_invocations,
        experimentalAttachments: row.experimental_attachments,
        annotations: row.annotations,
        createdAt: new Date(row.created_at)
      },
      snippet: this.createSnippet(row.content, query)
    }));
  }

  /**
   * Create a text snippet with highlighted search term
   */
  private createSnippet(content: string, query: string): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return content.slice(0, 100) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    
    return (start > 0 ? '...' : '') + 
           content.slice(start, end) + 
           (end < content.length ? '...' : '');
  }

  /**
   * Update chat metadata (message count and last message timestamp)
   */
  private async updateChatMetadata(chatId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE chats 
      SET 
        message_count = (SELECT COUNT(*) FROM messages WHERE chat_id = ?),
        last_message_at = (SELECT created_at FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1),
        updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(chatId, chatId, new Date().toISOString(), chatId);
  }
}
