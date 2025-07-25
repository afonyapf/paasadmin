import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
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

async function checkData() {
  try {
    // Check users
    const users = await db.select().from(schema.users);
    console.log(`Users count: ${users.length}`);
    
    // Check tariffs
    const tariffs = await db.select().from(schema.tariffs);
    console.log(`Tariffs count: ${tariffs.length}`);
    
    // Check templates
    const templates = await db.select().from(schema.templates);
    console.log(`Templates count: ${templates.length}`);
    
    // Check workspaces
    const workspaces = await db.select().from(schema.workspaces);
    console.log(`Workspaces count: ${workspaces.length}`);
    
    // Check domains
    const domains = await db.select().from(schema.customDomains);
    console.log(`Domains count: ${domains.length}`);
    
    // Check audit logs
    const auditLogs = await db.select().from(schema.auditLogs);
    console.log(`Audit logs count: ${auditLogs.length}`);
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    // Close the database connection
    sqlite.close();
  }
}

// Run the check function
checkData();