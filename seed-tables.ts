import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import Database from 'better-sqlite3';
import * as schema from './shared/schema';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './database.db';
console.log(`Connecting to database at: ${dbPath}`);

const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function seedTables() {
  try {
    console.log('Seeding table schemas...');

    const tables = [
      {
        name: 'Продукты',
        code: 'products',
        type: 'directory',
        isSystem: true,
        fields: [
          { name: 'name', type: 'text', isSystem: true, isRequired: true },
          { name: 'sku', type: 'text', isSystem: true, isRequired: true },
          { name: 'barcode', type: 'text', isSystem: true, isRequired: false },
          { name: 'volume', type: 'number', isSystem: true, isRequired: false }
        ]
      },
      {
        name: 'Заказы',
        code: 'orders',
        type: 'document',
        isSystem: true,
        fields: [
          { name: 'order_date', type: 'date', isSystem: true, isRequired: true },
          { name: 'status', type: 'select', isSystem: true, isRequired: true, options: ['новый', 'в работе', 'выполнен', 'отменен'] },
          { name: 'total_price', type: 'number', isSystem: true, isRequired: true }
        ]
      },
      {
        name: 'Тендеры',
        code: 'tenders',
        type: 'document',
        isSystem: true,
        fields: [
          { name: 'title', type: 'text', isSystem: true, isRequired: true },
          { name: 'deadline', type: 'date', isSystem: true, isRequired: true },
          { name: 'attachments', type: 'text', isSystem: true, isRequired: false }
        ]
      },
      {
        name: 'Клиенты',
        code: 'clients',
        type: 'directory',
        isSystem: true,
        fields: [
          { name: 'name', type: 'text', isSystem: true, isRequired: true },
          { name: 'inn', type: 'text', isSystem: true, isRequired: false },
          { name: 'region', type: 'select', isSystem: true, isRequired: false, options: ['Москва', 'СПб', 'Регионы'] }
        ]
      },
      {
        name: 'Остатки на складах',
        code: 'warehouse_balance',
        type: 'register',
        isSystem: true,
        fields: [
          { name: 'product_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'products' },
          { name: 'quantity', type: 'number', isSystem: true, isRequired: true },
          { name: 'warehouse_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'warehouses' }
        ]
      },
      {
        name: 'Склады',
        code: 'warehouses',
        type: 'directory',
        isSystem: true,
        fields: [
          { name: 'name', type: 'text', isSystem: true, isRequired: true },
          { name: 'address', type: 'text', isSystem: true, isRequired: false },
          { name: 'manager', type: 'text', isSystem: true, isRequired: false }
        ]
      },
      {
        name: 'Поставщики',
        code: 'suppliers',
        type: 'directory',
        isSystem: true,
        fields: [
          { name: 'name', type: 'text', isSystem: true, isRequired: true },
          { name: 'inn', type: 'text', isSystem: true, isRequired: true },
          { name: 'contact_person', type: 'text', isSystem: true, isRequired: false },
          { name: 'phone', type: 'text', isSystem: true, isRequired: false }
        ]
      },
      {
        name: 'Журнал активности',
        code: 'activity_log',
        type: 'journal',
        isSystem: true,
        fields: [
          { name: 'timestamp', type: 'date', isSystem: true, isRequired: true },
          { name: 'user_id', type: 'reference', isSystem: true, isRequired: true, referenceTable: 'users' },
          { name: 'action', type: 'text', isSystem: true, isRequired: true },
          { name: 'details', type: 'text', isSystem: true, isRequired: false }
        ]
      },
      {
        name: 'Отчет по продажам',
        code: 'sales_report',
        type: 'report',
        isSystem: false,
        fields: [
          { name: 'period_start', type: 'date', isSystem: true, isRequired: true },
          { name: 'period_end', type: 'date', isSystem: true, isRequired: true },
          { name: 'total_amount', type: 'number', isSystem: true, isRequired: true },
          { name: 'client_filter', type: 'reference', isSystem: false, isRequired: false, referenceTable: 'clients' }
        ]
      },
      {
        name: 'Импорт данных',
        code: 'data_import',
        type: 'procedure',
        isSystem: false,
        fields: [
          { name: 'file_path', type: 'text', isSystem: true, isRequired: true },
          { name: 'import_type', type: 'select', isSystem: true, isRequired: true, options: ['продукты', 'клиенты', 'заказы'] },
          { name: 'status', type: 'select', isSystem: true, isRequired: true, options: ['ожидание', 'выполняется', 'завершен', 'ошибка'] }
        ]
      }
    ];

    for (const table of tables) {
      try {
        // Check if table already exists
        const existing = await db.select().from(schema.globalTableSchemas)
          .where(eq(schema.globalTableSchemas.code, table.code));
        
        if (existing.length > 0) {
          console.log(`Table ${table.code} already exists, skipping...`);
          continue;
        }

        // Create table schema
        const [tableSchema] = await db.insert(schema.globalTableSchemas).values({
          name: table.name,
          code: table.code,
          type: table.type,
          isSystem: table.isSystem
        }).returning();

        // Create fields
        for (const field of table.fields) {
          await db.insert(schema.globalTableFields).values({
            schemaId: tableSchema.id,
            name: field.name,
            label: field.name,
            type: field.type,
            isRequired: field.isRequired || false,
            isSystem: field.isSystem || false,
            referenceTable: field.referenceTable || null,
            options: field.options ? JSON.stringify(field.options) : null
          });
        }

        console.log(`Created table: ${table.name} (${table.code}) with ${table.fields.length} fields`);
      } catch (error) {
        console.error(`Error creating table ${table.code}:`, error);
      }
    }

    console.log('Table schemas seeding completed!');
  } catch (error) {
    console.error('Error seeding table schemas:', error);
  } finally {
    sqlite.close();
  }
}

seedTables();