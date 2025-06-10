import { getDatabase } from '../index';
import type { ChatMessage, CreateChatMessage } from '../types';

export class MessageRepository {
  private db = getDatabase();

  /**
   * Create a new message
   */
  createMessage(messageData: CreateChatMessage): ChatMessage {
    const stmt = this.db.prepare(`
      INSERT INTO chat_messages (id, session_id, role, content, model, is_error)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    return stmt.get(
      messageData.id,
      messageData.session_id,
      messageData.role,
      messageData.content,
      messageData.model,
      messageData.is_error || false
    ) as ChatMessage;
  }

  /**
   * Get message by ID
   */
  getMessageById(id: string): ChatMessage | null {
    const stmt = this.db.prepare('SELECT * FROM chat_messages WHERE id = ?');
    return stmt.get(id) as ChatMessage | null;
  }

  /**
   * Get messages for a session
   */
  getMessagesForSession(sessionId: string, limit = 100): ChatMessage[] {
    const stmt = this.db.prepare(`
      SELECT * FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC
      LIMIT ?
    `);

    return stmt.all(sessionId, limit) as ChatMessage[];
  }

  /**
   * Get recent messages for a session
   */
  getRecentMessagesForSession(sessionId: string, limit = 10): ChatMessage[] {
    const stmt = this.db.prepare(`
      SELECT * FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const messages = stmt.all(sessionId, limit) as ChatMessage[];
    return messages.reverse(); // Return in chronological order
  }

  /**
   * Delete message
   */
  deleteMessage(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM chat_messages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Delete all messages for a session
   */
  deleteAllMessagesForSession(sessionId: string): number {
    const stmt = this.db.prepare('DELETE FROM chat_messages WHERE session_id = ?');
    const result = stmt.run(sessionId);
    return result.changes;
  }

  /**
   * Get message count for session
   */
  getMessageCountForSession(sessionId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM chat_messages WHERE session_id = ?');
    const result = stmt.get(sessionId) as { count: number };
    return result.count;
  }

  /**
   * Get last message for session
   */
  getLastMessageForSession(sessionId: string): ChatMessage | null {
    const stmt = this.db.prepare(`
      SELECT * FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY created_at DESC
      LIMIT 1
    `);

    return stmt.get(sessionId) as ChatMessage | null;
  }

  /**
   * Update message content (for editing)
   */
  updateMessageContent(id: string, content: string): ChatMessage | null {
    const stmt = this.db.prepare(`
      UPDATE chat_messages 
      SET content = ?
      WHERE id = ?
      RETURNING *
    `);

    return stmt.get(content, id) as ChatMessage | null;
  }

  /**
   * Mark message as error
   */
  markMessageAsError(id: string): ChatMessage | null {
    const stmt = this.db.prepare(`
      UPDATE chat_messages 
      SET is_error = TRUE
      WHERE id = ?
      RETURNING *
    `);

    return stmt.get(id) as ChatMessage | null;
  }
}
