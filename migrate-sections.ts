import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
console.log(`Connecting to database at: ${dbPath}`);

const sqlite = new Database(dbPath);

async function migrateSections() {
  try {
    console.log('Adding new columns to sections table...');

    // Add applicability column
    sqlite.exec(`
      ALTER TABLE sections ADD COLUMN applicability TEXT DEFAULT 'local';
    `);

    // Add is_enabled column
    sqlite.exec(`
      ALTER TABLE sections ADD COLUMN is_enabled INTEGER DEFAULT 1;
    `);

    // Remove old status column if exists and rename to is_enabled
    try {
      sqlite.exec(`
        UPDATE sections SET is_enabled = status WHERE status IS NOT NULL;
      `);
    } catch (e) {
      // Column might not exist, ignore
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    sqlite.close();
  }
}

migrateSections();