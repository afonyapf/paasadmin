import { Hono } from "hono";
import { db } from "../db";
import { globalTableSchemas, globalTableFields } from "../../shared/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

// Get all tables
app.get("/", async (c) => {
  try {
    const tables = await db.select().from(globalTableSchemas);
    const tablesWithFields = await Promise.all(
      tables.map(async (table) => {
        const fields = await db.select().from(globalTableFields)
          .where(eq(globalTableFields.schemaId, table.id));
        return {
          ...table,
          fields: fields.map(field => ({
            ...field,
            options: field.options ? JSON.parse(field.options) : undefined
          }))
        };
      })
    );
    return c.json(tablesWithFields);
  } catch (error) {
    return c.json({ error: "Failed to fetch tables" }, 500);
  }
});

// Create table
app.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const { name, code, type, isSystem, fields } = data;

    // Create table schema
    const [tableSchema] = await db.insert(globalTableSchemas).values({
      name,
      code,
      type,
      isSystem
    }).returning();

    // Create fields
    if (fields && fields.length > 0) {
      await db.insert(globalTableFields).values(
        fields.map((field: any) => ({
          schemaId: tableSchema.id,
          name: field.name,
          label: field.name,
          type: field.type,
          isRequired: field.isRequired || false,
          isSystem: field.isSystem || false,
          referenceTable: field.referenceTable,
          options: field.options ? JSON.stringify(field.options) : null
        }))
      );
    }

    return c.json({ success: true, id: tableSchema.id });
  } catch (error) {
    return c.json({ error: "Failed to create table" }, 500);
  }
});

// Update table
app.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const data = await c.req.json();
    const { name, code, type, isSystem, fields } = data;

    // Update table schema
    await db.update(globalTableSchemas)
      .set({ name, code, type, isSystem })
      .where(eq(globalTableSchemas.id, id));

    // Delete existing fields
    await db.delete(globalTableFields)
      .where(eq(globalTableFields.schemaId, id));

    // Create new fields
    if (fields && fields.length > 0) {
      await db.insert(globalTableFields).values(
        fields.map((field: any) => ({
          schemaId: id,
          name: field.name,
          label: field.name,
          type: field.type,
          isRequired: field.isRequired || false,
          isSystem: field.isSystem || false,
          referenceTable: field.referenceTable,
          options: field.options ? JSON.stringify(field.options) : null
        }))
      );
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to update table" }, 500);
  }
});

// Delete table
app.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    
    // Delete fields first
    await db.delete(globalTableFields)
      .where(eq(globalTableFields.schemaId, id));
    
    // Delete table schema
    await db.delete(globalTableSchemas)
      .where(eq(globalTableSchemas.id, id));

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete table" }, 500);
  }
});

// Translate text
app.post("/translate", async (c) => {
  try {
    const { text } = await c.req.json();
    
    // Simple translation dictionary
    const dictionary: Record<string, string> = {
      'новая': 'new', 'таблица': 'table', 'клиенты': 'clients',
      'пользователи': 'users', 'заказы': 'orders', 'товары': 'products',
      'поставщики': 'suppliers', 'склады': 'warehouses',
      'отчет': 'report', 'документ': 'document', 'справочник': 'directory',
      'регистр': 'register', 'журнал': 'journal', 'обработка': 'procedure',
      'номенклатура': 'nomenclature', 'счета': 'invoices', 'платежи': 'payments',
      'остатки': 'balance', 'движения': 'movements', 'активность': 'activity'
    };
    
    const translated = text.toLowerCase()
      .split(/\s+/)
      .map((word: string) => dictionary[word] || word)
      .join('_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    return c.json({ translated });
  } catch (error) {
    return c.json({ error: "Failed to translate" }, 500);
  }
});

export default app;