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
  // Check if admins table exists
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'").all();
  
  if (tables.length === 0) {
    console.log('Admins table does not exist!');
  } else {
    console.log('Admins table exists, checking records...');
    
    // Get all admins
    const admins = sqlite.prepare("SELECT * FROM admins").all();
    console.log(`Found ${admins.length} admin records:`);
    console.log(JSON.stringify(admins, null, 2));
  }
} catch (error) {
  console.error('Error checking admins table:', error);
} finally {
  // Close database connection
  sqlite.close();
}