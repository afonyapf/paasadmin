import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./shared/schema";
import dotenv from "dotenv";
dotenv.config();

// Use the DATABASE_URL from .env
import path from 'path';
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
console.log(`Connecting to database at: ${absoluteDbPath}`);
const sqlite = new Database(absoluteDbPath);
const db = drizzle(sqlite, { schema });

async function createWorkspaceTables() {
  console.log("Creating workspace-related tables...");

  try {
    // Update workspaces table with new columns
    sqlite.exec(`
      ALTER TABLE workspaces ADD COLUMN slug TEXT;
      ALTER TABLE workspaces ADD COLUMN type TEXT DEFAULT 'client';
      ALTER TABLE workspaces ADD COLUMN tariff_id INTEGER REFERENCES tariffs(id);
      ALTER TABLE workspaces ADD COLUMN data_size INTEGER DEFAULT 0;
    `);

    // Create companies table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        website TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        logo TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create workspace_companies table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workspace_companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        company_id INTEGER NOT NULL REFERENCES companies(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create workspace_members table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        role TEXT NOT NULL DEFAULT 'viewer',
        status TEXT NOT NULL DEFAULT 'active',
        invited_by INTEGER REFERENCES users(id),
        invited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        joined_at TEXT
      )
    `);

    // Create workspace_backups table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workspace_backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        name TEXT NOT NULL,
        description TEXT,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
      )
    `);

    // Create workspace_access_control table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workspace_access_control (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        section_id INTEGER NOT NULL REFERENCES sections(id),
        is_enabled INTEGER NOT NULL DEFAULT 1,
        override_tariff INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create workspace_usage_metrics table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workspace_usage_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        metric_type TEXT NOT NULL,
        value INTEGER NOT NULL,
        date TEXT NOT NULL,
        metadata TEXT
      )
    `);

    console.log("✅ Workspace tables created successfully!");

    // Insert sample data
    console.log("Inserting sample data...");

    // Sample companies
    const sampleCompanies = [
      { name: 'Acme Corp', slug: 'acme-corp', description: 'Leading technology company', website: 'https://acme.com', email: 'contact@acme.com' },
      { name: 'TechStart Inc', slug: 'techstart-inc', description: 'Innovative startup', website: 'https://techstart.com', email: 'hello@techstart.com' },
      { name: 'Global Solutions', slug: 'global-solutions', description: 'Enterprise solutions provider', website: 'https://globalsolutions.com', email: 'info@globalsolutions.com' },
    ];

    for (const company of sampleCompanies) {
      try {
        sqlite.prepare(`
          INSERT OR IGNORE INTO companies (name, slug, description, website, email)
          VALUES (?, ?, ?, ?, ?)
        `).run(company.name, company.slug, company.description, company.website, company.email);
      } catch (error) {
        console.log(`Company already exists: ${company.slug}`);
      }
    }

    // Update existing workspaces with slugs
    const workspaces = sqlite.prepare('SELECT id, name FROM workspaces WHERE slug IS NULL').all();
    for (const workspace of workspaces) {
      const slug = workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      sqlite.prepare('UPDATE workspaces SET slug = ? WHERE id = ?').run(slug, workspace.id);
    }

    // Sample workspace members (assuming we have users with IDs 1, 2, 3)
    const sampleMembers = [
      { workspace_id: 1, user_id: 1, role: 'owner', status: 'active', invited_by: 1 },
      { workspace_id: 1, user_id: 2, role: 'admin', status: 'active', invited_by: 1 },
      { workspace_id: 2, user_id: 2, role: 'owner', status: 'active', invited_by: 2 },
    ];

    for (const member of sampleMembers) {
      try {
        sqlite.prepare(`
          INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, status, invited_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(member.workspace_id, member.user_id, member.role, member.status, member.invited_by);
      } catch (error) {
        console.log(`Member relationship already exists`);
      }
    }

    // Sample workspace companies associations
    const sampleAssociations = [
      { workspace_id: 1, company_id: 1 },
      { workspace_id: 1, company_id: 2 },
      { workspace_id: 2, company_id: 3 },
    ];

    for (const assoc of sampleAssociations) {
      try {
        sqlite.prepare(`
          INSERT OR IGNORE INTO workspace_companies (workspace_id, company_id)
          VALUES (?, ?)
        `).run(assoc.workspace_id, assoc.company_id);
      } catch (error) {
        console.log(`Association already exists`);
      }
    }

    console.log("✅ Sample data inserted successfully!");

  } catch (error) {
    console.error("❌ Error creating workspace tables:", error);
    throw error;
  } finally {
    sqlite.close();
  }
}

createWorkspaceTables().catch(console.error);