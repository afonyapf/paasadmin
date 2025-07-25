import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import Database from 'better-sqlite3';
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

async function updateTemplates() {
  try {
    console.log('Updating templates with table metadata...');

    // Sample table metadata for different templates
    const templateTables = {
      'Basic CRM': [
        {
          code: 'clients',
          name: 'Клиенты',
          type: 'directory',
          isSystem: true,
          icon: 'users',
          color: '#3B82F6',
          fields: [
            { name: 'name', type: 'text', isSystem: true, isRequired: true },
            { name: 'inn', type: 'text', isSystem: true, isRequired: false },
            { name: 'phone', type: 'text', isSystem: true, isRequired: false },
            { name: 'email', type: 'text', isSystem: true, isRequired: false },
            { name: 'region', type: 'select', isSystem: false, isRequired: false, options: ['Moscow', 'SPb', 'Other'] }
          ]
        },
        {
          code: 'products',
          name: 'Продукты',
          type: 'directory',
          isSystem: true,
          icon: 'package',
          color: '#10B981',
          fields: [
            { name: 'name', type: 'text', isSystem: true, isRequired: true },
            { name: 'sku', type: 'text', isSystem: true, isRequired: true },
            { name: 'barcode', type: 'text', isSystem: true, isRequired: false },
            { name: 'price', type: 'number', isSystem: true, isRequired: true },
            { name: 'category', type: 'select', isSystem: false, isRequired: false, options: ['Electronics', 'Clothing', 'Food'] }
          ]
        },
        {
          code: 'orders',
          name: 'Заказы',
          type: 'document',
          isSystem: true,
          icon: 'file-text',
          color: '#F59E0B',
          fields: [
            { name: 'order_date', type: 'date', isSystem: true, isRequired: true },
            { name: 'client_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'clients' },
            { name: 'status', type: 'select', isSystem: true, isRequired: true, options: ['new', 'processing', 'completed', 'cancelled'] },
            { name: 'total_price', type: 'number', isSystem: true, isRequired: true },
            { name: 'notes', type: 'text', isSystem: false, isRequired: false }
          ]
        }
      ],
      'Advanced CRM': [
        {
          code: 'clients',
          name: 'Клиенты',
          type: 'directory',
          isSystem: true,
          icon: 'users',
          color: '#3B82F6',
          fields: [
            { name: 'name', type: 'text', isSystem: true, isRequired: true },
            { name: 'inn', type: 'text', isSystem: true, isRequired: false },
            { name: 'phone', type: 'text', isSystem: true, isRequired: false },
            { name: 'email', type: 'text', isSystem: true, isRequired: false },
            { name: 'region', type: 'select', isSystem: false, isRequired: false, options: ['Moscow', 'SPb', 'Other'] },
            { name: 'manager_id', type: 'reference', isSystem: false, isRequired: false, referenceTable: 'managers' }
          ]
        },
        {
          code: 'products',
          name: 'Продукты',
          type: 'directory',
          isSystem: true,
          icon: 'package',
          color: '#10B981',
          fields: [
            { name: 'name', type: 'text', isSystem: true, isRequired: true },
            { name: 'sku', type: 'text', isSystem: true, isRequired: true },
            { name: 'barcode', type: 'text', isSystem: true, isRequired: false },
            { name: 'price', type: 'number', isSystem: true, isRequired: true },
            { name: 'category', type: 'select', isSystem: false, isRequired: false, options: ['Electronics', 'Clothing', 'Food'] },
            { name: 'supplier_id', type: 'reference', isSystem: false, isRequired: false, referenceTable: 'suppliers' }
          ]
        },
        {
          code: 'orders',
          name: 'Заказы',
          type: 'document',
          isSystem: true,
          icon: 'file-text',
          color: '#F59E0B',
          fields: [
            { name: 'order_date', type: 'date', isSystem: true, isRequired: true },
            { name: 'client_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'clients' },
            { name: 'status', type: 'select', isSystem: true, isRequired: true, options: ['new', 'processing', 'completed', 'cancelled'] },
            { name: 'total_price', type: 'number', isSystem: true, isRequired: true },
            { name: 'notes', type: 'text', isSystem: false, isRequired: false },
            { name: 'priority', type: 'select', isSystem: false, isRequired: false, options: ['low', 'medium', 'high'] }
          ]
        },
        {
          code: 'analytics_reports',
          name: 'Аналитические отчеты',
          type: 'procedure',
          isSystem: false,
          icon: 'bar-chart',
          color: '#8B5CF6',
          fields: [
            { name: 'report_type', type: 'select', isSystem: true, isRequired: true, options: ['sales', 'clients', 'products'] },
            { name: 'date_from', type: 'date', isSystem: true, isRequired: true },
            { name: 'date_to', type: 'date', isSystem: true, isRequired: true },
            { name: 'filters', type: 'text', isSystem: false, isRequired: false }
          ]
        }
      ],
      'Supplier Portal': [
        {
          code: 'suppliers',
          name: 'Поставщики',
          type: 'directory',
          isSystem: true,
          icon: 'truck',
          color: '#EF4444',
          fields: [
            { name: 'name', type: 'text', isSystem: true, isRequired: true },
            { name: 'inn', type: 'text', isSystem: true, isRequired: true },
            { name: 'contact_person', type: 'text', isSystem: true, isRequired: false },
            { name: 'phone', type: 'text', isSystem: true, isRequired: false },
            { name: 'email', type: 'text', isSystem: true, isRequired: false },
            { name: 'rating', type: 'number', isSystem: false, isRequired: false }
          ]
        },
        {
          code: 'purchase_orders',
          name: 'Заказы поставщикам',
          type: 'document',
          isSystem: true,
          icon: 'shopping-cart',
          color: '#F59E0B',
          fields: [
            { name: 'order_date', type: 'date', isSystem: true, isRequired: true },
            { name: 'supplier_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'suppliers' },
            { name: 'status', type: 'select', isSystem: true, isRequired: true, options: ['draft', 'sent', 'confirmed', 'delivered'] },
            { name: 'total_amount', type: 'number', isSystem: true, isRequired: true },
            { name: 'delivery_date', type: 'date', isSystem: true, isRequired: false }
          ]
        },
        {
          code: 'inventory',
          name: 'Складские остатки',
          type: 'register',
          isSystem: true,
          icon: 'database',
          color: '#6366F1',
          fields: [
            { name: 'product_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'products' },
            { name: 'warehouse_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'warehouses' },
            { name: 'quantity', type: 'number', isSystem: true, isRequired: true },
            { name: 'last_updated', type: 'date', isSystem: true, isRequired: true }
          ]
        }
      ]
    };

    // Update each template with table metadata
    for (const [templateName, tables] of Object.entries(templateTables)) {
      try {
        const template = await db.select().from(schema.templates).where(eq(schema.templates.name, templateName));
        
        if (template.length > 0) {
          await db.update(schema.templates)
            .set({ 
              tables: JSON.stringify(tables),
              version: '1.0.1'
            })
            .where(eq(schema.templates.id, template[0].id));
          
          console.log(`Updated template: ${templateName} with ${tables.length} tables`);
        }
      } catch (error) {
        console.error(`Error updating template ${templateName}:`, error);
      }
    }

    console.log('Templates update completed!');
  } catch (error) {
    console.error('Error updating templates:', error);
  } finally {
    // Close the database connection
    sqlite.close();
  }
}

// Run the update function
updateTemplates();