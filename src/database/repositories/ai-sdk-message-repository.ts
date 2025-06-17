/**
 * AI SDK-aligned Message Repository
 * Optimized for Vercel AI SDK message patterns and efficient retrieval
 */

import { getDatabase } from '../index';
import type { DbMessage, CreateDbMessage } from '../types-ai-sdk';
import type { Message } from 'ai';
import { convertMessageToDb, convertDbToMessage } from '../types-ai-sdk';

export class AiSdkMessageRepository {
  private db = getDatabase();

  /**
   * Check if a message exists by ID
   */
  messageExists(messageId: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM messages WHERE id = ? LIMIT 1');
    const result = stmt.get(messageId);
    return !!result;
  }

  /**
   * Save a message (AI SDK pattern)
   * Used by AI SDK's onFinish callback
   */
  saveMessage(message: Message, chatId: string): DbMessage {
    const dbMessage = convertMessageToDb(message);
    dbMessage.chatId = chatId;

    // Check if message already exists to avoid unnecessary operations
    if (this.messageExists(message.id)) {
      console.log(`[PERSISTENCE] Message ${message.id} already exists, skipping save`);
      return dbMessage;
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages (
        id, chat_id, role, content, name, tool_call_id, tool_invocations,
        experimental_attachments, annotations, created_at, parts, reasoning,
        finish_reason, usage_stats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      dbMessage.id,
      dbMessage.chatId,
      dbMessage.role,
      dbMessage.content,
      dbMessage.name || null,
      dbMessage.toolCallId || null,
      dbMessage.toolInvocations || null,
      dbMessage.experimentalAttachments || null,
      dbMessage.annotations || null,
      dbMessage.createdAt instanceof Date ? dbMessage.createdAt.toISOString() : dbMessage.createdAt,
      dbMessage.parts || null,
      dbMessage.reasoning || null,
      dbMessage.finishReason || null,
      dbMessage.usageStats || null
    );

    return dbMessage;
  }

  /**
   * Get messages for a chat (AI SDK initialMessages pattern)
   * This is the primary method used by AI SDK's useChat hook
   */
  getMessagesByChatId(chatId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT 
        id, chat_id as chatId, role, content, name, tool_call_id as toolCallId,
        tool_invocations as toolInvocations, experimental_attachments as experimentalAttachments,
        annotations, created_at as createdAt, parts, reasoning, finish_reason as finishReason,
        usage_stats as usageStats
      FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(chatId) as DbMessage[];
    return rows.map(convertDbToMessage);
  }

  /**
   * Get paginated messages (for infinite scroll)
   */
  getMessagesPaginated(
    chatId: string, 
    limit: number = 50, 
    beforeMessageId?: string
  ): Message[] {
    let query = `
      SELECT 
        id, chat_id as chatId, role, content, name, tool_call_id as toolCallId,
        tool_invocations as toolInvocations, experimental_attachments as experimentalAttachments,
        annotations, created_at as createdAt, parts, reasoning, finish_reason as finishReason,
        usage_stats as usageStats
      FROM messages 
      WHERE chat_id = ?
    `;

    const params: any[] = [chatId];

    if (beforeMessageId) {
      query += ` AND created_at < (SELECT created_at FROM messages WHERE id = ?)`;
      params.push(beforeMessageId);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as DbMessage[];
    
    // Reverse to maintain chronological order
    return rows.reverse().map(convertDbToMessage);
  }

  /**
   * Get the latest message in a chat
   */
  getLatestMessage(chatId: string): Message | null {
    const stmt = this.db.prepare(`
      SELECT 
        id, chat_id as chatId, role, content, name, tool_call_id as toolCallId,
        tool_invocations as toolInvocations, experimental_attachments as experimentalAttachments,
        annotations, created_at as createdAt, parts, reasoning, finish_reason as finishReason,
        usage_stats as usageStats
      FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    const row = stmt.get(chatId) as DbMessage | undefined;
    return row ? convertDbToMessage(row) : null;
  }

  /**
   * Delete a specific message
   */
  deleteMessage(messageId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM messages WHERE id = ?');
    const result = stmt.run(messageId);
    return result.changes > 0;
  }

  /**
   * Delete all messages in a chat
   */
  deleteMessagesByChatId(chatId: string): number {
    const stmt = this.db.prepare('DELETE FROM messages WHERE chat_id = ?');
    const result = stmt.run(chatId);
    return result.changes;
  }

  /**
   * Count messages in a chat
   */
  getMessageCount(chatId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM messages WHERE chat_id = ?');
    const result = stmt.get(chatId) as { count: number };
    return result.count;
  }

  /**
   * Search messages by content
   */
  searchMessages(chatId: string, query: string, limit: number = 20): Message[] {
    const stmt = this.db.prepare(`
      SELECT 
        id, chat_id as chatId, role, content, name, tool_call_id as toolCallId,
        tool_invocations as toolInvocations, experimental_attachments as experimentalAttachments,
        annotations, created_at as createdAt, parts, reasoning, finish_reason as finishReason,
        usage_stats as usageStats
      FROM messages 
      WHERE chat_id = ? AND content LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const searchPattern = `%${query}%`;
    const rows = stmt.all(chatId, searchPattern, limit) as DbMessage[];
    return rows.map(convertDbToMessage);
  }

  /**
   * Search messages across all chats for a user
   */
  searchMessagesGlobally(userId: string, query: string, limit: number = 50): Array<{
    message: Message;
    chatId: string;
    chatTitle: string;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        m.id, m.chat_id as chatId, m.role, m.content, m.name, m.tool_call_id as toolCallId,
        m.tool_invocations as toolInvocations, m.experimental_attachments as experimentalAttachments,
        m.annotations, m.created_at as createdAt, m.parts, m.reasoning, 
        m.finish_reason as finishReason, m.usage_stats as usageStats,
        c.title as chatTitle
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE c.user_id = ? AND m.content LIKE ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `);

    const searchPattern = `%${query}%`;
    const rows = stmt.all(userId, searchPattern, limit) as (DbMessage & { chatTitle: string })[];
    
    return rows.map(row => ({
      message: convertDbToMessage(row),
      chatId: row.chatId,
      chatTitle: row.chatTitle || 'Untitled Chat'
    }));
  }

  /**
   * Get messages by role (useful for analytics)
   */
  getMessagesByRole(chatId: string, role: Message['role']): Message[] {
    const stmt = this.db.prepare(`
      SELECT 
        id, chat_id as chatId, role, content, name, tool_call_id as toolCallId,
        tool_invocations as toolInvocations, experimental_attachments as experimentalAttachments,
        annotations, created_at as createdAt, parts, reasoning, finish_reason as finishReason,
        usage_stats as usageStats
      FROM messages 
      WHERE chat_id = ? AND role = ?
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(chatId, role) as DbMessage[];
    return rows.map(convertDbToMessage);
  }

  /**
   * Get messages with tool calls (for debugging)
   */
  getMessagesWithToolCalls(chatId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT 
        id, chat_id as chatId, role, content, name, tool_call_id as toolCallId,
        tool_invocations as toolInvocations, experimental_attachments as experimentalAttachments,
        annotations, created_at as createdAt, parts, reasoning, finish_reason as finishReason,
        usage_stats as usageStats
      FROM messages 
      WHERE chat_id = ? AND tool_invocations IS NOT NULL
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(chatId) as DbMessage[];
    return rows.map(convertDbToMessage);
  }

  /**
   * Batch save messages (for bulk operations)
   */
  saveMessages(messages: Message[], chatId: string): DbMessage[] {
    // Filter out messages that already exist
    const newMessages = messages.filter(msg => !this.messageExists(msg.id));
    
    if (newMessages.length === 0) {
      console.log(`[PERSISTENCE] All ${messages.length} messages already exist, skipping batch save`);
      return messages.map(msg => {
        const dbMsg = convertMessageToDb(msg);
        dbMsg.chatId = chatId;
        return dbMsg;
      });
    }

    if (newMessages.length < messages.length) {
      console.log(`[PERSISTENCE] Saving ${newMessages.length} new messages out of ${messages.length} total`);
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages (
        id, chat_id, role, content, name, tool_call_id, tool_invocations,
        experimental_attachments, annotations, created_at, parts, reasoning,
        finish_reason, usage_stats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((messages: DbMessage[]) => {
      for (const message of messages) {
        stmt.run(
          message.id,
          message.chatId,
          message.role,
          message.content,
          message.name || null,
          message.toolCallId || null,
          message.toolInvocations || null,
          message.experimentalAttachments || null,
          message.annotations || null,
          message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
          message.parts || null,
          message.reasoning || null,
          message.finishReason || null,
          message.usageStats || null
        );
      }
    });

    const dbMessages = newMessages.map(msg => {
      const dbMsg = convertMessageToDb(msg);
      dbMsg.chatId = chatId;
      return dbMsg;
    });

    transaction(dbMessages);
    
    // Return all messages (including existing ones) for consistency
    return messages.map(msg => {
      const dbMsg = convertMessageToDb(msg);
      dbMsg.chatId = chatId;
      return dbMsg;
    });
  }

  /**
   * Update message content (for editing)
   */
  updateMessage(messageId: string, updates: Partial<Pick<DbMessage, 'content' | 'annotations'>>): boolean {
    const setParts: string[] = [];
    const values: any[] = [];
    
    if (updates.content !== undefined) {
      setParts.push('content = ?');
      values.push(updates.content);
    }
    
    if (updates.annotations !== undefined) {
      setParts.push('annotations = ?');
      values.push(updates.annotations);
    }
    
    if (setParts.length === 0) return false;
    
    values.push(messageId);
    
    const stmt = this.db.prepare(`
      UPDATE messages 
      SET ${setParts.join(', ')}
      WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    return result.changes > 0;
  }
}
