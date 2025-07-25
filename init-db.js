import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database path from environment or use default
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
console.log(`Initializing database at: ${dbPath}`);

// Create/connect to SQLite database
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Run migrations
console.log('Running migrations...');
migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
console.log('Migrations completed successfully!');

// Close the database connection
sqlite.close();
console.log('Database initialized successfully!');