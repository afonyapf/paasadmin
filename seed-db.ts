import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import * as schema from './shared/schema';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get database path from environment or use default
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
console.log(`Connecting to database at: ${dbPath}`);

// Create/connect to SQLite database
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Check if admins table exists
    try {
      const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'").all();
      if (tables.length === 0) {
        console.log('Creating admins table...');
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }
    } catch (error) {
      console.error('Error checking/creating admins table:', error);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      // Check if admin already exists
      const existingAdmin = await db.select().from(schema.admins).where(eq(schema.admins.username, 'admin'));
      
      if (existingAdmin.length === 0) {
        // Insert admin user
        const admin = {
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'admin'
        };
        
        await db.insert(schema.admins).values(admin);
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      
      // Try direct SQL if Drizzle fails
      try {
        sqlite.prepare(`
          INSERT OR IGNORE INTO admins (username, email, password, name, role)
          VALUES (?, ?, ?, ?, ?)
        `).run('admin', 'admin@example.com', hashedPassword, 'Admin User', 'admin');
        console.log('Admin user created using direct SQL');
      } catch (sqlError) {
        console.error('Error creating admin with direct SQL:', sqlError);
      }
    }

    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    sqlite.close();
  }
}

// Run the seeding function
seedDatabase();