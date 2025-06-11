import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database connection singleton
let dbInstance: Database.Database | null = null;

/**
 * Database configuration
 */
export interface DatabaseConfig {
  path: string;
  maxConnections?: number;
  timeout?: number;
  verbose?: boolean;
}

/**
 * Get database configuration from environment
 */
function getDatabaseConfig(): DatabaseConfig {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'chat.db');
  
  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return {
    path: dbPath,
    timeout: parseInt(process.env.DATABASE_TIMEOUT || '30000'),
    verbose: process.env.NODE_ENV === 'development' && process.env.DATABASE_VERBOSE === 'true'
  };
}

/**
 * Initialize database connection
 */
export function initializeDatabase(): Database.Database {
  // Prevent database initialization in browser environment
  if (typeof window !== 'undefined') {
    throw new Error('Database cannot be initialized in browser environment');
  }

  if (dbInstance) {
    return dbInstance;
  }

  const config = getDatabaseConfig();
  
  try {
    dbInstance = new Database(config.path, {
      timeout: config.timeout,
      verbose: config.verbose ? console.log : undefined
    });

    // Enable WAL mode for better performance
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('foreign_keys = ON');

    // Run migrations
    runMigrations(dbInstance);

    console.log(`Database initialized at: ${config.path}`);
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
export function getDatabase(): Database.Database {
  // Prevent database access in browser environment
  if (typeof window !== 'undefined') {
    throw new Error('Database cannot be accessed in browser environment');
  }

  if (!dbInstance) {
    return initializeDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Run database migrations
 */
function runMigrations(db: Database.Database): void {
  // Create migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrations = [
    {
      name: '001_initial_schema',
      sql: `
        -- Users table (from Azure AD authentication)
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Chat sessions table
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        -- Chat messages table
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          model TEXT NOT NULL,
          is_error BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON chat_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON chat_sessions(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON chat_messages(created_at);
      `
    }
  ];

  // Check and run migrations
  const getMigration = db.prepare('SELECT name FROM migrations WHERE name = ?');
  const insertMigration = db.prepare('INSERT INTO migrations (name) VALUES (?)');

  for (const migration of migrations) {
    const exists = getMigration.get(migration.name);
    if (!exists) {
      console.log(`Running migration: ${migration.name}`);
      db.exec(migration.sql);
      insertMigration.run(migration.name);
      console.log(`Migration completed: ${migration.name}`);
    }
  }
}

// Handle cleanup on process exit
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
