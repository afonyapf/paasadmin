import type { IStorage } from "./storage";
import type {
  Admin,
  User,
  Workspace,
  Tariff,
  Template,
  TemplateVersion,
  Section,
  GlobalTableSchema,
  GlobalTableField,
  TemplateSection,
  TemplateTableSchema,
  CustomDomain,
  AuditLog,
  SystemMetric,
  InsertAdmin,
  InsertUser,
  InsertWorkspace,
  InsertTariff,
  InsertTemplate,
  InsertTemplateVersion,
  InsertSection,
  InsertGlobalTableSchema,
  InsertGlobalTableField,
  InsertTemplateSection,
  InsertTemplateTableSchema,
  InsertCustomDomain,
  InsertAuditLog,
  InsertSystemMetric,
} from "@shared/schema";

export class MockStorage implements IStorage {
  private admins: Admin[] = [
    {
      id: 1,
      username: "admin",
      email: "admin@example.com",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      name: "Администратор",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  private users: User[] = [
    {
      id: 1,
      username: "john_doe",
      email: "john@example.com",
      name: "John Doe",
      avatar: null,
      status: "active",
      plan: "free",
      oauthProvider: null,
      oauthId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      username: "jane_smith",
      email: "jane@example.com",
      name: "Jane Smith",
      avatar: null,
      status: "active",
      plan: "pro",
      oauthProvider: null,
      oauthId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      username: "bob_wilson",
      email: "bob@example.com",
      name: "Bob Wilson",
      avatar: null,
      status: "blocked",
      plan: "free",
      oauthProvider: null,
      oauthId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  private workspaces: Workspace[] = [
    {
      id: 1,
      name: "John's Portfolio",
      description: "Personal portfolio website",
      ownerId: 1,
      status: "active",
      templateId: null,
      settings: { theme: "dark" },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: "Jane's Blog",
      description: "Tech blog and tutorials",
      ownerId: 2,
      status: "active",
      templateId: null,
      settings: { theme: "light" },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  private tariffs: Tariff[] = [
    {
      id: 1,
      name: "Free",
      description: "Basic plan",
      price: 0,
      features: { storage: "1GB", domains: 1 },
      limits: { users: 1, workspaces: 1 },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: "Pro",
      description: "Professional plan",
      price: 2900,
      features: { storage: "10GB", domains: 5 },
      limits: { users: 10, workspaces: 5 },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  private templates: Template[] = [
    {
      id: 1,
      name: "Basic Template",
      description: "Basic workspace template",
      type: "client",
      version: "1.0",
      isActive: true,
      isDefault: true,
      config: { layout: "basic" },
      tariffId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  private customDomains: CustomDomain[] = [
    {
      id: 1,
      domain: "example.com",
      workspaceId: 1,
      sslStatus: "active",
      verificationStatus: "verified",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  private auditLogs: AuditLog[] = [
    {
      id: 1,
      action: "login",
      resourceType: "admin",
      resourceId: 1,
      userId: null,
      adminId: 1,
      details: {},
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      createdAt: new Date(),
    }
  ];

  private nextId = 100;

  // Admin methods
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return this.admins.find(admin => admin.username === username);
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    return this.admins.find(admin => admin.id === id);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const newAdmin: Admin = {
      ...admin,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.admins.push(newAdmin);
    return newAdmin;
  }

  // User methods
  async getUsers(options: { search?: string; status?: string; plan?: string; limit?: number; offset?: number } = {}): Promise<{ users: User[]; total: number }> {
    let filtered = [...this.users];
    
    if (options.search) {
      const search = options.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.username.toLowerCase().includes(search)
      );
    }
    
    if (options.status) {
      filtered = filtered.filter(user => user.status === options.status);
    }
    
    if (options.plan) {
      filtered = filtered.filter(user => user.plan === options.plan);
    }

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 10;
    const users = filtered.slice(offset, offset + limit);

    return { users, total };
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) throw new Error("User not found");
    
    this.users[index] = { ...this.users[index], ...userData, updatedAt: new Date() };
    return this.users[index];
  }

  async deleteUser(id: number): Promise<void> {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }

  async getRecentUsers(limit: number = 5): Promise<User[]> {
    return this.users.slice(-limit);
  }

  // Workspace methods
  async getWorkspaces(options: { search?: string; status?: string; limit?: number; offset?: number } = {}): Promise<{ workspaces: Workspace[]; total: number }> {
    let filtered = [...this.workspaces];
    
    if (options.search) {
      const search = options.search.toLowerCase();
      filtered = filtered.filter(workspace => 
        workspace.name.toLowerCase().includes(search) ||
        (workspace.description && workspace.description.toLowerCase().includes(search))
      );
    }
    
    if (options.status) {
      filtered = filtered.filter(workspace => workspace.status === options.status);
    }

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 10;
    const workspaces = filtered.slice(offset, offset + limit);

    return { workspaces, total };
  }

  async getWorkspaceById(id: number): Promise<Workspace | undefined> {
    return this.workspaces.find(workspace => workspace.id === id);
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const newWorkspace: Workspace = {
      ...workspace,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workspaces.push(newWorkspace);
    return newWorkspace;
  }

  async updateWorkspace(id: number, workspaceData: Partial<InsertWorkspace>): Promise<Workspace> {
    const index = this.workspaces.findIndex(workspace => workspace.id === id);
    if (index === -1) throw new Error("Workspace not found");
    
    this.workspaces[index] = { ...this.workspaces[index], ...workspaceData, updatedAt: new Date() };
    return this.workspaces[index];
  }

  async deleteWorkspace(id: number): Promise<void> {
    const index = this.workspaces.findIndex(workspace => workspace.id === id);
    if (index !== -1) {
      this.workspaces.splice(index, 1);
    }
  }

  // Tariff methods
  async getTariffs(): Promise<Tariff[]> {
    return [...this.tariffs];
  }

  async getTariffById(id: number): Promise<Tariff | undefined> {
    return this.tariffs.find(tariff => tariff.id === id);
  }

  async createTariff(tariff: InsertTariff): Promise<Tariff> {
    const newTariff: Tariff = {
      ...tariff,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tariffs.push(newTariff);
    return newTariff;
  }

  async updateTariff(id: number, tariffData: Partial<InsertTariff>): Promise<Tariff> {
    const index = this.tariffs.findIndex(tariff => tariff.id === id);
    if (index === -1) throw new Error("Tariff not found");
    
    this.tariffs[index] = { ...this.tariffs[index], ...tariffData, updatedAt: new Date() };
    return this.tariffs[index];
  }

  async deleteTariff(id: number): Promise<void> {
    const index = this.tariffs.findIndex(tariff => tariff.id === id);
    if (index !== -1) {
      this.tariffs.splice(index, 1);
    }
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    return [...this.templates];
  }

  async getTemplateById(id: number): Promise<Template | undefined> {
    return this.templates.find(template => template.id === id);
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const newTemplate: Template = {
      ...template,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: number, templateData: Partial<InsertTemplate>): Promise<Template> {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) throw new Error("Template not found");
    
    this.templates[index] = { ...this.templates[index], ...templateData, updatedAt: new Date() };
    return this.templates[index];
  }

  async deleteTemplate(id: number): Promise<void> {
    const index = this.templates.findIndex(template => template.id === id);
    if (index !== -1) {
      this.templates.splice(index, 1);
    }
  }

  // Template version methods
  async getTemplateVersions(templateId: number): Promise<TemplateVersion[]> {
    return [];
  }

  async createTemplateVersion(version: InsertTemplateVersion): Promise<TemplateVersion> {
    const newVersion: TemplateVersion = {
      ...version,
      id: this.nextId++,
      createdAt: new Date(),
    };
    return newVersion;
  }

  // Section methods
  async getSections(options: { search?: string; limit?: number; offset?: number } = {}): Promise<{ sections: Section[]; total: number }> {
    return { sections: [], total: 0 };
  }

  async getSectionById(id: number): Promise<Section | undefined> {
    return undefined;
  }

  async createSection(section: InsertSection): Promise<Section> {
    const newSection: Section = {
      ...section,
      id: this.nextId++,
      createdAt: new Date(),
    };
    return newSection;
  }

  async updateSection(id: number, section: Partial<InsertSection>): Promise<Section> {
    throw new Error("Section not found");
  }

  async deleteSection(id: number): Promise<void> {
    // Mock implementation
  }

  // Global table schema methods
  async getGlobalTableSchemas(options: { type?: string; search?: string; limit?: number; offset?: number } = {}): Promise<{ schemas: GlobalTableSchema[]; total: number }> {
    return { schemas: [], total: 0 };
  }

  async getGlobalTableSchemaById(id: number): Promise<GlobalTableSchema | undefined> {
    return undefined;
  }

  async createGlobalTableSchema(schema: InsertGlobalTableSchema): Promise<GlobalTableSchema> {
    const newSchema: GlobalTableSchema = {
      ...schema,
      id: this.nextId++,
      createdAt: new Date(),
    };
    return newSchema;
  }

  async updateGlobalTableSchema(id: number, schema: Partial<InsertGlobalTableSchema>): Promise<GlobalTableSchema> {
    throw new Error("Schema not found");
  }

  async deleteGlobalTableSchema(id: number): Promise<void> {
    // Mock implementation
  }

  // Global table field methods
  async getGlobalTableFields(schemaId: number): Promise<GlobalTableField[]> {
    return [];
  }

  async createGlobalTableField(field: InsertGlobalTableField): Promise<GlobalTableField> {
    const newField: GlobalTableField = {
      ...field,
      id: this.nextId++,
      createdAt: new Date(),
    };
    return newField;
  }

  async updateGlobalTableField(id: number, field: Partial<InsertGlobalTableField>): Promise<GlobalTableField> {
    throw new Error("Field not found");
  }

  async deleteGlobalTableField(id: number): Promise<void> {
    // Mock implementation
  }

  // Template section methods
  async getTemplateSections(templateId: number): Promise<TemplateSection[]> {
    return [];
  }

  async updateTemplateSections(templateId: number, sections: InsertTemplateSection[]): Promise<void> {
    // Mock implementation
  }

  // Template table schema methods
  async getTemplateTableSchemas(templateId: number): Promise<TemplateTableSchema[]> {
    return [];
  }

  async updateTemplateTableSchemas(templateId: number, schemas: InsertTemplateTableSchema[]): Promise<void> {
    // Mock implementation
  }

  // Custom domain methods
  async getCustomDomains(options: { search?: string; limit?: number; offset?: number } = {}): Promise<{ domains: CustomDomain[]; total: number }> {
    let filtered = [...this.customDomains];
    
    if (options.search) {
      const search = options.search.toLowerCase();
      filtered = filtered.filter(domain => 
        domain.domain.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 10;
    const domains = filtered.slice(offset, offset + limit);

    return { domains, total };
  }

  async getCustomDomainById(id: number): Promise<CustomDomain | undefined> {
    return this.customDomains.find(domain => domain.id === id);
  }

  async createCustomDomain(domain: InsertCustomDomain): Promise<CustomDomain> {
    const newDomain: CustomDomain = {
      ...domain,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customDomains.push(newDomain);
    return newDomain;
  }

  async updateCustomDomain(id: number, domainData: Partial<InsertCustomDomain>): Promise<CustomDomain> {
    const index = this.customDomains.findIndex(domain => domain.id === id);
    if (index === -1) throw new Error("Domain not found");
    
    this.customDomains[index] = { ...this.customDomains[index], ...domainData, updatedAt: new Date() };
    return this.customDomains[index];
  }

  async deleteCustomDomain(id: number): Promise<void> {
    const index = this.customDomains.findIndex(domain => domain.id === id);
    if (index !== -1) {
      this.customDomains.splice(index, 1);
    }
  }

  // Audit log methods
  async getAuditLogs(options: { limit?: number; offset?: number } = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const total = this.auditLogs.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const logs = this.auditLogs.slice(offset, offset + limit);

    return { logs, total };
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: this.nextId++,
      createdAt: new Date(),
    };
    this.auditLogs.push(newLog);
    return newLog;
  }

  async getRecentActivity(limit: number = 10): Promise<AuditLog[]> {
    return this.auditLogs.slice(-limit);
  }

  // System metrics methods
  async getSystemMetrics(): Promise<SystemMetric[]> {
    return [];
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> {
    const newMetric: SystemMetric = {
      ...metric,
      id: this.nextId++,
      date: new Date(),
    };
    return newMetric;
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeWorkspaces: number;
    totalRevenue: number;
    customDomains: number;
  }> {
    const totalUsers = this.users.length;
    const activeWorkspaces = this.workspaces.filter(w => w.status === 'active').length;
    const proUsers = this.users.filter(u => u.plan === 'pro').length;
    const enterpriseUsers = this.users.filter(u => u.plan === 'enterprise').length;
    const totalRevenue = (proUsers * 29) + (enterpriseUsers * 99);
    const customDomains = this.customDomains.length;

    return {
      totalUsers,
      activeWorkspaces,
      totalRevenue,
      customDomains,
    };
  }
}