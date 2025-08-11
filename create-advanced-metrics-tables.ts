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

async function createAdvancedMetricsTables() {
  console.log("Creating advanced metrics tables...");

  try {
    // Create user_sessions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        session_id TEXT NOT NULL UNIQUE,
        start_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_time TEXT,
        duration INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        is_active INTEGER NOT NULL DEFAULT 1
      )
    `);

    // Create api_metrics table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS api_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id),
        error_message TEXT
      )
    `);

    // Create feature_usage table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS feature_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        feature_name TEXT NOT NULL,
        usage_count INTEGER NOT NULL DEFAULT 1,
        first_used TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create revenue_events table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS revenue_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        event_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        plan_from TEXT,
        plan_to TEXT,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create customer_feedback table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS customer_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        score INTEGER NOT NULL,
        comment TEXT,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create support_tickets table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        subject TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'medium',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        first_response_at TEXT,
        resolved_at TEXT,
        closed_at TEXT
      )
    `);

    console.log("✅ Advanced metrics tables created successfully!");

    // Insert some sample data for demonstration
    console.log("Inserting sample data...");

    // Sample user sessions
    const sampleSessions = [
      { user_id: 1, session_id: 'sess_1', duration: 1800, is_active: 0 },
      { user_id: 2, session_id: 'sess_2', duration: 3600, is_active: 1 },
      { user_id: 3, session_id: 'sess_3', duration: 900, is_active: 0 },
    ];

    for (const session of sampleSessions) {
      try {
        sqlite.prepare(`
          INSERT OR IGNORE INTO user_sessions (user_id, session_id, duration, is_active)
          VALUES (?, ?, ?, ?)
        `).run(session.user_id, session.session_id, session.duration, session.is_active);
      } catch (error) {
        console.log(`Session already exists: ${session.session_id}`);
      }
    }

    // Sample API metrics
    const sampleApiMetrics = [
      { endpoint: '/api/users', method: 'GET', status_code: 200, response_time: 150 },
      { endpoint: '/api/workspaces', method: 'POST', status_code: 201, response_time: 300 },
      { endpoint: '/api/auth/login', method: 'POST', status_code: 500, response_time: 1000, error_message: 'Database connection failed' },
    ];

    for (const metric of sampleApiMetrics) {
      sqlite.prepare(`
        INSERT INTO api_metrics (endpoint, method, status_code, response_time, error_message)
        VALUES (?, ?, ?, ?, ?)
      `).run(metric.endpoint, metric.method, metric.status_code, metric.response_time, metric.error_message || null);
    }

    console.log("✅ Sample data inserted successfully!");

  } catch (error) {
    console.error("❌ Error creating advanced metrics tables:", error);
    throw error;
  } finally {
    sqlite.close();
  }
}

createAdvancedMetricsTables().catch(console.error);