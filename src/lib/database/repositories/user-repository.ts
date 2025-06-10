import { getDatabase } from '../index';
import type { User, CreateUser } from '../types';

export class UserRepository {
  private db = getDatabase();

  /**
   * Create or update user (upsert)
   */
  upsertUser(userData: CreateUser): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `);

    return stmt.get(userData.id, userData.email, userData.name) as User;
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | null;
  }

  /**
   * Delete user and all related data
   */
  deleteUser(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all users (admin function)
   */
  getAllUsers(): User[] {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as User[];
  }
}
