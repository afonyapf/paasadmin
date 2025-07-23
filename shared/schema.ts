//import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
// Используйте sqlite-специфичные методы
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admins table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  status: text("status").notNull().default("active"), // active, blocked, pending
  plan: text("plan").notNull().default("free"), // free, pro, enterprise
  oauthProvider: text("oauth_provider"),
  oauthId: text("oauth_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workspaces table
export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("active"), // active, suspended, deleted
  templateId: integer("template_id").references(() => templates.id),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tariffs table
export const tariffs = pgTable("tariffs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  features: jsonb("features").notNull(),
  limits: jsonb("limits").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Templates table - updated according to spec
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // client, supplier
  version: text("version").notNull().default("1.0"),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  config: jsonb("config").notNull(),
  tariffId: integer("tariff_id").references(() => tariffs.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Template versions table
export const templateVersions = pgTable("template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  version: text("version").notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => admins.id).notNull(),
});

// Sections table (platform sections/features)
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id").references(() => sections.id),
  tableName: text("table_name"),
  isSystem: boolean("is_system").notNull().default(false),
  accessType: text("access_type").notNull().default("open"), // open, restricted
  description: text("description"),
  status: boolean("status").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Global table schemas
export const globalTableSchemas = pgTable("global_table_schemas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // directory, document, register, journal, report, procedure
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Global table fields
export const globalTableFields = pgTable("global_table_fields", {
  id: serial("id").primaryKey(),
  schemaId: integer("schema_id").references(() => globalTableSchemas.id).notNull(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(), // string, number, boolean, date, reference, select
  isRequired: boolean("is_required").notNull().default(false),
  isSystem: boolean("is_system").notNull().default(false),
  referenceTable: text("reference_table"), // for reference type
  options: jsonb("options"), // for select type
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Template sections relationship
export const templateSections = pgTable("template_sections", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  sectionId: integer("section_id").references(() => sections.id).notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
});

// Template table schemas relationship
export const templateTableSchemas = pgTable("template_table_schemas", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  schemaId: integer("schema_id").references(() => globalTableSchemas.id).notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
});

// Custom domains table
export const customDomains = pgTable("custom_domains", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  workspaceId: integer("workspace_id").references(() => workspaces.id).notNull(),
  sslStatus: text("ssl_status").notNull().default("pending"), // pending, active, failed
  verificationStatus: text("verification_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id"),
  userId: integer("user_id").references(() => users.id),
  adminId: integer("admin_id").references(() => admins.id),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System metrics table
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  value: integer("value").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

// Insert schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTariffSchema = createInsertSchema(tariffs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateVersionSchema = createInsertSchema(templateVersions).omit({
  id: true,
  createdAt: true,
});

export const insertSectionSchema = createInsertSchema(sections).omit({
  id: true,
  createdAt: true,
});

export const insertGlobalTableSchemaSchema = createInsertSchema(globalTableSchemas).omit({
  id: true,
  createdAt: true,
});

export const insertGlobalTableFieldSchema = createInsertSchema(globalTableFields).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSectionSchema = createInsertSchema(templateSections).omit({
  id: true,
});

export const insertTemplateTableSchemaSchema = createInsertSchema(templateTableSchemas).omit({
  id: true,
});

export const insertCustomDomainSchema = createInsertSchema(customDomains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  date: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Tariff = typeof tariffs.$inferSelect;
export type InsertTariff = z.infer<typeof insertTariffSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type TemplateVersion = typeof templateVersions.$inferSelect;
export type InsertTemplateVersion = z.infer<typeof insertTemplateVersionSchema>;
export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type GlobalTableSchema = typeof globalTableSchemas.$inferSelect;
export type InsertGlobalTableSchema = z.infer<typeof insertGlobalTableSchemaSchema>;
export type GlobalTableField = typeof globalTableFields.$inferSelect;
export type InsertGlobalTableField = z.infer<typeof insertGlobalTableFieldSchema>;
export type TemplateSection = typeof templateSections.$inferSelect;
export type InsertTemplateSection = z.infer<typeof insertTemplateSectionSchema>;
export type TemplateTableSchema = typeof templateTableSchemas.$inferSelect;
export type InsertTemplateTableSchema = z.infer<typeof insertTemplateTableSchemaSchema>;
export type CustomDomain = typeof customDomains.$inferSelect;
export type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type LoginData = z.infer<typeof loginSchema>;
