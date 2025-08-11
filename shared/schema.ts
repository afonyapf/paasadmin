import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admins table
export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  status: text("status").notNull().default("active"), // active, blocked, pending
  plan: text("plan").notNull().default("free"), // free, pro, enterprise
  oauthProvider: text("oauth_provider"),
  oauthId: text("oauth_id"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Templates table
export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // client, supplier
  version: text("version").notNull().default("1.0.0"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  isDefault: integer("is_default", { mode: 'boolean' }).notNull().default(false),
  config: text("config").notNull(), // JSON as text in SQLite
  tables: text("tables").notNull().default('[]'), // JSON array of table metadata
  tariffId: integer("tariff_id").references(() => tariffs.id),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Tariffs table
export const tariffs = sqliteTable("tariffs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  features: text("features").notNull(), // JSON as text in SQLite
  limits: text("limits").notNull(), // JSON as text in SQLite
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Workspaces table
export const workspaces = sqliteTable("workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("active"), // active, suspended, archived
  type: text("type").notNull().default("client"), // client, supplier
  templateId: integer("template_id").references(() => templates.id),
  tariffId: integer("tariff_id").references(() => tariffs.id),
  settings: text("settings"), // JSON as text in SQLite
  dataSize: integer("data_size").default(0), // in bytes
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Template versions table
export const templateVersions = sqliteTable("template_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  version: text("version").notNull(),
  config: text("config").notNull(), // JSON as text in SQLite
  tables: text("tables").notNull().default('[]'), // JSON array of table metadata
  diff: text("diff"), // JSON diff from previous version
  isApplied: integer("is_applied", { mode: 'boolean' }).notNull().default(false),
  rollbackable: integer("rollbackable", { mode: 'boolean' }).notNull().default(true),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  createdBy: integer("created_by").references(() => admins.id).notNull(),
});

// Sections table (platform sections/features)
export const sections = sqliteTable("sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  parentId: integer("parent_id").references((): any => sections.id),
  tableName: text("table_name"),
  accessType: text("access_type").notNull().default("open"), // open, restricted
  applicability: text("applicability").notNull().default("local"), // global, local
  isSystem: integer("is_system", { mode: 'boolean' }).notNull().default(false),
  isEnabled: integer("is_enabled", { mode: 'boolean' }).notNull().default(true),
  description: text("description"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Global table schemas
export const globalTableSchemas = sqliteTable("global_table_schemas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // directory, document, register, journal, report, procedure
  isSystem: integer("is_system", { mode: 'boolean' }).notNull().default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Global table fields
export const globalTableFields = sqliteTable("global_table_fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schemaId: integer("schema_id").references(() => globalTableSchemas.id).notNull(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(), // string, number, boolean, date, reference, select
  isRequired: integer("is_required", { mode: 'boolean' }).notNull().default(false),
  isSystem: integer("is_system", { mode: 'boolean' }).notNull().default(false),
  referenceTable: text("reference_table"), // for reference type
  options: text("options"), // for select type, JSON as text in SQLite
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Template sections relationship
export const templateSections = sqliteTable("template_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  sectionId: integer("section_id").references(() => sections.id).notNull(),
  isEnabled: integer("is_enabled", { mode: 'boolean' }).notNull().default(true),
});

// Template table schemas relationship
export const templateTableSchemas = sqliteTable("template_table_schemas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  schemaId: integer("schema_id").references(() => globalTableSchemas.id).notNull(),
  isEnabled: integer("is_enabled", { mode: 'boolean' }).notNull().default(true),
});

// Custom domains table
export const customDomains = sqliteTable("custom_domains", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  domain: text("domain").notNull().unique(),
  workspaceId: integer("workspace_id").references(() => workspaces.id).notNull(),
  sslStatus: text("ssl_status").notNull().default("pending"), // pending, active, failed
  verificationStatus: text("verification_status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Audit logs table
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id"),
  userId: integer("user_id").references(() => users.id),
  adminId: integer("admin_id").references(() => admins.id),
  details: text("details"), // JSON as text in SQLite
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// System metrics table
export const systemMetrics = sqliteTable("system_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  metricName: text("metric_name").notNull(),
  value: integer("value").notNull(),
  date: text("date").notNull().default("CURRENT_TIMESTAMP"),
});

// User sessions table
export const userSessions = sqliteTable("user_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull().unique(),
  startTime: text("start_time").notNull().default("CURRENT_TIMESTAMP"),
  endTime: text("end_time"),
  duration: integer("duration"), // in seconds
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
});

// API metrics table
export const apiMetrics = sqliteTable("api_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time").notNull(), // in milliseconds
  timestamp: text("timestamp").notNull().default("CURRENT_TIMESTAMP"),
  userId: integer("user_id").references(() => users.id),
  errorMessage: text("error_message"),
});

// Feature usage table
export const featureUsage = sqliteTable("feature_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id").references(() => workspaces.id).notNull(),
  featureName: text("feature_name").notNull(),
  usageCount: integer("usage_count").notNull().default(1),
  firstUsed: text("first_used").notNull().default("CURRENT_TIMESTAMP"),
  lastUsed: text("last_used").notNull().default("CURRENT_TIMESTAMP"),
});

// Revenue tracking table
export const revenueEvents = sqliteTable("revenue_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventType: text("event_type").notNull(), // subscription, upgrade, downgrade, churn
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  planFrom: text("plan_from"),
  planTo: text("plan_to"),
  timestamp: text("timestamp").notNull().default("CURRENT_TIMESTAMP"),
});

// Customer satisfaction table
export const customerFeedback = sqliteTable("customer_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // csat, nps, support
  score: integer("score").notNull(),
  comment: text("comment"),
  timestamp: text("timestamp").notNull().default("CURRENT_TIMESTAMP"),
});

// Support tickets table
export const supportTickets = sqliteTable("support_tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  firstResponseAt: text("first_response_at"),
  resolvedAt: text("resolved_at"),
  closedAt: text("closed_at"),
});

// Companies table
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  logo: text("logo"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Workspace companies relationship
export const workspaceCompanies = sqliteTable("workspace_companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id").references(() => workspaces.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Workspace members table
export const workspaceMembers = sqliteTable("workspace_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id").references(() => workspaces.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("viewer"), // owner, admin, manager, viewer
  status: text("status").notNull().default("active"), // active, inactive, pending
  invitedBy: integer("invited_by").references(() => users.id),
  invitedAt: text("invited_at").notNull().default("CURRENT_TIMESTAMP"),
  joinedAt: text("joined_at"),
});

// Workspace backups table
export const workspaceBackups = sqliteTable("workspace_backups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id").references(() => workspaces.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"), // in bytes
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  completedAt: text("completed_at"),
});

// Workspace access control table
export const workspaceAccessControl = sqliteTable("workspace_access_control", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id").references(() => workspaces.id).notNull(),
  sectionId: integer("section_id").references(() => sections.id).notNull(),
  isEnabled: integer("is_enabled", { mode: 'boolean' }).notNull().default(true),
  overrideTariff: integer("override_tariff", { mode: 'boolean' }).notNull().default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Workspace usage metrics table
export const workspaceUsageMetrics = sqliteTable("workspace_usage_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id").references(() => workspaces.id).notNull(),
  metricType: text("metric_type").notNull(), // sessions, api_requests, storage_used, feature_usage
  value: integer("value").notNull(),
  date: text("date").notNull(),
  metadata: text("metadata"), // JSON for additional data
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

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  startTime: true,
});

export const insertApiMetricSchema = createInsertSchema(apiMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
  id: true,
  firstUsed: true,
  lastUsed: true,
});

export const insertRevenueEventSchema = createInsertSchema(revenueEvents).omit({
  id: true,
  timestamp: true,
});

export const insertCustomerFeedbackSchema = createInsertSchema(customerFeedback).omit({
  id: true,
  timestamp: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceCompanySchema = createInsertSchema(workspaceCompanies).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({
  id: true,
  invitedAt: true,
});

export const insertWorkspaceBackupSchema = createInsertSchema(workspaceBackups).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceAccessControlSchema = createInsertSchema(workspaceAccessControl).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkspaceUsageMetricSchema = createInsertSchema(workspaceUsageMetrics).omit({
  id: true,
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
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type ApiMetric = typeof apiMetrics.$inferSelect;
export type InsertApiMetric = z.infer<typeof insertApiMetricSchema>;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;
export type RevenueEvent = typeof revenueEvents.$inferSelect;
export type InsertRevenueEvent = z.infer<typeof insertRevenueEventSchema>;
export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = z.infer<typeof insertCustomerFeedbackSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type WorkspaceCompany = typeof workspaceCompanies.$inferSelect;
export type InsertWorkspaceCompany = z.infer<typeof insertWorkspaceCompanySchema>;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type WorkspaceBackup = typeof workspaceBackups.$inferSelect;
export type InsertWorkspaceBackup = z.infer<typeof insertWorkspaceBackupSchema>;
export type WorkspaceAccessControl = typeof workspaceAccessControl.$inferSelect;
export type InsertWorkspaceAccessControl = z.infer<typeof insertWorkspaceAccessControlSchema>;
export type WorkspaceUsageMetric = typeof workspaceUsageMetrics.$inferSelect;
export type InsertWorkspaceUsageMetric = z.infer<typeof insertWorkspaceUsageMetricSchema>;
export type LoginData = z.infer<typeof loginSchema>;