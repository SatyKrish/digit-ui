/**
 * User Repository for AI SDK
 * Manages user accounts primarily from Azure AD authentication
 */

import { getDatabase } from '../index';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUser {
  id: string;
  email: string;
  name: string;
}

export interface UpdateUser {
  email?: string;
  name?: string;
}

export class AiSdkUserRepository {
  private db = getDatabase();

  /**
   * Create or update user (upsert pattern for auth)
   */
  upsertUser(user: CreateUser): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(user.id, user.email, user.name);
    return this.getUserById(user.id)!;
  }

  /**
   * Get user by ID (primary lookup)
   */
  getUserById(id: string): User | null {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        email,
        name,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users 
      WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  /**
   * Get user by email (for auth lookups)
   */
  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        email,
        name,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users 
      WHERE email = ?
    `);

    const row = stmt.get(email) as any;
    if (!row) return null;

    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  /**
   * Update user information
   */
  updateUser(id: string, updates: UpdateUser): boolean {
    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.email !== undefined) {
      setParts.push('email = ?');
      values.push(updates.email);
    }

    if (updates.name !== undefined) {
      setParts.push('name = ?');
      values.push(updates.name);
    }

    if (setParts.length === 0) return false;

    setParts.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${setParts.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * Delete user and all associated data
   */
  deleteUser(id: string): boolean {
    // Due to CASCADE foreign keys, this will delete all chats and messages
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all users (admin function)
   */
  getAllUsers(): User[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        email,
        name,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  /**
   * Get user statistics
   */
  getUserStats(id: string): {
    chatCount: number;
    messageCount: number;
    lastActivityAt: Date | null;
  } | null {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(DISTINCT c.id) as chatCount,
        COUNT(m.id) as messageCount,
        MAX(m.created_at) as lastActivityAt
      FROM users u
      LEFT JOIN chats c ON u.id = c.user_id
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE u.id = ?
      GROUP BY u.id
    `);

    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      chatCount: row.chatCount || 0,
      messageCount: row.messageCount || 0,
      lastActivityAt: row.lastActivityAt ? new Date(row.lastActivityAt) : null
    };
  }

  /**
   * Check if user exists
   */
  userExists(id: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM users WHERE id = ?');
    return !!stmt.get(id);
  }

  /**
   * Search users by name or email (admin function)
   */
  searchUsers(query: string, limit: number = 50): User[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        email,
        name,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users 
      WHERE name LIKE ? OR email LIKE ?
      ORDER BY name
      LIMIT ?
    `);

    const searchPattern = `%${query}%`;
    const rows = stmt.all(searchPattern, searchPattern, limit) as any[];
    
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }
}
