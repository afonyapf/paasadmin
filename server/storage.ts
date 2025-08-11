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
  getWorkspaces(options?: { search?: string; status?: string; type?: string; tariffId?: number; ownerId?: number; limit?: number; offset?: number }): Promise<{ workspaces: any[]; total: number }>;
  getWorkspaceById(id: number): Promise<any | undefined>;
  createWorkspace(workspace: schema.InsertWorkspace): Promise<schema.Workspace>;
  updateWorkspace(id: number, workspace: Partial<schema.InsertWorkspace>): Promise<schema.Workspace>;
  deleteWorkspace(id: number): Promise<void>;
  archiveWorkspace(id: number): Promise<schema.Workspace>;
  cloneWorkspace(id: number, newName: string, newSlug: string): Promise<schema.Workspace>;
  createWorkspaceBackup(workspaceId: number, createdBy: number, name?: string): Promise<schema.WorkspaceBackup>;
  getWorkspaceBackups(workspaceId: number): Promise<schema.WorkspaceBackup[]>;
  
  // Company methods
  getCompanies(options?: { search?: string; limit?: number; offset?: number }): Promise<{ companies: schema.Company[]; total: number }>;
  getCompanyById(id: number): Promise<schema.Company | undefined>;
  createCompany(company: schema.InsertCompany): Promise<schema.Company>;
  updateCompany(id: number, company: Partial<schema.InsertCompany>): Promise<schema.Company>;
  deleteCompany(id: number): Promise<void>;
  
  // Workspace company methods
  getWorkspaceCompanies(workspaceId: number): Promise<schema.Company[]>;
  updateWorkspaceCompanies(workspaceId: number, companyIds: number[]): Promise<void>;
  
  // Workspace member methods
  getWorkspaceMembers(workspaceId: number): Promise<any[]>;
  addWorkspaceMember(member: schema.InsertWorkspaceMember): Promise<schema.WorkspaceMember>;
  updateWorkspaceMember(id: number, member: Partial<schema.InsertWorkspaceMember>): Promise<schema.WorkspaceMember>;
  removeWorkspaceMember(id: number): Promise<void>;
  
  // Workspace access control methods
  getWorkspaceAccessControl(workspaceId: number): Promise<schema.WorkspaceAccessControl[]>;
  updateWorkspaceAccessControl(workspaceId: number, accessRules: schema.InsertWorkspaceAccessControl[]): Promise<void>;
  
  // Workspace usage metrics methods
  getWorkspaceUsageMetrics(workspaceId: number, metricType?: string): Promise<schema.WorkspaceUsageMetric[]>;
  createWorkspaceUsageMetric(metric: schema.InsertWorkspaceUsageMetric): Promise<schema.WorkspaceUsageMetric>;

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
  
  // Advanced dashboard metrics
  getAdvancedDashboardStats(): Promise<{
    activeUsers: number;
    avgSessionDuration: number;
    dau: number;
    mau: number;
    dailyRegistrations: number;
    dailyWorkspaces: number;
    featureAdoption: number;
    errorRate5xx: number;
    avgApiResponseTime: number;
    apiRequestsPerMinute: number;
    mrr: number;
    arr: number;
    churnRate: number;
    nrr: number;
    cac: number;
    ltv: number;
    ttv: number;
    signupToActivation: number;
    activationToPaid: number;
    csat: number;
    nps: number;
    firstResponseTime: number;
    resolutionTime: number;
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
  async getWorkspaces(options: { search?: string; status?: string; type?: string; tariffId?: number; ownerId?: number; limit?: number; offset?: number } = {}): Promise<{ workspaces: any[]; total: number }> {
    const { search, status, type, tariffId, ownerId, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search || status || type || tariffId || ownerId) {
      const conditions = [];
      if (search) {
        conditions.push(or(
          like(schema.workspaces.name, `%${search}%`),
          like(schema.workspaces.slug, `%${search}%`),
          like(schema.workspaces.description, `%${search}%`)
        ));
      }
      if (status) {
        conditions.push(eq(schema.workspaces.status, status));
      }
      if (type) {
        conditions.push(eq(schema.workspaces.type, type));
      }
      if (tariffId) {
        conditions.push(eq(schema.workspaces.tariffId, tariffId));
      }
      if (ownerId) {
        conditions.push(eq(schema.workspaces.ownerId, ownerId));
      }
      whereClause = and(...conditions);
    }

    const [workspaceResults, totalResults] = await Promise.all([
      db.select({
        id: schema.workspaces.id,
        name: schema.workspaces.name,
        slug: schema.workspaces.slug,
        description: schema.workspaces.description,
        ownerId: schema.workspaces.ownerId,
        status: schema.workspaces.status,
        type: schema.workspaces.type,
        templateId: schema.workspaces.templateId,
        tariffId: schema.workspaces.tariffId,
        dataSize: schema.workspaces.dataSize,
        createdAt: schema.workspaces.createdAt,
        updatedAt: schema.workspaces.updatedAt,
        ownerName: schema.users.name,
        ownerEmail: schema.users.email,
        tariffName: schema.tariffs.name,
      })
      .from(schema.workspaces)
      .leftJoin(schema.users, eq(schema.workspaces.ownerId, schema.users.id))
      .leftJoin(schema.tariffs, eq(schema.workspaces.tariffId, schema.tariffs.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.workspaces.createdAt)),
      db.select({ count: count() }).from(schema.workspaces).where(whereClause),
    ]);

    return {
      workspaces: workspaceResults,
      total: totalResults[0].count,
    };
  }

  async getWorkspaceById(id: number): Promise<any | undefined> {
    const result = await db.select({
      id: schema.workspaces.id,
      name: schema.workspaces.name,
      slug: schema.workspaces.slug,
      description: schema.workspaces.description,
      ownerId: schema.workspaces.ownerId,
      status: schema.workspaces.status,
      type: schema.workspaces.type,
      templateId: schema.workspaces.templateId,
      tariffId: schema.workspaces.tariffId,
      settings: schema.workspaces.settings,
      dataSize: schema.workspaces.dataSize,
      createdAt: schema.workspaces.createdAt,
      updatedAt: schema.workspaces.updatedAt,
      ownerName: schema.users.name,
      ownerEmail: schema.users.email,
      tariffName: schema.tariffs.name,
    })
    .from(schema.workspaces)
    .leftJoin(schema.users, eq(schema.workspaces.ownerId, schema.users.id))
    .leftJoin(schema.tariffs, eq(schema.workspaces.tariffId, schema.tariffs.id))
    .where(eq(schema.workspaces.id, id))
    .limit(1);
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
  
  async archiveWorkspace(id: number): Promise<schema.Workspace> {
    const result = await db.update(schema.workspaces)
      .set({ status: 'archived', updatedAt: new Date().toISOString() })
      .where(eq(schema.workspaces.id, id))
      .returning();
    return result[0];
  }
  
  async cloneWorkspace(id: number, newName: string, newSlug: string): Promise<schema.Workspace> {
    const original = await this.getWorkspaceById(id);
    if (!original) throw new Error('Workspace not found');
    
    const cloned = await db.insert(schema.workspaces).values({
      name: newName,
      slug: newSlug,
      description: `Clone of ${original.name}`,
      ownerId: original.ownerId,
      status: 'active',
      type: original.type,
      templateId: original.templateId,
      tariffId: original.tariffId,
      settings: original.settings,
    }).returning();
    
    return cloned[0];
  }
  
  async createWorkspaceBackup(workspaceId: number, createdBy: number, name?: string): Promise<schema.WorkspaceBackup> {
    const workspace = await this.getWorkspaceById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');
    
    const backupName = name || `Backup of ${workspace.name} - ${new Date().toISOString()}`;
    const filePath = `backups/workspace_${workspaceId}_${Date.now()}.sql`;
    
    const result = await db.insert(schema.workspaceBackups).values({
      workspaceId,
      name: backupName,
      filePath,
      status: 'pending',
      createdBy,
    }).returning();
    
    return result[0];
  }
  
  async getWorkspaceBackups(workspaceId: number): Promise<schema.WorkspaceBackup[]> {
    return await db.select().from(schema.workspaceBackups)
      .where(eq(schema.workspaceBackups.workspaceId, workspaceId))
      .orderBy(desc(schema.workspaceBackups.createdAt));
  }
  
  // Company methods
  async getCompanies(options: { search?: string; limit?: number; offset?: number } = {}): Promise<{ companies: schema.Company[]; total: number }> {
    const { search, limit = 10, offset = 0 } = options;
    
    let whereClause = undefined;
    if (search) {
      whereClause = or(
        like(schema.companies.name, `%${search}%`),
        like(schema.companies.slug, `%${search}%`)
      );
    }

    const [companyResults, totalResults] = await Promise.all([
      db.select().from(schema.companies).where(whereClause).limit(limit).offset(offset).orderBy(schema.companies.name),
      db.select({ count: count() }).from(schema.companies).where(whereClause),
    ]);

    return {
      companies: companyResults,
      total: totalResults[0].count,
    };
  }
  
  async getCompanyById(id: number): Promise<schema.Company | undefined> {
    const result = await db.select().from(schema.companies).where(eq(schema.companies.id, id)).limit(1);
    return result[0];
  }
  
  async createCompany(company: schema.InsertCompany): Promise<schema.Company> {
    const result = await db.insert(schema.companies).values(company).returning();
    return result[0];
  }
  
  async updateCompany(id: number, company: Partial<schema.InsertCompany>): Promise<schema.Company> {
    const result = await db.update(schema.companies)
      .set({ ...company, updatedAt: new Date().toISOString() })
      .where(eq(schema.companies.id, id))
      .returning();
    return result[0];
  }
  
  async deleteCompany(id: number): Promise<void> {
    await db.delete(schema.companies).where(eq(schema.companies.id, id));
  }
  
  // Workspace company methods
  async getWorkspaceCompanies(workspaceId: number): Promise<schema.Company[]> {
    const result = await db.select({
      id: schema.companies.id,
      name: schema.companies.name,
      slug: schema.companies.slug,
      description: schema.companies.description,
      website: schema.companies.website,
      email: schema.companies.email,
      phone: schema.companies.phone,
      address: schema.companies.address,
      logo: schema.companies.logo,
      status: schema.companies.status,
      createdAt: schema.companies.createdAt,
      updatedAt: schema.companies.updatedAt,
    })
    .from(schema.workspaceCompanies)
    .innerJoin(schema.companies, eq(schema.workspaceCompanies.companyId, schema.companies.id))
    .where(eq(schema.workspaceCompanies.workspaceId, workspaceId));
    
    return result;
  }
  
  async updateWorkspaceCompanies(workspaceId: number, companyIds: number[]): Promise<void> {
    // Delete existing associations
    await db.delete(schema.workspaceCompanies).where(eq(schema.workspaceCompanies.workspaceId, workspaceId));
    
    // Insert new associations
    if (companyIds.length > 0) {
      const associations = companyIds.map(companyId => ({ workspaceId, companyId }));
      await db.insert(schema.workspaceCompanies).values(associations);
    }
  }
  
  // Workspace member methods
  async getWorkspaceMembers(workspaceId: number): Promise<any[]> {
    const result = await db.select({
      id: schema.workspaceMembers.id,
      workspaceId: schema.workspaceMembers.workspaceId,
      userId: schema.workspaceMembers.userId,
      role: schema.workspaceMembers.role,
      status: schema.workspaceMembers.status,
      invitedBy: schema.workspaceMembers.invitedBy,
      invitedAt: schema.workspaceMembers.invitedAt,
      joinedAt: schema.workspaceMembers.joinedAt,
      userName: schema.users.name,
      userEmail: schema.users.email,
      inviterName: schema.users.name,
    })
    .from(schema.workspaceMembers)
    .innerJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id))
    .leftJoin(schema.users, eq(schema.workspaceMembers.invitedBy, schema.users.id))
    .where(eq(schema.workspaceMembers.workspaceId, workspaceId));
    
    return result;
  }
  
  async addWorkspaceMember(member: schema.InsertWorkspaceMember): Promise<schema.WorkspaceMember> {
    const result = await db.insert(schema.workspaceMembers).values(member).returning();
    return result[0];
  }
  
  async updateWorkspaceMember(id: number, member: Partial<schema.InsertWorkspaceMember>): Promise<schema.WorkspaceMember> {
    const result = await db.update(schema.workspaceMembers)
      .set(member)
      .where(eq(schema.workspaceMembers.id, id))
      .returning();
    return result[0];
  }
  
  async removeWorkspaceMember(id: number): Promise<void> {
    await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.id, id));
  }
  
  // Workspace access control methods
  async getWorkspaceAccessControl(workspaceId: number): Promise<schema.WorkspaceAccessControl[]> {
    return await db.select().from(schema.workspaceAccessControl)
      .where(eq(schema.workspaceAccessControl.workspaceId, workspaceId));
  }
  
  async updateWorkspaceAccessControl(workspaceId: number, accessRules: schema.InsertWorkspaceAccessControl[]): Promise<void> {
    // Delete existing rules
    await db.delete(schema.workspaceAccessControl).where(eq(schema.workspaceAccessControl.workspaceId, workspaceId));
    
    // Insert new rules
    if (accessRules.length > 0) {
      await db.insert(schema.workspaceAccessControl).values(accessRules);
    }
  }
  
  // Workspace usage metrics methods
  async getWorkspaceUsageMetrics(workspaceId: number, metricType?: string): Promise<schema.WorkspaceUsageMetric[]> {
    let whereClause = eq(schema.workspaceUsageMetrics.workspaceId, workspaceId);
    if (metricType) {
      whereClause = and(whereClause, eq(schema.workspaceUsageMetrics.metricType, metricType));
    }
    
    return await db.select().from(schema.workspaceUsageMetrics)
      .where(whereClause)
      .orderBy(desc(schema.workspaceUsageMetrics.date));
  }
  
  async createWorkspaceUsageMetric(metric: schema.InsertWorkspaceUsageMetric): Promise<schema.WorkspaceUsageMetric> {
    const result = await db.insert(schema.workspaceUsageMetrics).values(metric).returning();
    return result[0];
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

  async createGlobalTableSchema(tableSchemaData: schema.InsertGlobalTableSchema): Promise<schema.GlobalTableSchema> {
    const result = await db.insert(schema.globalTableSchemas).values(tableSchemaData).returning();
    return result[0];
  }

  async updateGlobalTableSchema(id: number, tableSchemaData: Partial<schema.InsertGlobalTableSchema>): Promise<schema.GlobalTableSchema> {
    const result = await db.update(schema.globalTableSchemas).set(tableSchemaData).where(eq(schema.globalTableSchemas.id, id)).returning();
    return result[0];
  }

  async deleteGlobalTableSchema(id: number): Promise<void> {
    // Delete fields first
    await db.delete(schema.globalTableFields).where(eq(schema.globalTableFields.schemaId, id));
    // Then delete table schema
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
  
  async getAdvancedDashboardStats(): Promise<{
    activeUsers: number;
    avgSessionDuration: number;
    dau: number;
    mau: number;
    dailyRegistrations: number;
    dailyWorkspaces: number;
    featureAdoption: number;
    errorRate5xx: number;
    avgApiResponseTime: number;
    apiRequestsPerMinute: number;
    mrr: number;
    arr: number;
    churnRate: number;
    nrr: number;
    cac: number;
    ltv: number;
    ttv: number;
    signupToActivation: number;
    activationToPaid: number;
    csat: number;
    nps: number;
    firstResponseTime: number;
    resolutionTime: number;
  }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Mock data for demonstration - in real app, these would be calculated from actual data
    return {
      activeUsers: Math.floor(Math.random() * 500) + 100,
      avgSessionDuration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
      dau: Math.floor(Math.random() * 200) + 50,
      mau: Math.floor(Math.random() * 1000) + 500,
      dailyRegistrations: Math.floor(Math.random() * 20) + 5,
      dailyWorkspaces: Math.floor(Math.random() * 15) + 3,
      featureAdoption: Math.floor(Math.random() * 40) + 60, // 60-100%
      errorRate5xx: Math.random() * 2, // 0-2%
      avgApiResponseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
      apiRequestsPerMinute: Math.floor(Math.random() * 500) + 100,
      mrr: Math.floor(Math.random() * 50000) + 10000, // $100-600 in cents
      arr: Math.floor(Math.random() * 600000) + 120000, // $1200-7200 in cents
      churnRate: Math.random() * 5 + 2, // 2-7%
      nrr: Math.random() * 20 + 95, // 95-115%
      cac: Math.floor(Math.random() * 10000) + 5000, // $50-150 in cents
      ltv: Math.floor(Math.random() * 50000) + 20000, // $200-700 in cents
      ttv: Math.floor(Math.random() * 10) + 1, // 1-11 days
      signupToActivation: Math.random() * 30 + 70, // 70-100%
      activationToPaid: Math.random() * 20 + 15, // 15-35%
      csat: Math.random() * 2 + 4, // 4-5 stars
      nps: Math.floor(Math.random() * 40) + 40, // 40-80
      firstResponseTime: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
      resolutionTime: Math.floor(Math.random() * 1440) + 240, // 4-28 hours
    };
  }
}

export const storage = new DrizzleStorage();
