import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
dotenv.config();
import { eq, desc, count, like, and, or } from "drizzle-orm";

// Use the DATABASE_URL from .env
import path from 'path';
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
console.log(`Storage connecting to database at: ${absoluteDbPath}`);
const sqlite = new Database(absoluteDbPath, { verbose: console.log });
const db = drizzle(sqlite, { schema });

export interface IStorage {
  // Admin methods
  getAdminByUsername(username: string): Promise<schema.Admin | undefined>;
  getAdminById(id: number): Promise<schema.Admin | undefined>;
  createAdmin(admin: schema.InsertAdmin): Promise<schema.Admin>;

  // User methods
  getUsers(options?: { search?: string; status?: string; plan?: string; limit?: number; offset?: number }): Promise<{ users: schema.User[]; total: number }>;
  getUserById(id: number): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUser(id: number, user: Partial<schema.InsertUser>): Promise<schema.User>;
  deleteUser(id: number): Promise<void>;
  getRecentUsers(limit?: number): Promise<schema.User[]>;

  // Workspace methods
  getWorkspaces(options?: { search?: string; status?: string; limit?: number; offset?: number }): Promise<{ workspaces: schema.Workspace[]; total: number }>;
  getWorkspaceById(id: number): Promise<schema.Workspace | undefined>;
  createWorkspace(workspace: schema.InsertWorkspace): Promise<schema.Workspace>;
  updateWorkspace(id: number, workspace: Partial<schema.InsertWorkspace>): Promise<schema.Workspace>;
  deleteWorkspace(id: number): Promise<void>;

  // Tariff methods
  getTariffs(): Promise<schema.Tariff[]>;
  getTariffById(id: number): Promise<schema.Tariff | undefined>;
  createTariff(tariff: schema.InsertTariff): Promise<schema.Tariff>;
  updateTariff(id: number, tariff: Partial<schema.InsertTariff>): Promise<schema.Tariff>;
  deleteTariff(id: number): Promise<void>;

  // Template methods
  getTemplates(): Promise<schema.Template[]>;
  getTemplateById(id: number): Promise<schema.Template | undefined>;
  createTemplate(template: schema.InsertTemplate): Promise<schema.Template>;
  updateTemplate(id: number, template: Partial<schema.InsertTemplate>): Promise<schema.Template>;
  deleteTemplate(id: number): Promise<void>;
  
  // Template version methods
  getTemplateVersions(templateId: number): Promise<schema.TemplateVersion[]>;
  createTemplateVersion(version: schema.InsertTemplateVersion): Promise<schema.TemplateVersion>;
  
  // Section methods
  getSections(options?: { search?: string; limit?: number; offset?: number }): Promise<{ sections: schema.Section[]; total: number }>;
  getSectionById(id: number): Promise<schema.Section | undefined>;
  createSection(section: schema.InsertSection): Promise<schema.Section>;
  updateSection(id: number, section: Partial<schema.InsertSection>): Promise<schema.Section>;
  deleteSection(id: number): Promise<void>;
  
  // Global table schema methods
  getGlobalTableSchemas(options?: { type?: string; search?: string; limit?: number; offset?: number }): Promise<{ schemas: schema.GlobalTableSchema[]; total: number }>;
  getGlobalTableSchemaById(id: number): Promise<schema.GlobalTableSchema | undefined>;
  createGlobalTableSchema(schema: schema.InsertGlobalTableSchema): Promise<schema.GlobalTableSchema>;
  updateGlobalTableSchema(id: number, schema: Partial<schema.InsertGlobalTableSchema>): Promise<schema.GlobalTableSchema>;
  deleteGlobalTableSchema(id: number): Promise<void>;
  
  // Global table field methods
  getGlobalTableFields(schemaId: number): Promise<schema.GlobalTableField[]>;
  createGlobalTableField(field: schema.InsertGlobalTableField): Promise<schema.GlobalTableField>;
  updateGlobalTableField(id: number, field: Partial<schema.InsertGlobalTableField>): Promise<schema.GlobalTableField>;
  deleteGlobalTableField(id: number): Promise<void>;
  
  // Template section methods
  getTemplateSections(templateId: number): Promise<schema.TemplateSection[]>;
  updateTemplateSections(templateId: number, sections: schema.InsertTemplateSection[]): Promise<void>;
  
  // Template table schema methods
  getTemplateTableSchemas(templateId: number): Promise<schema.TemplateTableSchema[]>;
  updateTemplateTableSchemas(templateId: number, schemas: schema.InsertTemplateTableSchema[]): Promise<void>;

  // Custom domain methods
  getCustomDomains(options?: { search?: string; limit?: number; offset?: number }): Promise<{ domains: schema.CustomDomain[]; total: number }>;
  getCustomDomainById(id: number): Promise<schema.CustomDomain | undefined>;
  createCustomDomain(domain: schema.InsertCustomDomain): Promise<schema.CustomDomain>;
  updateCustomDomain(id: number, domain: Partial<schema.InsertCustomDomain>): Promise<schema.CustomDomain>;
  deleteCustomDomain(id: number): Promise<void>;

  // Audit log methods
  getAuditLogs(options?: { limit?: number; offset?: number }): Promise<{ logs: schema.AuditLog[]; total: number }>;
  createAuditLog(log: schema.InsertAuditLog): Promise<schema.AuditLog>;
  getRecentActivity(limit?: number): Promise<schema.AuditLog[]>;

  // System metrics methods
  getSystemMetrics(): Promise<schema.SystemMetric[]>;
  createSystemMetric(metric: schema.InsertSystemMetric): Promise<schema.SystemMetric>;
  getDashboardStats(): Promise<{
    totalUsers: number;
    activeWorkspaces: number;
    totalRevenue: number;
    customDomains: number;
  }>;
}

export class DrizzleStorage implements IStorage {
  // Admin methods
  async getAdminByUsername(username: string): Promise<schema.Admin | undefined> {
    const result = await db.select().from(schema.admins).where(eq(schema.admins.username, username)).limit(1);
    return result[0];
  }

  async getAdminById(id: number): Promise<schema.Admin | undefined> {
    const result = await db.select().from(schema.admins).where(eq(schema.admins.id, id)).limit(1);
    return result[0];
  }

  async createAdmin(admin: schema.InsertAdmin): Promise<schema.Admin> {
    const result = await db.insert(schema.admins).values(admin).returning();
    return result[0];
  }

  // User methods
  async getUsers(options: { search?: string; status?: string; plan?: string; limit?: number; offset?: number } = {}): Promise<{ users: schema.User[]; total: number }> {
    const { search, status, plan, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search || status || plan) {
      const conditions = [];
      if (search) {
        conditions.push(or(
          like(schema.users.name, `%${search}%`),
          like(schema.users.email, `%${search}%`),
          like(schema.users.username, `%${search}%`)
        ));
      }
      if (status) {
        conditions.push(eq(schema.users.status, status));
      }
      if (plan) {
        conditions.push(eq(schema.users.plan, plan));
      }
      whereClause = and(...conditions);
    }

    const [userResults, totalResults] = await Promise.all([
      db.select().from(schema.users).where(whereClause).limit(limit).offset(offset).orderBy(desc(schema.users.createdAt)),
      db.select({ count: count() }).from(schema.users).where(whereClause),
    ]);

    return {
      users: userResults,
      total: totalResults[0].count,
    };
  }

  async getUserById(id: number): Promise<schema.User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<schema.InsertUser>): Promise<schema.User> {
    const result = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async getRecentUsers(limit: number = 5): Promise<schema.User[]> {
    return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt)).limit(limit);
  }

  // Workspace methods
  async getWorkspaces(options: { search?: string; status?: string; limit?: number; offset?: number } = {}): Promise<{ workspaces: schema.Workspace[]; total: number }> {
    const { search, status, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search || status) {
      const conditions = [];
      if (search) {
        conditions.push(or(
          like(schema.workspaces.name, `%${search}%`),
          like(schema.workspaces.description, `%${search}%`)
        ));
      }
      if (status) {
        conditions.push(eq(schema.workspaces.status, status));
      }
      whereClause = and(...conditions);
    }

    const [workspaceResults, totalResults] = await Promise.all([
      db.select().from(schema.workspaces).where(whereClause).limit(limit).offset(offset).orderBy(desc(schema.workspaces.createdAt)),
      db.select({ count: count() }).from(schema.workspaces).where(whereClause),
    ]);

    return {
      workspaces: workspaceResults,
      total: totalResults[0].count,
    };
  }

  async getWorkspaceById(id: number): Promise<schema.Workspace | undefined> {
    const result = await db.select().from(schema.workspaces).where(eq(schema.workspaces.id, id)).limit(1);
    return result[0];
  }

  async createWorkspace(workspace: schema.InsertWorkspace): Promise<schema.Workspace> {
    const result = await db.insert(schema.workspaces).values(workspace).returning();
    return result[0];
  }

  async updateWorkspace(id: number, workspace: Partial<schema.InsertWorkspace>): Promise<schema.Workspace> {
    const result = await db.update(schema.workspaces).set(workspace).where(eq(schema.workspaces.id, id)).returning();
    return result[0];
  }

  async deleteWorkspace(id: number): Promise<void> {
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, id));
  }

  // Tariff methods
  async getTariffs(): Promise<schema.Tariff[]> {
    return await db.select().from(schema.tariffs).orderBy(schema.tariffs.price);
  }

  async getTariffById(id: number): Promise<schema.Tariff | undefined> {
    const result = await db.select().from(schema.tariffs).where(eq(schema.tariffs.id, id)).limit(1);
    return result[0];
  }

  async createTariff(tariff: schema.InsertTariff): Promise<schema.Tariff> {
    const result = await db.insert(schema.tariffs).values(tariff).returning();
    return result[0];
  }

  async updateTariff(id: number, tariff: Partial<schema.InsertTariff>): Promise<schema.Tariff> {
    const result = await db.update(schema.tariffs).set(tariff).where(eq(schema.tariffs.id, id)).returning();
    return result[0];
  }

  async deleteTariff(id: number): Promise<void> {
    await db.delete(schema.tariffs).where(eq(schema.tariffs.id, id));
  }

  // Template methods
  async getTemplates(): Promise<schema.Template[]> {
    return await db.select().from(schema.templates).orderBy(schema.templates.name);
  }

  async getTemplateById(id: number): Promise<schema.Template | undefined> {
    const result = await db.select().from(schema.templates).where(eq(schema.templates.id, id)).limit(1);
    return result[0];
  }

  async createTemplate(template: schema.InsertTemplate): Promise<schema.Template> {
    const result = await db.insert(schema.templates).values(template).returning();
    return result[0];
  }

  async updateTemplate(id: number, template: Partial<schema.InsertTemplate>): Promise<schema.Template> {
    const result = await db.update(schema.templates).set(template).where(eq(schema.templates.id, id)).returning();
    return result[0];
  }

  async deleteTemplate(id: number): Promise<void> {
    await db.delete(schema.templates).where(eq(schema.templates.id, id));
  }

  // Template version methods
  async getTemplateVersions(templateId: number): Promise<schema.TemplateVersion[]> {
    return await db.select().from(schema.templateVersions).where(eq(schema.templateVersions.templateId, templateId)).orderBy(desc(schema.templateVersions.createdAt));
  }

  async createTemplateVersion(version: schema.InsertTemplateVersion): Promise<schema.TemplateVersion> {
    const result = await db.insert(schema.templateVersions).values(version).returning();
    return result[0];
  }

  // Section methods
  async getSections(options: { search?: string; limit?: number; offset?: number } = {}): Promise<{ sections: schema.Section[]; total: number }> {
    const { search, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search) {
      whereClause = like(schema.sections.name, `%${search}%`);
    }

    const [sectionResults, totalResults] = await Promise.all([
      db.select().from(schema.sections).where(whereClause).limit(limit).offset(offset).orderBy(schema.sections.name),
      db.select({ count: count() }).from(schema.sections).where(whereClause),
    ]);

    return {
      sections: sectionResults,
      total: totalResults[0]?.count || 0,
    };
  }

  async getSectionById(id: number): Promise<schema.Section | undefined> {
    const result = await db.select().from(schema.sections).where(eq(schema.sections.id, id)).limit(1);
    return result[0];
  }

  async createSection(section: schema.InsertSection): Promise<schema.Section> {
    const result = await db.insert(schema.sections).values(section).returning();
    return result[0];
  }

  async updateSection(id: number, section: Partial<schema.InsertSection>): Promise<schema.Section> {
    const result = await db.update(schema.sections).set(section).where(eq(schema.sections.id, id)).returning();
    return result[0];
  }

  async deleteSection(id: number): Promise<void> {
    await db.delete(schema.sections).where(eq(schema.sections.id, id));
  }

  // Global table schema methods
  async getGlobalTableSchemas(options: { type?: string; search?: string; limit?: number; offset?: number } = {}): Promise<{ schemas: schema.GlobalTableSchema[]; total: number }> {
    const { type, search, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (type || search) {
      const conditions = [];
      if (type) {
        conditions.push(eq(schema.globalTableSchemas.type, type));
      }
      if (search) {
        conditions.push(or(
          like(schema.globalTableSchemas.name, `%${search}%`),
          like(schema.globalTableSchemas.code, `%${search}%`)
        ));
      }
      whereClause = and(...conditions);
    }

    const [schemaResults, totalResults] = await Promise.all([
      db.select().from(schema.globalTableSchemas).where(whereClause).limit(limit).offset(offset).orderBy(schema.globalTableSchemas.name),
      db.select({ count: count() }).from(schema.globalTableSchemas).where(whereClause),
    ]);

    return {
      schemas: schemaResults,
      total: totalResults[0]?.count || 0,
    };
  }

  async getGlobalTableSchemaById(id: number): Promise<schema.GlobalTableSchema | undefined> {
    const result = await db.select().from(schema.globalTableSchemas).where(eq(schema.globalTableSchemas.id, id)).limit(1);
    return result[0];
  }

  async createGlobalTableSchema(schema: schema.InsertGlobalTableSchema): Promise<schema.GlobalTableSchema> {
    const result = await db.insert(schema.globalTableSchemas).values(schema).returning();
    return result[0];
  }

  async updateGlobalTableSchema(id: number, schema: Partial<schema.InsertGlobalTableSchema>): Promise<schema.GlobalTableSchema> {
    const result = await db.update(schema.globalTableSchemas).set(schema).where(eq(schema.globalTableSchemas.id, id)).returning();
    return result[0];
  }

  async deleteGlobalTableSchema(id: number): Promise<void> {
    await db.delete(schema.globalTableSchemas).where(eq(schema.globalTableSchemas.id, id));
  }

  // Global table field methods
  async getGlobalTableFields(schemaId: number): Promise<schema.GlobalTableField[]> {
    return await db.select().from(schema.globalTableFields).where(eq(schema.globalTableFields.schemaId, schemaId)).orderBy(schema.globalTableFields.name);
  }

  async createGlobalTableField(field: schema.InsertGlobalTableField): Promise<schema.GlobalTableField> {
    const result = await db.insert(schema.globalTableFields).values(field).returning();
    return result[0];
  }

  async updateGlobalTableField(id: number, field: Partial<schema.InsertGlobalTableField>): Promise<schema.GlobalTableField> {
    const result = await db.update(schema.globalTableFields).set(field).where(eq(schema.globalTableFields.id, id)).returning();
    return result[0];
  }

  async deleteGlobalTableField(id: number): Promise<void> {
    await db.delete(schema.globalTableFields).where(eq(schema.globalTableFields.id, id));
  }

  // Template section methods
  async getTemplateSections(templateId: number): Promise<schema.TemplateSection[]> {
    return await db.select().from(schema.templateSections).where(eq(schema.templateSections.templateId, templateId));
  }

  async updateTemplateSections(templateId: number, sectionData: schema.InsertTemplateSection[]): Promise<void> {
    // Delete existing sections
    await db.delete(schema.templateSections).where(eq(schema.templateSections.templateId, templateId));
    
    // Insert new sections
    if (sectionData.length > 0) {
      await db.insert(schema.templateSections).values(sectionData);
    }
  }

  // Template table schema methods
  async getTemplateTableSchemas(templateId: number): Promise<schema.TemplateTableSchema[]> {
    return await db.select().from(schema.templateTableSchemas).where(eq(schema.templateTableSchemas.templateId, templateId));
  }

  async updateTemplateTableSchemas(templateId: number, schemaData: schema.InsertTemplateTableSchema[]): Promise<void> {
    // Delete existing schemas
    await db.delete(schema.templateTableSchemas).where(eq(schema.templateTableSchemas.templateId, templateId));
    
    // Insert new schemas
    if (schemaData.length > 0) {
      await db.insert(schema.templateTableSchemas).values(schemaData);
    }
  }

  // Custom domain methods
  async getCustomDomains(options: { search?: string; limit?: number; offset?: number } = {}): Promise<{ domains: schema.CustomDomain[]; total: number }> {
    const { search, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search) {
      whereClause = like(schema.customDomains.domain, `%${search}%`);
    }

    const [domainResults, totalResults] = await Promise.all([
      db.select().from(schema.customDomains).where(whereClause).limit(limit).offset(offset).orderBy(desc(schema.customDomains.createdAt)),
      db.select({ count: count() }).from(schema.customDomains).where(whereClause),
    ]);

    return {
      domains: domainResults,
      total: totalResults[0].count,
    };
  }

  async getCustomDomainById(id: number): Promise<schema.CustomDomain | undefined> {
    const result = await db.select().from(schema.customDomains).where(eq(schema.customDomains.id, id)).limit(1);
    return result[0];
  }

  async createCustomDomain(domain: schema.InsertCustomDomain): Promise<schema.CustomDomain> {
    const result = await db.insert(schema.customDomains).values(domain).returning();
    return result[0];
  }

  async updateCustomDomain(id: number, domain: Partial<schema.InsertCustomDomain>): Promise<schema.CustomDomain> {
    const result = await db.update(schema.customDomains).set(domain).where(eq(schema.customDomains.id, id)).returning();
    return result[0];
  }

  async deleteCustomDomain(id: number): Promise<void> {
    await db.delete(schema.customDomains).where(eq(schema.customDomains.id, id));
  }

  // Audit log methods
  async getAuditLogs(options: { limit?: number; offset?: number } = {}): Promise<{ logs: schema.AuditLog[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    const [logResults, totalResults] = await Promise.all([
      db.select().from(schema.auditLogs).limit(limit).offset(offset).orderBy(desc(schema.auditLogs.createdAt)),
      db.select({ count: count() }).from(schema.auditLogs),
    ]);

    return {
      logs: logResults,
      total: totalResults[0].count,
    };
  }

  async createAuditLog(log: schema.InsertAuditLog): Promise<schema.AuditLog> {
    const result = await db.insert(schema.auditLogs).values(log).returning();
    return result[0];
  }

  async getRecentActivity(limit: number = 10): Promise<schema.AuditLog[]> {
    return await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(limit);
  }

  // System metrics methods
  async getSystemMetrics(): Promise<schema.SystemMetric[]> {
    return await db.select().from(schema.systemMetrics).orderBy(desc(schema.systemMetrics.date));
  }

  async createSystemMetric(metric: schema.InsertSystemMetric): Promise<schema.SystemMetric> {
    const result = await db.insert(schema.systemMetrics).values(metric).returning();
    return result[0];
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeWorkspaces: number;
    totalRevenue: number;
    customDomains: number;
  }> {
    const [totalUsersResult, activeWorkspacesResult, customDomainsResult] = await Promise.all([
      db.select({ count: count() }).from(schema.users),
      db.select({ count: count() }).from(schema.workspaces).where(eq(schema.workspaces.status, 'active')),
      db.select({ count: count() }).from(schema.customDomains),
    ]);

    // Calculate total revenue based on user plans
    const proUsersResult = await db.select({ count: count() }).from(schema.users).where(eq(schema.users.plan, 'pro'));
    const enterpriseUsersResult = await db.select({ count: count() }).from(schema.users).where(eq(schema.users.plan, 'enterprise'));
    
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
