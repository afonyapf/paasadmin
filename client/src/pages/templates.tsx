import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { TableFormModal } from "../components/table-form-modal";
import { SectionsManagement } from "../components/sections-management";

interface TableField {
  name: string;
  type: string;
  isSystem: boolean;
  isRequired?: boolean;
  options?: string[];
  referenceTable?: string;
}

interface TableMetadata {
  id?: number;
  code: string;
  name: string;
  type: 'directory' | 'document' | 'register' | 'journal' | 'report' | 'procedure';
  isSystem: boolean;
  icon?: string;
  color?: string;
  fields: TableField[];
}

interface Template {
  id: number;
  name: string;
  description: string;
  type: string;
  version: string;
  isActive: boolean;
  isDefault: boolean;
  config: string;
  tables: string;
  tariffId: number;
}

// Tables Library Component
function TablesLibrary({ selectedTable, onTableSelect }: { 
  selectedTable: TableMetadata | null;
  onTableSelect: (table: TableMetadata) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['directory', 'document']));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTable, setEditingTable] = useState<TableMetadata | null>(null);
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/table-schemas');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки таблиц');
    } finally {
      setLoading(false);
    }
  };

  const groupTablesByType = (tables: TableMetadata[]) => {
    return tables.reduce((groups, table) => {
      const type = table.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(table);
      return groups;
    }, {} as Record<string, TableMetadata[]>);
  };

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'directory': return '📗';
      case 'document': return '📘';
      case 'register': return '📙';
      case 'journal': return '📒';
      case 'report': return '📓';
      case 'procedure': return '📕';
      default: return '📋';
    }
  };

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'directory': return 'Справочники';
      case 'document': return 'Документы';
      case 'register': return 'Регистры';
      case 'journal': return 'Журналы';
      case 'report': return 'Отчёты';
      case 'procedure': return 'Обработки';
      default: return 'Прочее';
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'directory': return 'Единицы, номенклатура, пользователи, склады и пр.';
      case 'document': return 'Заказы, тендеры, акты';
      case 'register': return 'Учёт остатков, движений, балансов';
      case 'journal': return 'История активности, действия пользователей';
      case 'report': return 'Генерация агрегированной информации';
      case 'procedure': return 'Сценарии, миграции, массовые операции';
      default: return '';
    }
  };

  const handleCreateTable = (type?: string) => {
    setModalMode('create');
    setEditingTable(null);
    setIsModalOpen(true);
  };

  const handleEditTable = (table: TableMetadata) => {
    setModalMode('edit');
    setEditingTable(table);
    setIsModalOpen(true);
  };

  const handleSaveTable = (table: TableMetadata) => {
    fetchTables(); // Refresh tables after save
    setIsModalOpen(false);
  };

  const handleDeleteTable = async (table: TableMetadata) => {
    if (confirm(`Вы уверены, что хотите удалить таблицу "${table.name}"?`)) {
      try {
        const tableId = (table as any).id;
        const response = await fetch(`/api/table-schemas/${tableId}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete table');
        fetchTables(); // Refresh tables after delete
      } catch (err) {
        alert('Ошибка при удалении таблицы');
      }
    }
  };

  const groupedTables = groupTablesByType(tables);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Библиотека структур таблиц</h2>
        <Button size="sm" onClick={() => handleCreateTable()}>Добавить таблицу</Button>
      </div>
      
      {loading ? (
        <div className="p-4 text-center text-gray-500">Загрузка таблиц...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Тип / Название</th>
                <th className="text-left p-4 font-medium">Назначение</th>
                <th className="text-left p-4 font-medium">Количество</th>
                <th className="text-left p-4 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedTables).map(([type, tables]) => (
                <React.Fragment key={type}>
                  <tr className="border-t bg-gray-25 hover:bg-gray-50">
                    <td className="p-4">
                      <button
                        className="flex items-center space-x-2 w-full text-left"
                        onClick={() => toggleGroup(type)}
                      >
                        <span className="text-sm">
                          {expandedGroups.has(type) ? '▼' : '▶'}
                        </span>
                        <span className="text-lg">{getTypeIcon(type)}</span>
                        <span className="font-medium">{getTypeTitle(type)}</span>
                      </button>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {getTypeDescription(type)}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {tables.length} таблиц
                    </td>
                    <td className="p-4">
                      <Button variant="outline" size="sm" onClick={() => handleCreateTable(type)}>Добавить</Button>
                    </td>
                  </tr>
                  {expandedGroups.has(type) && tables.map((table) => (
                    <tr 
                      key={table.code} 
                      className={`border-t cursor-pointer hover:bg-blue-50 ${
                        selectedTable?.code === table.code ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => onTableSelect(table)}
                    >
                      <td className="p-4 pl-12">
                        <div>
                          <div className="font-medium text-sm">{table.name}</div>
                          <div className="text-xs text-gray-500">{table.code}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          {table.isSystem && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              Системная
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {table.fields?.length ?? 0} полей
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditTable(table)}>Редактировать</Button>
                          {!table.isSystem && (
                            <Button variant="destructive" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTable(table);
                            }}>Удалить</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <TableFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTable}
        table={editingTable}
        mode={modalMode}
      />
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'sections' | 'tables'>('templates');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const parseTemplateData = (template: Template) => {
    try {
      const config = JSON.parse(template.config);
      const tables = JSON.parse(template.tables || '[]') as TableMetadata[];
      return { config, tables };
    } catch (e) {
      return { 
        config: { error: "Error parsing config" }, 
        tables: [] as TableMetadata[]
      };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Templates Management</h1>
        <Button>New Template</Button>
      </div>

      {/* Main Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          className={`px-6 py-3 rounded-t-lg font-medium ${
            activeTab === 'templates'
              ? 'bg-white border-t border-l border-r text-blue-600 border-b-0'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('templates')}
        >
          Шаблоны
        </button>
        <button
          className={`px-6 py-3 rounded-t-lg font-medium ${
            activeTab === 'sections'
              ? 'bg-white border-t border-l border-r text-blue-600 border-b-0'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('sections')}
        >
          Разделы платформы
        </button>
        <button
          className={`px-6 py-3 rounded-t-lg font-medium ${
            activeTab === 'tables'
              ? 'bg-white border-t border-l border-r text-blue-600 border-b-0'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('tables')}
        >
          Таблицы
        </button>
      </div>

      <div className="bg-white border rounded-lg">
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Шаблоны Workspace</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Назначение:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Создание workspace при регистрации или вручную</li>
                  <li>• Базируются на типе (Клиент, Поставщик)</li>
                </ul>
                <h3 className="font-medium text-blue-900 mb-2 mt-3">Содержат:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Роли и их права</li>
                  <li>• Структуру разделов (через секции)</li>
                  <li>• Разделение на системные и пользовательские сущности</li>
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTemplate(template)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>v{template.version} • {template.type}</CardDescription>
                      </div>
                      <div className="flex flex-col space-y-1">
                        {template.isDefault && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            По умолчанию
                          </span>
                        )}
                        {template.isActive ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Активен
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Неактивен
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">Таблицы</div>
                        <div className="text-gray-600">{parseTemplateData(template).tables.length}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">Тип</div>
                        <div className="text-gray-600 capitalize">{template.type}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="p-6">
            <SectionsManagement />
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="p-6">
            <TablesLibrary 
              selectedTable={selectedTable}
              onTableSelect={setSelectedTable}
            />
          </div>
        )}
      </div>
    </div>
  );
}