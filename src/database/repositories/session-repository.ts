import { getDatabase } from '../index';
import type { ChatSession, CreateChatSession, UpdateChatSession, SessionWithMessageCount } from '../types';

export class SessionRepository {
  private db: ReturnType<typeof getDatabase> | null = null;

  private getDb() {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  /**
   * Create a new chat session
   */
  createSession(sessionData: CreateChatSession): ChatSession {
    const stmt = this.getDb().prepare(`
      INSERT INTO chats (id, user_id, title)
      VALUES (?, ?, ?)
      RETURNING *
    `);

    return stmt.get(sessionData.id, sessionData.user_id, sessionData.title) as ChatSession;
  }

  /**
   * Get session by ID
   */
  getSessionById(id: string): ChatSession | null {
    const stmt = this.getDb().prepare('SELECT * FROM chats WHERE id = ?');
    return stmt.get(id) as ChatSession | null;
  }

  /**
   * Get sessions for a user with message count
   */
  getSessionsForUser(userId: string, limit = 50): SessionWithMessageCount[] {
    const stmt = this.getDb().prepare(`
      SELECT 
        s.*,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM chats s
      LEFT JOIN messages m ON s.id = m.chat_id
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
    
    const stmt = this.getDb().prepare(`
      UPDATE chats 
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
    const stmt = this.getDb().prepare('DELETE FROM chats WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Delete all sessions for a user
   */
  deleteAllSessionsForUser(userId: string): number {
    const stmt = this.getDb().prepare('DELETE FROM chats WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }

  /**
   * Get session count for user
   */
  getSessionCountForUser(userId: string): number {
    const stmt = this.getDb().prepare('SELECT COUNT(*) as count FROM chats WHERE user_id = ?');
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  /**
   * Touch session (update timestamp)
   */
  touchSession(id: string): void {
    const stmt = this.getDb().prepare('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  }
}
