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

async function updateTemplatesWithNewTypes() {
  try {
    console.log('Updating templates with 1C-style table types...');

    // Sample table metadata with 1C-style types
    const templateTables = {
      'Basic CRM': [
        {
          code: 'clients',
          name: 'Клиенты',
          type: 'directory',
          isSystem: true,
          icon: '📗',
          color: '#10B981',
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
          name: 'Номенклатура',
          type: 'directory',
          isSystem: true,
          icon: '📗',
          color: '#10B981',
          fields: [
            { name: 'name', type: 'text', isSystem: true, isRequired: true },
            { name: 'sku', type: 'text', isSystem: true, isRequired: true },
            { name: 'barcode', type: 'text', isSystem: true, isRequired: false },
            { name: 'price', type: 'number', isSystem: true, isRequired: true },
            { name: 'unit', type: 'select', isSystem: true, isRequired: true, options: ['шт', 'кг', 'л', 'м'] }
          ]
        },
        {
          code: 'orders',
          name: 'Заказы покупателей',
          type: 'document',
          isSystem: true,
          icon: '📘',
          color: '#3B82F6',
          fields: [
            { name: 'number', type: 'text', isSystem: true, isRequired: true },
            { name: 'date', type: 'date', isSystem: true, isRequired: true },
            { name: 'client_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'clients' },
            { name: 'status', type: 'select', isSystem: true, isRequired: true, options: ['новый', 'в работе', 'выполнен', 'отменен'] },
            { name: 'total_amount', type: 'number', isSystem: true, isRequired: true }
          ]
        },
        {
          code: 'stock_balance',
          name: 'Остатки товаров',
          type: 'register',
          isSystem: true,
          icon: '📙',
          color: '#F59E0B',
          fields: [
            { name: 'product_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'products' },
            { name: 'warehouse_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'warehouses' },
            { name: 'quantity', type: 'number', isSystem: true, isRequired: true },
            { name: 'period', type: 'date', isSystem: true, isRequired: true }
          ]
        }
      ],
      'Advanced CRM': [
        {
          code: 'clients',
          name: 'Клиенты',
          type: 'directory',
          isSystem: true,
          icon: '📗',
          color: '#10B981',
          fields: [
            { name: 'name', type: 'text', isSystem: true, isRequired: true },
            { name: 'inn', type: 'text', isSystem: true, isRequired: false },
            { name: 'phone', type: 'text', isSystem: true, isRequired: false },
            { name: 'email', type: 'text', isSystem: true, isRequired: false },
            { name: 'manager_id', type: 'reference', isSystem: false, isRequired: false, referenceTable: 'managers' }
          ]
        },
        {
          code: 'orders',
          name: 'Заказы покупателей',
          type: 'document',
          isSystem: true,
          icon: '📘',
          color: '#3B82F6',
          fields: [
            { name: 'number', type: 'text', isSystem: true, isRequired: true },
            { name: 'date', type: 'date', isSystem: true, isRequired: true },
            { name: 'client_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'clients' },
            { name: 'status', type: 'select', isSystem: true, isRequired: true, options: ['новый', 'в работе', 'выполнен'] },
            { name: 'priority', type: 'select', isSystem: false, isRequired: false, options: ['низкий', 'средний', 'высокий'] }
          ]
        },
        {
          code: 'activity_log',
          name: 'Журнал активности',
          type: 'journal',
          isSystem: true,
          icon: '📒',
          color: '#F97316',
          fields: [
            { name: 'timestamp', type: 'date', isSystem: true, isRequired: true },
            { name: 'user_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'users' },
            { name: 'action', type: 'text', isSystem: true, isRequired: true },
            { name: 'object_type', type: 'text', isSystem: true, isRequired: true },
            { name: 'object_id', type: 'text', isSystem: true, isRequired: false }
          ]
        },
        {
          code: 'sales_report',
          name: 'Отчет по продажам',
          type: 'report',
          isSystem: false,
          icon: '📓',
          color: '#8B5CF6',
          fields: [
            { name: 'period_start', type: 'date', isSystem: true, isRequired: true },
            { name: 'period_end', type: 'date', isSystem: true, isRequired: true },
            { name: 'client_filter', type: 'reference', isSystem: false, isRequired: false, referenceTable: 'clients' },
            { name: 'group_by', type: 'select', isSystem: false, isRequired: false, options: ['день', 'неделя', 'месяц'] }
          ]
        },
        {
          code: 'data_import',
          name: 'Загрузка данных',
          type: 'procedure',
          isSystem: false,
          icon: '📕',
          color: '#EF4444',
          fields: [
            { name: 'file_path', type: 'text', isSystem: true, isRequired: true },
            { name: 'import_type', type: 'select', isSystem: true, isRequired: true, options: ['клиенты', 'товары', 'заказы'] },
            { name: 'overwrite_existing', type: 'select', isSystem: false, isRequired: false, options: ['да', 'нет'] }
          ]
        }
      ],
      'Supplier Portal': [
        {
          code: 'suppliers',
          name: 'Поставщики',
          type: 'directory',
          isSystem: true,
          icon: '📗',
          color: '#10B981',
          fields: [
            { name: 'name', type: 'text', isSystem: true, isRequired: true },
            { name: 'inn', type: 'text', isSystem: true, isRequired: true },
            { name: 'contact_person', type: 'text', isSystem: true, isRequired: false },
            { name: 'rating', type: 'number', isSystem: false, isRequired: false }
          ]
        },
        {
          code: 'purchase_orders',
          name: 'Заказы поставщикам',
          type: 'document',
          isSystem: true,
          icon: '📘',
          color: '#3B82F6',
          fields: [
            { name: 'number', type: 'text', isSystem: true, isRequired: true },
            { name: 'date', type: 'date', isSystem: true, isRequired: true },
            { name: 'supplier_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'suppliers' },
            { name: 'status', type: 'select', isSystem: true, isRequired: true, options: ['черновик', 'отправлен', 'подтвержден'] }
          ]
        },
        {
          code: 'supplier_payments',
          name: 'Расчеты с поставщиками',
          type: 'register',
          isSystem: true,
          icon: '📙',
          color: '#F59E0B',
          fields: [
            { name: 'supplier_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'suppliers' },
            { name: 'document_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'purchase_orders' },
            { name: 'amount', type: 'number', isSystem: true, isRequired: true },
            { name: 'period', type: 'date', isSystem: true, isRequired: true }
          ]
        },
        {
          code: 'supplier_activity',
          name: 'Активность поставщиков',
          type: 'journal',
          isSystem: true,
          icon: '📒',
          color: '#F97316',
          fields: [
            { name: 'timestamp', type: 'date', isSystem: true, isRequired: true },
            { name: 'supplier_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'suppliers' },
            { name: 'action', type: 'text', isSystem: true, isRequired: true },
            { name: 'details', type: 'text', isSystem: false, isRequired: false }
          ]
        }
      ]
    };

    // Update each template with new table metadata
    for (const [templateName, tables] of Object.entries(templateTables)) {
      try {
        const template = await db.select().from(schema.templates).where(eq(schema.templates.name, templateName));
        
        if (template.length > 0) {
          await db.update(schema.templates)
            .set({ 
              tables: JSON.stringify(tables),
              version: '1.1.0'
            })
            .where(eq(schema.templates.id, template[0].id));
          
          console.log(`Updated template: ${templateName} with ${tables.length} tables (1C-style)`);
        }
      } catch (error) {
        console.error(`Error updating template ${templateName}:`, error);
      }
    }

    console.log('Templates update with 1C-style types completed!');
  } catch (error) {
    console.error('Error updating templates:', error);
  } finally {
    // Close the database connection
    sqlite.close();
  }
}

// Run the update function
updateTemplatesWithNewTypes();