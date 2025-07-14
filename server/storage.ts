import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, count, like, and, or } from "drizzle-orm";
import {
  admins,
  users,
  workspaces,
  tariffs,
  templates,
  customDomains,
  auditLogs,
  systemMetrics,
  type Admin,
  type User,
  type Workspace,
  type Tariff,
  type Template,
  type CustomDomain,
  type AuditLog,
  type SystemMetric,
  type InsertAdmin,
  type InsertUser,
  type InsertWorkspace,
  type InsertTariff,
  type InsertTemplate,
  type InsertCustomDomain,
  type InsertAuditLog,
  type InsertSystemMetric,
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // Admin methods
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // User methods
  getUsers(options?: { search?: string; status?: string; plan?: string; limit?: number; offset?: number }): Promise<{ users: User[]; total: number }>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getRecentUsers(limit?: number): Promise<User[]>;

  // Workspace methods
  getWorkspaces(options?: { search?: string; status?: string; limit?: number; offset?: number }): Promise<{ workspaces: Workspace[]; total: number }>;
  getWorkspaceById(id: number): Promise<Workspace | undefined>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: number, workspace: Partial<InsertWorkspace>): Promise<Workspace>;
  deleteWorkspace(id: number): Promise<void>;

  // Tariff methods
  getTariffs(): Promise<Tariff[]>;
  getTariffById(id: number): Promise<Tariff | undefined>;
  createTariff(tariff: InsertTariff): Promise<Tariff>;
  updateTariff(id: number, tariff: Partial<InsertTariff>): Promise<Tariff>;
  deleteTariff(id: number): Promise<void>;

  // Template methods
  getTemplates(): Promise<Template[]>;
  getTemplateById(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template>;
  deleteTemplate(id: number): Promise<void>;

  // Custom domain methods
  getCustomDomains(options?: { search?: string; limit?: number; offset?: number }): Promise<{ domains: CustomDomain[]; total: number }>;
  getCustomDomainById(id: number): Promise<CustomDomain | undefined>;
  createCustomDomain(domain: InsertCustomDomain): Promise<CustomDomain>;
  updateCustomDomain(id: number, domain: Partial<InsertCustomDomain>): Promise<CustomDomain>;
  deleteCustomDomain(id: number): Promise<void>;

  // Audit log methods
  getAuditLogs(options?: { limit?: number; offset?: number }): Promise<{ logs: AuditLog[]; total: number }>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getRecentActivity(limit?: number): Promise<AuditLog[]>;

  // System metrics methods
  getSystemMetrics(): Promise<SystemMetric[]>;
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  getDashboardStats(): Promise<{
    totalUsers: number;
    activeWorkspaces: number;
    totalRevenue: number;
    customDomains: number;
  }>;
}

export class DrizzleStorage implements IStorage {
  // Admin methods
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
    return result[0];
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    return result[0];
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins).values(admin).returning();
    return result[0];
  }

  // User methods
  async getUsers(options: { search?: string; status?: string; plan?: string; limit?: number; offset?: number } = {}): Promise<{ users: User[]; total: number }> {
    const { search, status, plan, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search || status || plan) {
      const conditions = [];
      if (search) {
        conditions.push(or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.username, `%${search}%`)
        ));
      }
      if (status) {
        conditions.push(eq(users.status, status));
      }
      if (plan) {
        conditions.push(eq(users.plan, plan));
      }
      whereClause = and(...conditions);
    }

    const [userResults, totalResults] = await Promise.all([
      db.select().from(users).where(whereClause).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
      db.select({ count: count() }).from(users).where(whereClause),
    ]);

    return {
      users: userResults,
      total: totalResults[0].count,
    };
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getRecentUsers(limit: number = 5): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
  }

  // Workspace methods
  async getWorkspaces(options: { search?: string; status?: string; limit?: number; offset?: number } = {}): Promise<{ workspaces: Workspace[]; total: number }> {
    const { search, status, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search || status) {
      const conditions = [];
      if (search) {
        conditions.push(or(
          like(workspaces.name, `%${search}%`),
          like(workspaces.description, `%${search}%`)
        ));
      }
      if (status) {
        conditions.push(eq(workspaces.status, status));
      }
      whereClause = and(...conditions);
    }

    const [workspaceResults, totalResults] = await Promise.all([
      db.select().from(workspaces).where(whereClause).limit(limit).offset(offset).orderBy(desc(workspaces.createdAt)),
      db.select({ count: count() }).from(workspaces).where(whereClause),
    ]);

    return {
      workspaces: workspaceResults,
      total: totalResults[0].count,
    };
  }

  async getWorkspaceById(id: number): Promise<Workspace | undefined> {
    const result = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return result[0];
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const result = await db.insert(workspaces).values(workspace).returning();
    return result[0];
  }

  async updateWorkspace(id: number, workspace: Partial<InsertWorkspace>): Promise<Workspace> {
    const result = await db.update(workspaces).set(workspace).where(eq(workspaces.id, id)).returning();
    return result[0];
  }

  async deleteWorkspace(id: number): Promise<void> {
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  // Tariff methods
  async getTariffs(): Promise<Tariff[]> {
    return await db.select().from(tariffs).orderBy(tariffs.price);
  }

  async getTariffById(id: number): Promise<Tariff | undefined> {
    const result = await db.select().from(tariffs).where(eq(tariffs.id, id)).limit(1);
    return result[0];
  }

  async createTariff(tariff: InsertTariff): Promise<Tariff> {
    const result = await db.insert(tariffs).values(tariff).returning();
    return result[0];
  }

  async updateTariff(id: number, tariff: Partial<InsertTariff>): Promise<Tariff> {
    const result = await db.update(tariffs).set(tariff).where(eq(tariffs.id, id)).returning();
    return result[0];
  }

  async deleteTariff(id: number): Promise<void> {
    await db.delete(tariffs).where(eq(tariffs.id, id));
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(templates.name);
  }

  async getTemplateById(id: number): Promise<Template | undefined> {
    const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
    return result[0];
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const result = await db.insert(templates).values(template).returning();
    return result[0];
  }

  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template> {
    const result = await db.update(templates).set(template).where(eq(templates.id, id)).returning();
    return result[0];
  }

  async deleteTemplate(id: number): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }

  // Custom domain methods
  async getCustomDomains(options: { search?: string; limit?: number; offset?: number } = {}): Promise<{ domains: CustomDomain[]; total: number }> {
    const { search, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search) {
      whereClause = like(customDomains.domain, `%${search}%`);
    }

    const [domainResults, totalResults] = await Promise.all([
      db.select().from(customDomains).where(whereClause).limit(limit).offset(offset).orderBy(desc(customDomains.createdAt)),
      db.select({ count: count() }).from(customDomains).where(whereClause),
    ]);

    return {
      domains: domainResults,
      total: totalResults[0].count,
    };
  }

  async getCustomDomainById(id: number): Promise<CustomDomain | undefined> {
    const result = await db.select().from(customDomains).where(eq(customDomains.id, id)).limit(1);
    return result[0];
  }

  async createCustomDomain(domain: InsertCustomDomain): Promise<CustomDomain> {
    const result = await db.insert(customDomains).values(domain).returning();
    return result[0];
  }

  async updateCustomDomain(id: number, domain: Partial<InsertCustomDomain>): Promise<CustomDomain> {
    const result = await db.update(customDomains).set(domain).where(eq(customDomains.id, id)).returning();
    return result[0];
  }

  async deleteCustomDomain(id: number): Promise<void> {
    await db.delete(customDomains).where(eq(customDomains.id, id));
  }

  // Audit log methods
  async getAuditLogs(options: { limit?: number; offset?: number } = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    const [logResults, totalResults] = await Promise.all([
      db.select().from(auditLogs).limit(limit).offset(offset).orderBy(desc(auditLogs.createdAt)),
      db.select({ count: count() }).from(auditLogs),
    ]);

    return {
      logs: logResults,
      total: totalResults[0].count,
    };
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getRecentActivity(limit: number = 10): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  // System metrics methods
  async getSystemMetrics(): Promise<SystemMetric[]> {
    return await db.select().from(systemMetrics).orderBy(desc(systemMetrics.date));
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> {
    const result = await db.insert(systemMetrics).values(metric).returning();
    return result[0];
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeWorkspaces: number;
    totalRevenue: number;
    customDomains: number;
  }> {
    const [totalUsersResult, activeWorkspacesResult, customDomainsResult] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(workspaces).where(eq(workspaces.status, 'active')),
      db.select({ count: count() }).from(customDomains),
    ]);

    // Calculate total revenue based on user plans
    const proUsersResult = await db.select({ count: count() }).from(users).where(eq(users.plan, 'pro'));
    const enterpriseUsersResult = await db.select({ count: count() }).from(users).where(eq(users.plan, 'enterprise'));
    
    const totalRevenue = (proUsersResult[0].count * 29) + (enterpriseUsersResult[0].count * 99);

    return {
      totalUsers: totalUsersResult[0].count,
      activeWorkspaces: activeWorkspacesResult[0].count,
      totalRevenue,
      customDomains: customDomainsResult[0].count,
    };
  }
}

export const storage = new DrizzleStorage();
