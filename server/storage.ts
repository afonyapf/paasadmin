import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, count, like, and, or } from "drizzle-orm";
import {
  admins,
  users,
  workspaces,
  tariffs,
  templates,
  templateVersions,
  sections,
  globalTableSchemas,
  globalTableFields,
  templateSections,
  templateTableSchemas,
  customDomains,
  auditLogs,
  systemMetrics,
  type Admin,
  type User,
  type Workspace,
  type Tariff,
  type Template,
  type TemplateVersion,
  type Section,
  type GlobalTableSchema,
  type GlobalTableField,
  type TemplateSection,
  type TemplateTableSchema,
  type CustomDomain,
  type AuditLog,
  type SystemMetric,
  type InsertAdmin,
  type InsertUser,
  type InsertWorkspace,
  type InsertTariff,
  type InsertTemplate,
  type InsertTemplateVersion,
  type InsertSection,
  type InsertGlobalTableSchema,
  type InsertGlobalTableField,
  type InsertTemplateSection,
  type InsertTemplateTableSchema,
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
  
  // Template version methods
  getTemplateVersions(templateId: number): Promise<TemplateVersion[]>;
  createTemplateVersion(version: InsertTemplateVersion): Promise<TemplateVersion>;
  
  // Section methods
  getSections(options?: { search?: string; limit?: number; offset?: number }): Promise<{ sections: Section[]; total: number }>;
  getSectionById(id: number): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, section: Partial<InsertSection>): Promise<Section>;
  deleteSection(id: number): Promise<void>;
  
  // Global table schema methods
  getGlobalTableSchemas(options?: { type?: string; search?: string; limit?: number; offset?: number }): Promise<{ schemas: GlobalTableSchema[]; total: number }>;
  getGlobalTableSchemaById(id: number): Promise<GlobalTableSchema | undefined>;
  createGlobalTableSchema(schema: InsertGlobalTableSchema): Promise<GlobalTableSchema>;
  updateGlobalTableSchema(id: number, schema: Partial<InsertGlobalTableSchema>): Promise<GlobalTableSchema>;
  deleteGlobalTableSchema(id: number): Promise<void>;
  
  // Global table field methods
  getGlobalTableFields(schemaId: number): Promise<GlobalTableField[]>;
  createGlobalTableField(field: InsertGlobalTableField): Promise<GlobalTableField>;
  updateGlobalTableField(id: number, field: Partial<InsertGlobalTableField>): Promise<GlobalTableField>;
  deleteGlobalTableField(id: number): Promise<void>;
  
  // Template section methods
  getTemplateSections(templateId: number): Promise<TemplateSection[]>;
  updateTemplateSections(templateId: number, sections: InsertTemplateSection[]): Promise<void>;
  
  // Template table schema methods
  getTemplateTableSchemas(templateId: number): Promise<TemplateTableSchema[]>;
  updateTemplateTableSchemas(templateId: number, schemas: InsertTemplateTableSchema[]): Promise<void>;

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

  // Template version methods
  async getTemplateVersions(templateId: number): Promise<TemplateVersion[]> {
    return await db.select().from(templateVersions).where(eq(templateVersions.templateId, templateId)).orderBy(desc(templateVersions.createdAt));
  }

  async createTemplateVersion(version: InsertTemplateVersion): Promise<TemplateVersion> {
    const result = await db.insert(templateVersions).values(version).returning();
    return result[0];
  }

  // Section methods
  async getSections(options: { search?: string; limit?: number; offset?: number } = {}): Promise<{ sections: Section[]; total: number }> {
    const { search, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search) {
      whereClause = like(sections.name, `%${search}%`);
    }

    const [sectionResults, totalResults] = await Promise.all([
      db.select().from(sections).where(whereClause).limit(limit).offset(offset).orderBy(sections.name),
      db.select({ count: count() }).from(sections).where(whereClause),
    ]);

    return {
      sections: sectionResults,
      total: totalResults[0]?.count || 0,
    };
  }

  async getSectionById(id: number): Promise<Section | undefined> {
    const result = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
    return result[0];
  }

  async createSection(section: InsertSection): Promise<Section> {
    const result = await db.insert(sections).values(section).returning();
    return result[0];
  }

  async updateSection(id: number, section: Partial<InsertSection>): Promise<Section> {
    const result = await db.update(sections).set(section).where(eq(sections.id, id)).returning();
    return result[0];
  }

  async deleteSection(id: number): Promise<void> {
    await db.delete(sections).where(eq(sections.id, id));
  }

  // Global table schema methods
  async getGlobalTableSchemas(options: { type?: string; search?: string; limit?: number; offset?: number } = {}): Promise<{ schemas: GlobalTableSchema[]; total: number }> {
    const { type, search, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (type || search) {
      const conditions = [];
      if (type) {
        conditions.push(eq(globalTableSchemas.type, type));
      }
      if (search) {
        conditions.push(or(
          like(globalTableSchemas.name, `%${search}%`),
          like(globalTableSchemas.code, `%${search}%`)
        ));
      }
      whereClause = and(...conditions);
    }

    const [schemaResults, totalResults] = await Promise.all([
      db.select().from(globalTableSchemas).where(whereClause).limit(limit).offset(offset).orderBy(globalTableSchemas.name),
      db.select({ count: count() }).from(globalTableSchemas).where(whereClause),
    ]);

    return {
      schemas: schemaResults,
      total: totalResults[0]?.count || 0,
    };
  }

  async getGlobalTableSchemaById(id: number): Promise<GlobalTableSchema | undefined> {
    const result = await db.select().from(globalTableSchemas).where(eq(globalTableSchemas.id, id)).limit(1);
    return result[0];
  }

  async createGlobalTableSchema(schema: InsertGlobalTableSchema): Promise<GlobalTableSchema> {
    const result = await db.insert(globalTableSchemas).values(schema).returning();
    return result[0];
  }

  async updateGlobalTableSchema(id: number, schema: Partial<InsertGlobalTableSchema>): Promise<GlobalTableSchema> {
    const result = await db.update(globalTableSchemas).set(schema).where(eq(globalTableSchemas.id, id)).returning();
    return result[0];
  }

  async deleteGlobalTableSchema(id: number): Promise<void> {
    await db.delete(globalTableSchemas).where(eq(globalTableSchemas.id, id));
  }

  // Global table field methods
  async getGlobalTableFields(schemaId: number): Promise<GlobalTableField[]> {
    return await db.select().from(globalTableFields).where(eq(globalTableFields.schemaId, schemaId)).orderBy(globalTableFields.name);
  }

  async createGlobalTableField(field: InsertGlobalTableField): Promise<GlobalTableField> {
    const result = await db.insert(globalTableFields).values(field).returning();
    return result[0];
  }

  async updateGlobalTableField(id: number, field: Partial<InsertGlobalTableField>): Promise<GlobalTableField> {
    const result = await db.update(globalTableFields).set(field).where(eq(globalTableFields.id, id)).returning();
    return result[0];
  }

  async deleteGlobalTableField(id: number): Promise<void> {
    await db.delete(globalTableFields).where(eq(globalTableFields.id, id));
  }

  // Template section methods
  async getTemplateSections(templateId: number): Promise<TemplateSection[]> {
    return await db.select().from(templateSections).where(eq(templateSections.templateId, templateId));
  }

  async updateTemplateSections(templateId: number, sectionData: InsertTemplateSection[]): Promise<void> {
    // Delete existing sections
    await db.delete(templateSections).where(eq(templateSections.templateId, templateId));
    
    // Insert new sections
    if (sectionData.length > 0) {
      await db.insert(templateSections).values(sectionData);
    }
  }

  // Template table schema methods
  async getTemplateTableSchemas(templateId: number): Promise<TemplateTableSchema[]> {
    return await db.select().from(templateTableSchemas).where(eq(templateTableSchemas.templateId, templateId));
  }

  async updateTemplateTableSchemas(templateId: number, schemaData: InsertTemplateTableSchema[]): Promise<void> {
    // Delete existing schemas
    await db.delete(templateTableSchemas).where(eq(templateTableSchemas.templateId, templateId));
    
    // Insert new schemas
    if (schemaData.length > 0) {
      await db.insert(templateTableSchemas).values(schemaData);
    }
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
