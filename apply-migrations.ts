import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get database path from environment or use default
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
console.log(`Connecting to database at: ${dbPath}`);

// Create/connect to SQLite database
const sqlite = new Database(dbPath);

// Read migration SQL
const migrationPath = path.join(process.cwd(), 'migrations', '0000_conscious_santa_claus.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split SQL by statement-breakpoint
const statements = migrationSQL.split('--> statement-breakpoint');

console.log(`Applying migration with ${statements.length} statements...`);

// Begin transaction
sqlite.exec('BEGIN TRANSACTION;');

try {
  // Execute each statement
  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (trimmedStatement) {
      console.log(`Executing: ${trimmedStatement.substring(0, 60)}...`);
      sqlite.exec(trimmedStatement);
    }
  }
  
  // Commit transaction
  sqlite.exec('COMMIT;');
  console.log('Migration applied successfully!');
} catch (error) {
  // Rollback on error
  sqlite.exec('ROLLBACK;');
  console.error('Error applying migration:', error);
}

// Close database connection
sqlite.close();