import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertWorkspaceSchema, insertTariffSchema, insertTemplateSchema, insertCustomDomainSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    adminId?: number;
    admin?: any;
  }
}

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware to log audit events
const logAudit = (action: string, resourceType: string, resourceId?: number) => {
  return async (req: Request, res: Response, next: Function) => {
    try {
      await storage.createAuditLog({
        action,
        resourceType,
        resourceId,
        adminId: req.session.adminId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        details: { body: req.body, params: req.params, query: req.query },
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Auth routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      req.session.admin = { id: admin.id, username: admin.username, email: admin.email, name: admin.name };

      await storage.createAuditLog({
        action: 'login',
        resourceType: 'admin',
        resourceId: admin.id,
        adminId: admin.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      });

      res.json({ admin: req.session.admin });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post('/api/auth/logout', requireAuth, async (req: Request, res: Response) => {
    const adminId = req.session.adminId;
    
    await storage.createAuditLog({
      action: 'logout',
      resourceType: 'admin',
      resourceId: adminId,
      adminId: adminId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
    });

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ admin: req.session.admin });
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-users', requireAuth, async (req: Request, res: Response) => {
    try {
      const users = await storage.getRecentUsers(5);
      res.json(users);
    } catch (error) {
      console.error('Recent users error:', error);
      res.status(500).json({ message: "Failed to fetch recent users" });
    }
  });

  app.get('/api/dashboard/recent-activity', requireAuth, async (req: Request, res: Response) => {
    try {
      const activity = await storage.getRecentActivity(10);
      res.json(activity);
    } catch (error) {
      console.error('Recent activity error:', error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // User routes
  app.get('/api/users', requireAuth, async (req: Request, res: Response) => {
    try {
      const { search, status, plan, page = "1", limit = "10" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const result = await storage.getUsers({
        search: search as string,
        status: status as string,
        plan: plan as string,
        limit: parseInt(limit as string),
        offset,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/users', requireAuth, logAudit('create', 'user'), async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put('/api/users/:id', requireAuth, logAudit('update', 'user'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.delete('/api/users/:id', requireAuth, logAudit('delete', 'user'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Workspace routes
  app.get('/api/workspaces', requireAuth, async (req: Request, res: Response) => {
    try {
      const { search, status, page = "1", limit = "10" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const result = await storage.getWorkspaces({
        search: search as string,
        status: status as string,
        limit: parseInt(limit as string),
        offset,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Get workspaces error:', error);
      res.status(500).json({ message: "Failed to fetch workspaces" });
    }
  });

  app.get('/api/workspaces/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const workspace = await storage.getWorkspaceById(id);
      
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      res.json(workspace);
    } catch (error) {
      console.error('Get workspace error:', error);
      res.status(500).json({ message: "Failed to fetch workspace" });
    }
  });

  app.post('/api/workspaces', requireAuth, logAudit('create', 'workspace'), async (req: Request, res: Response) => {
    try {
      const workspaceData = insertWorkspaceSchema.parse(req.body);
      const workspace = await storage.createWorkspace(workspaceData);
      res.json(workspace);
    } catch (error) {
      console.error('Create workspace error:', error);
      res.status(400).json({ message: "Invalid workspace data" });
    }
  });

  app.put('/api/workspaces/:id', requireAuth, logAudit('update', 'workspace'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const workspaceData = insertWorkspaceSchema.partial().parse(req.body);
      const workspace = await storage.updateWorkspace(id, workspaceData);
      res.json(workspace);
    } catch (error) {
      console.error('Update workspace error:', error);
      res.status(400).json({ message: "Invalid workspace data" });
    }
  });

  app.delete('/api/workspaces/:id', requireAuth, logAudit('delete', 'workspace'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkspace(id);
      res.json({ message: "Workspace deleted successfully" });
    } catch (error) {
      console.error('Delete workspace error:', error);
      res.status(500).json({ message: "Failed to delete workspace" });
    }
  });

  // Tariff routes
  app.get('/api/tariffs', requireAuth, async (req: Request, res: Response) => {
    try {
      const tariffs = await storage.getTariffs();
      res.json(tariffs);
    } catch (error) {
      console.error('Get tariffs error:', error);
      res.status(500).json({ message: "Failed to fetch tariffs" });
    }
  });

  app.get('/api/tariffs/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const tariff = await storage.getTariffById(id);
      
      if (!tariff) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      
      res.json(tariff);
    } catch (error) {
      console.error('Get tariff error:', error);
      res.status(500).json({ message: "Failed to fetch tariff" });
    }
  });

  app.post('/api/tariffs', requireAuth, logAudit('create', 'tariff'), async (req: Request, res: Response) => {
    try {
      const tariffData = insertTariffSchema.parse(req.body);
      const tariff = await storage.createTariff(tariffData);
      res.json(tariff);
    } catch (error) {
      console.error('Create tariff error:', error);
      res.status(400).json({ message: "Invalid tariff data" });
    }
  });

  app.put('/api/tariffs/:id', requireAuth, logAudit('update', 'tariff'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const tariffData = insertTariffSchema.partial().parse(req.body);
      const tariff = await storage.updateTariff(id, tariffData);
      res.json(tariff);
    } catch (error) {
      console.error('Update tariff error:', error);
      res.status(400).json({ message: "Invalid tariff data" });
    }
  });

  app.delete('/api/tariffs/:id', requireAuth, logAudit('delete', 'tariff'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTariff(id);
      res.json({ message: "Tariff deleted successfully" });
    } catch (error) {
      console.error('Delete tariff error:', error);
      res.status(500).json({ message: "Failed to delete tariff" });
    }
  });

  // Template routes
  app.get('/api/templates', requireAuth, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post('/api/templates', requireAuth, logAudit('create', 'template'), async (req: Request, res: Response) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error('Create template error:', error);
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  app.put('/api/templates/:id', requireAuth, logAudit('update', 'template'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const templateData = insertTemplateSchema.partial().parse(req.body);
      const template = await storage.updateTemplate(id, templateData);
      res.json(template);
    } catch (error) {
      console.error('Update template error:', error);
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  app.delete('/api/templates/:id', requireAuth, logAudit('delete', 'template'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTemplate(id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Template version routes
  app.get('/api/templates/:id/versions', requireAuth, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const versions = await storage.getTemplateVersions(templateId);
      res.json(versions);
    } catch (error) {
      console.error('Get template versions error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/templates/:id/versions', requireAuth, logAudit('create', 'template_version'), async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const version = await storage.createTemplateVersion({
        ...req.body,
        templateId,
        createdBy: req.session.adminId
      });
      res.status(201).json(version);
    } catch (error) {
      console.error('Create template version error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Section routes
  app.get('/api/sections', requireAuth, async (req: Request, res: Response) => {
    try {
      const { search, limit, offset } = req.query;
      const sections = await storage.getSections({
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(sections);
    } catch (error) {
      console.error('Get sections error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/sections/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const section = await storage.getSectionById(id);
      
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      res.json(section);
    } catch (error) {
      console.error('Get section error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/sections', requireAuth, logAudit('create', 'section'), async (req: Request, res: Response) => {
    try {
      const section = await storage.createSection(req.body);
      res.status(201).json(section);
    } catch (error) {
      console.error('Create section error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/sections/:id', requireAuth, logAudit('update', 'section'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const section = await storage.updateSection(id, req.body);
      res.json(section);
    } catch (error) {
      console.error('Update section error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/sections/:id', requireAuth, logAudit('delete', 'section'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSection(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete section error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Global table schema routes
  app.get('/api/table-schemas', requireAuth, async (req: Request, res: Response) => {
    try {
      const { type, search, limit, offset } = req.query;
      const schemas = await storage.getGlobalTableSchemas({
        type: type as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(schemas);
    } catch (error) {
      console.error('Get table schemas error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/table-schemas/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const schema = await storage.getGlobalTableSchemaById(id);
      
      if (!schema) {
        return res.status(404).json({ message: "Table schema not found" });
      }
      
      const fields = await storage.getGlobalTableFields(id);
      res.json({ ...schema, fields });
    } catch (error) {
      console.error('Get table schema error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/table-schemas', requireAuth, logAudit('create', 'table_schema'), async (req: Request, res: Response) => {
    try {
      const { fields, ...schemaData } = req.body;
      const schema = await storage.createGlobalTableSchema(schemaData);
      
      // Create fields if provided
      if (fields && fields.length > 0) {
        for (const field of fields) {
          await storage.createGlobalTableField({ ...field, schemaId: schema.id });
        }
      }
      
      res.status(201).json(schema);
    } catch (error) {
      console.error('Create table schema error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/table-schemas/:id', requireAuth, logAudit('update', 'table_schema'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { fields, ...schemaData } = req.body;
      
      const schema = await storage.updateGlobalTableSchema(id, schemaData);
      
      // Update fields if provided
      if (fields) {
        // For simplicity, delete and recreate fields
        const existingFields = await storage.getGlobalTableFields(id);
        for (const field of existingFields) {
          await storage.deleteGlobalTableField(field.id);
        }
        
        for (const field of fields) {
          await storage.createGlobalTableField({ ...field, schemaId: id });
        }
      }
      
      res.json(schema);
    } catch (error) {
      console.error('Update table schema error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/table-schemas/:id', requireAuth, logAudit('delete', 'table_schema'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGlobalTableSchema(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete table schema error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Global table field routes
  app.get('/api/table-schemas/:id/fields', requireAuth, async (req: Request, res: Response) => {
    try {
      const schemaId = parseInt(req.params.id);
      const fields = await storage.getGlobalTableFields(schemaId);
      res.json(fields);
    } catch (error) {
      console.error('Get table fields error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/table-schemas/:id/fields', requireAuth, logAudit('create', 'table_field'), async (req: Request, res: Response) => {
    try {
      const schemaId = parseInt(req.params.id);
      const field = await storage.createGlobalTableField({
        ...req.body,
        schemaId
      });
      res.status(201).json(field);
    } catch (error) {
      console.error('Create table field error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/table-fields/:id', requireAuth, logAudit('update', 'table_field'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const field = await storage.updateGlobalTableField(id, req.body);
      res.json(field);
    } catch (error) {
      console.error('Update table field error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/table-fields/:id', requireAuth, logAudit('delete', 'table_field'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGlobalTableField(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete table field error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Custom domain routes
  app.get('/api/domains', requireAuth, async (req: Request, res: Response) => {
    try {
      const { search, page = "1", limit = "10" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const result = await storage.getCustomDomains({
        search: search as string,
        limit: parseInt(limit as string),
        offset,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Get domains error:', error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.get('/api/domains/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getCustomDomainById(id);
      
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      res.json(domain);
    } catch (error) {
      console.error('Get domain error:', error);
      res.status(500).json({ message: "Failed to fetch domain" });
    }
  });

  app.post('/api/domains', requireAuth, logAudit('create', 'domain'), async (req: Request, res: Response) => {
    try {
      const domainData = insertCustomDomainSchema.parse(req.body);
      const domain = await storage.createCustomDomain(domainData);
      res.json(domain);
    } catch (error) {
      console.error('Create domain error:', error);
      res.status(400).json({ message: "Invalid domain data" });
    }
  });

  app.put('/api/domains/:id', requireAuth, logAudit('update', 'domain'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const domainData = insertCustomDomainSchema.partial().parse(req.body);
      const domain = await storage.updateCustomDomain(id, domainData);
      res.json(domain);
    } catch (error) {
      console.error('Update domain error:', error);
      res.status(400).json({ message: "Invalid domain data" });
    }
  });

  app.delete('/api/domains/:id', requireAuth, logAudit('delete', 'domain'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomDomain(id);
      res.json({ message: "Domain deleted successfully" });
    } catch (error) {
      console.error('Delete domain error:', error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  // Audit log routes
  app.get('/api/audit-logs', requireAuth, async (req: Request, res: Response) => {
    try {
      const { page = "1", limit = "50" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const result = await storage.getAuditLogs({
        limit: parseInt(limit as string),
        offset,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
