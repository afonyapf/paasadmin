import Database from 'better-sqlite3';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get database path from environment or use default
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
console.log(`Connecting to database at: ${dbPath}`);

// Create/connect to SQLite database
const sqlite = new Database(dbPath);

async function migrateTemplates() {
  try {
    console.log('Adding tables column to templates...');

    // Add tables column to templates table
    sqlite.exec(`
      ALTER TABLE templates ADD COLUMN tables TEXT DEFAULT '[]';
    `);

    // Add new columns to template_versions table
    sqlite.exec(`
      ALTER TABLE template_versions ADD COLUMN tables TEXT DEFAULT '[]';
    `);

    sqlite.exec(`
      ALTER TABLE template_versions ADD COLUMN diff TEXT;
    `);

    sqlite.exec(`
      ALTER TABLE template_versions ADD COLUMN is_applied INTEGER DEFAULT 0;
    `);

    sqlite.exec(`
      ALTER TABLE template_versions ADD COLUMN rollbackable INTEGER DEFAULT 1;
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    // Close the database connection
    sqlite.close();
  }
}

// Run the migration
migrateTemplates();