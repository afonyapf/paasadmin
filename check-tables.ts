import Database from 'better-sqlite3';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get database path from environment or use default
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
console.log(`Connecting to database at: ${dbPath}`);

// Create/connect to SQLite database
const sqlite = new Database(dbPath);

try {
  // Get list of tables
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  console.log('Tables in database:');
  tables.forEach((table: any) => {
    console.log(`- ${table.name}`);
  });
} catch (error) {
  console.error('Error checking tables:', error);
} finally {
  // Close database connection
  sqlite.close();
}