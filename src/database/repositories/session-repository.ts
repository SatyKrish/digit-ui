import { getDatabase } from '../index';
import type { ChatSession, CreateChatSession, UpdateChatSession, SessionWithMessageCount } from '../types';

export class SessionRepository {
  private db = getDatabase();

  /**
   * Create a new chat session
   */
  createSession(sessionData: CreateChatSession): ChatSession {
    const stmt = this.db.prepare(`
      INSERT INTO chat_sessions (id, user_id, title)
      VALUES (?, ?, ?)
      RETURNING *
    `);

    return stmt.get(sessionData.id, sessionData.user_id, sessionData.title) as ChatSession;
  }

  /**
   * Get session by ID
   */
  getSessionById(id: string): ChatSession | null {
    const stmt = this.db.prepare('SELECT * FROM chat_sessions WHERE id = ?');
    return stmt.get(id) as ChatSession | null;
  }

  /**
   * Get sessions for a user with message count
   */
  getSessionsForUser(userId: string, limit = 50): SessionWithMessageCount[] {
    const stmt = this.db.prepare(`
      SELECT 
        s.*,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM chat_sessions s
      LEFT JOIN chat_messages m ON s.id = m.session_id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.updated_at DESC
      LIMIT ?
    `);

    return stmt.all(userId, limit) as SessionWithMessageCount[];
  }

  /**
   * Update session
   */
  updateSession(id: string, updates: UpdateChatSession): ChatSession | null {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = this.db.prepare(`
      UPDATE chat_sessions 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `);

    return stmt.get(...values, id) as ChatSession | null;
  }

  /**
   * Delete session and all its messages
   */
  deleteSession(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM chat_sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Delete all sessions for a user
   */
  deleteAllSessionsForUser(userId: string): number {
    const stmt = this.db.prepare('DELETE FROM chat_sessions WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }

  /**
   * Get session count for user
   */
  getSessionCountForUser(userId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = ?');
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  /**
   * Touch session (update timestamp)
   */
  touchSession(id: string): void {
    const stmt = this.db.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  }
}
