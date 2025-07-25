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

async function seedTestData() {
  try {
    console.log('Seeding test data...');

    // Create test users
    const users = [
      {
        username: 'user1',
        email: 'user1@example.com',
        name: 'Test User 1',
        avatar: 'https://ui-avatars.com/api/?name=Test+User+1',
        status: 'active',
        plan: 'free'
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        name: 'Test User 2',
        avatar: 'https://ui-avatars.com/api/?name=Test+User+2',
        status: 'active',
        plan: 'pro'
      },
      {
        username: 'user3',
        email: 'user3@example.com',
        name: 'Test User 3',
        avatar: 'https://ui-avatars.com/api/?name=Test+User+3',
        status: 'blocked',
        plan: 'enterprise'
      }
    ];

    for (const user of users) {
      try {
        const existingUser = await db.select().from(schema.users).where(eq(schema.users.username, user.username));
        
        if (existingUser.length === 0) {
          await db.insert(schema.users).values(user);
          console.log(`Created user: ${user.username}`);
        } else {
          console.log(`User ${user.username} already exists`);
        }
      } catch (error) {
        console.error(`Error creating user ${user.username}:`, error);
      }
    }

    // Create test tariffs
    const tariffs = [
      {
        name: 'Free',
        description: 'Basic features for small teams',
        price: 0,
        features: JSON.stringify(['1 workspace', 'Basic templates', 'Community support']),
        limits: JSON.stringify({ workspaces: 1, users: 3, storage: '1GB' })
      },
      {
        name: 'Pro',
        description: 'Advanced features for growing teams',
        price: 1999,
        features: JSON.stringify(['5 workspaces', 'All templates', 'Priority support', 'Custom domains']),
        limits: JSON.stringify({ workspaces: 5, users: 10, storage: '10GB' })
      },
      {
        name: 'Enterprise',
        description: 'Full features for large organizations',
        price: 4999,
        features: JSON.stringify(['Unlimited workspaces', 'All templates', 'Dedicated support', 'Custom domains', 'Advanced security']),
        limits: JSON.stringify({ workspaces: -1, users: -1, storage: '100GB' })
      }
    ];

    for (const tariff of tariffs) {
      try {
        const existingTariff = await db.select().from(schema.tariffs).where(eq(schema.tariffs.name, tariff.name));
        
        if (existingTariff.length === 0) {
          await db.insert(schema.tariffs).values(tariff);
          console.log(`Created tariff: ${tariff.name}`);
        } else {
          console.log(`Tariff ${tariff.name} already exists`);
        }
      } catch (error) {
        console.error(`Error creating tariff ${tariff.name}:`, error);
      }
    }

    // Create test templates
    const templates = [
      {
        name: 'Basic CRM',
        description: 'Simple CRM template for small businesses',
        type: 'client',
        version: '1.0',
        isActive: true,
        isDefault: true,
        config: JSON.stringify({
          modules: ['contacts', 'deals', 'tasks'],
          layout: 'sidebar',
          theme: 'light'
        }),
        tariffId: 1
      },
      {
        name: 'Advanced CRM',
        description: 'Full-featured CRM with analytics',
        type: 'client',
        version: '1.0',
        isActive: true,
        isDefault: false,
        config: JSON.stringify({
          modules: ['contacts', 'deals', 'tasks', 'analytics', 'reports'],
          layout: 'dashboard',
          theme: 'custom'
        }),
        tariffId: 2
      },
      {
        name: 'Supplier Portal',
        description: 'Template for managing suppliers',
        type: 'supplier',
        version: '1.0',
        isActive: true,
        isDefault: false,
        config: JSON.stringify({
          modules: ['suppliers', 'orders', 'inventory', 'payments'],
          layout: 'tabs',
          theme: 'dark'
        }),
        tariffId: 3
      }
    ];

    for (const template of templates) {
      try {
        const existingTemplate = await db.select().from(schema.templates).where(eq(schema.templates.name, template.name));
        
        if (existingTemplate.length === 0) {
          await db.insert(schema.templates).values(template);
          console.log(`Created template: ${template.name}`);
        } else {
          console.log(`Template ${template.name} already exists`);
        }
      } catch (error) {
        console.error(`Error creating template ${template.name}:`, error);
      }
    }

    // Create test workspaces
    const workspaces = [
      {
        name: 'Marketing Team',
        description: 'Workspace for marketing activities',
        ownerId: 1,
        status: 'active',
        templateId: 1,
        settings: JSON.stringify({
          theme: 'light',
          notifications: true,
          language: 'en'
        })
      },
      {
        name: 'Sales Department',
        description: 'Workspace for sales team',
        ownerId: 2,
        status: 'active',
        templateId: 2,
        settings: JSON.stringify({
          theme: 'dark',
          notifications: true,
          language: 'en'
        })
      },
      {
        name: 'Supplier Management',
        description: 'Workspace for managing suppliers',
        ownerId: 3,
        status: 'active',
        templateId: 3,
        settings: JSON.stringify({
          theme: 'light',
          notifications: false,
          language: 'en'
        })
      }
    ];

    for (const workspace of workspaces) {
      try {
        const existingWorkspace = await db.select().from(schema.workspaces).where(eq(schema.workspaces.name, workspace.name));
        
        if (existingWorkspace.length === 0) {
          await db.insert(schema.workspaces).values(workspace);
          console.log(`Created workspace: ${workspace.name}`);
        } else {
          console.log(`Workspace ${workspace.name} already exists`);
        }
      } catch (error) {
        console.error(`Error creating workspace ${workspace.name}:`, error);
      }
    }

    // Create test custom domains
    const domains = [
      {
        domain: 'marketing.example.com',
        workspaceId: 1,
        sslStatus: 'active',
        verificationStatus: 'verified'
      },
      {
        domain: 'sales.example.com',
        workspaceId: 2,
        sslStatus: 'active',
        verificationStatus: 'verified'
      },
      {
        domain: 'suppliers.example.com',
        workspaceId: 3,
        sslStatus: 'pending',
        verificationStatus: 'pending'
      }
    ];

    for (const domain of domains) {
      try {
        const existingDomain = await db.select().from(schema.customDomains).where(eq(schema.customDomains.domain, domain.domain));
        
        if (existingDomain.length === 0) {
          await db.insert(schema.customDomains).values(domain);
          console.log(`Created domain: ${domain.domain}`);
        } else {
          console.log(`Domain ${domain.domain} already exists`);
        }
      } catch (error) {
        console.error(`Error creating domain ${domain.domain}:`, error);
      }
    }

    // Create test audit logs
    const auditLogs = [
      {
        action: 'login',
        resourceType: 'admin',
        resourceId: 1,
        adminId: 1,
        details: JSON.stringify({ ip: '192.168.1.1', browser: 'Chrome' }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110'
      },
      {
        action: 'create',
        resourceType: 'workspace',
        resourceId: 1,
        adminId: 1,
        details: JSON.stringify({ name: 'Marketing Team' }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110'
      },
      {
        action: 'update',
        resourceType: 'user',
        resourceId: 2,
        adminId: 1,
        details: JSON.stringify({ status: 'active', plan: 'pro' }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110'
      }
    ];

    for (const log of auditLogs) {
      try {
        await db.insert(schema.auditLogs).values(log);
        console.log(`Created audit log: ${log.action} ${log.resourceType}`);
      } catch (error) {
        console.error(`Error creating audit log:`, error);
      }
    }

    console.log('Test data seeding completed!');
  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    // Close the database connection
    sqlite.close();
  }
}

// Run the seeding function
seedTestData();