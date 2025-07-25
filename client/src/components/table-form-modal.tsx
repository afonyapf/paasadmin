import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (table: TableMetadata) => void;
  table?: TableMetadata | null;
  mode: 'create' | 'edit';
}

export function TableFormModal({ isOpen, onClose, onSave, table, mode }: TableFormModalProps) {
  const [formData, setFormData] = useState<TableMetadata>({
    code: '',
    name: '',
    type: 'directory',
    isSystem: false,
    fields: []
  });

  const [editingField, setEditingField] = useState<TableField | null>(null);
  const [fieldForm, setFieldForm] = useState<TableField>({
    name: '',
    type: 'text',
    isSystem: false,
    isRequired: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [lastTranslatedName, setLastTranslatedName] = useState('');
  const [translationTimeout, setTranslationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Translate text using API
  const translateToEnglish = async (text: string): Promise<string> => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      return data.translated || text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, name }));
    
    if (mode === 'create' && name.trim()) {
      // Clear existing timeout
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      // Set new timeout for 2 seconds
      const timeout = setTimeout(async () => {
        // Check if name has changed since last translation
        if (name !== lastTranslatedName) {
          const translated = await translateToEnglish(name);
          setFormData(prev => ({ ...prev, code: translated }));
          setLastTranslatedName(name);
        }
      }, 2000);
      
      setTranslationTimeout(timeout);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
    };
  }, [translationTimeout]);

  useEffect(() => {
    if (table && mode === 'edit') {
      setFormData(table);
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'directory',
        isSystem: false,
        fields: []
      });
    }
  }, [table, mode, isOpen]);

  const fieldTypes = [
    { value: 'text', label: 'Текст' },
    { value: 'number', label: 'Число' },
    { value: 'date', label: 'Дата' },
    { value: 'select', label: 'Список' },
    { value: 'reference', label: 'Ссылка' }
  ];

  // Available tables grouped by type for reference selector
  const availableTables = {
    directory: [
      { code: 'clients', name: 'Клиенты' },
      { code: 'products', name: 'Номенклатура' },
      { code: 'suppliers', name: 'Поставщики' },
      { code: 'warehouses', name: 'Склады' }
    ],
    document: [
      { code: 'sales_orders', name: 'Заказы покупателей' },
      { code: 'purchase_orders', name: 'Заказы поставщикам' },
      { code: 'invoices', name: 'Счета на оплату' }
    ],
    register: [
      { code: 'stock_balance', name: 'Остатки товаров' },
      { code: 'payments', name: 'Расчеты с контрагентами' }
    ]
  };

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'directory': return 'Справочники';
      case 'document': return 'Документы';
      case 'register': return 'Регистры';
      default: return 'Прочее';
    }
  };

  const tableTypes = [
    { value: 'directory', label: 'Справочник', icon: '📗' },
    { value: 'document', label: 'Документ', icon: '📘' },
    { value: 'register', label: 'Регистр', icon: '📙' },
    { value: 'journal', label: 'Журнал', icon: '📒' },
    { value: 'report', label: 'Отчёт', icon: '📓' },
    { value: 'procedure', label: 'Обработка', icon: '📕' }
  ];

  const handleSave = async () => {
    try {
      const tableId = mode === 'edit' && table ? (table as any).id : null;
      const url = mode === 'create' ? '/api/table-schemas' : `/api/table-schemas/${tableId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          type: formData.type,
          isSystem: formData.isSystem,
          fields: formData.fields
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save table');
      }
      
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Ошибка при сохранении таблицы');
    }
  };

  const handleAddField = () => {
    if (fieldForm.name) {
      setFormData(prev => ({
        ...prev,
        fields: [...(prev.fields || []), { ...fieldForm }]
      }));
      setFieldForm({
        name: '',
        type: 'text',
        isSystem: false,
        isRequired: false
      });
    }
  };

  const handleEditField = (field: TableField, index: number) => {
    setEditingField(field);
    setFieldForm({ ...field });
  };

  const handleUpdateField = () => {
    if (editingField && fieldForm.name) {
      setFormData(prev => ({
        ...prev,
        fields: (prev.fields || []).map(f => f === editingField ? { ...fieldForm } : f)
      }));
      setEditingField(null);
      setFieldForm({
        name: '',
        type: 'text',
        isSystem: false,
        isRequired: false
      });
    }
  };

  const handleDeleteField = (field: TableField) => {
    setFormData(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(f => f !== field)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Создание таблицы' : 'Редактирование таблицы'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название</label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Название таблицы"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Технический код</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="table_code"
              />
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Тип таблицы</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full p-2 border rounded"
            >
              {tableTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* System Table Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isSystem"
              checked={formData.isSystem}
              onChange={(e) => setFormData(prev => ({ ...prev, isSystem: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="isSystem" className="text-sm font-medium">
              Системная таблица (только для чтения)
            </label>
          </div>

          {/* Fields Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Поля таблицы</h3>
            
            {/* Add/Edit Field Form */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">
                  {editingField ? 'Редактирование поля' : 'Добавление поля'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Название поля</label>
                    <Input
                      value={fieldForm.name}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="field_name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Тип поля</label>
                    <select
                      value={fieldForm.type}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {fieldForm.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Варианты (по одному на строку)</label>
                    <textarea
                      value={fieldForm.options?.join('\n') || ''}
                      onChange={(e) => setFieldForm(prev => ({ 
                        ...prev, 
                        options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                      }))}
                      placeholder="вариант1\nвариант2\nвариант3"
                      className="w-full p-2 border rounded h-24 resize-none"
                    />
                  </div>
                )}

                {fieldForm.type === 'reference' && (
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">Ссылка на таблицу</label>
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Поиск таблицы или выберите из списка..."
                      onFocus={() => setSearchTerm(searchTerm || ' ')}
                    />
                    {(searchTerm || searchTerm === ' ') && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {Object.entries(availableTables).map(([type, tables]) => {
                          const filteredTables = searchTerm.trim() 
                            ? tables.filter(table => 
                                table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                table.code.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                            : tables;
                          if (filteredTables.length === 0) return null;
                          return (
                            <div key={type}>
                              <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                                {getTypeTitle(type)}
                              </div>
                              {filteredTables.map(table => (
                                <div
                                  key={table.code}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    setFieldForm(prev => ({ ...prev, referenceTable: table.code }));
                                    setSearchTerm('');
                                  }}
                                >
                                  <div className="font-medium">{table.name}</div>
                                  <div className="text-xs text-gray-500">{table.code}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {fieldForm.referenceTable && (
                      <div className="mt-2 p-2 bg-blue-50 rounded flex justify-between items-center">
                        <span className="text-sm">Выбрано: {fieldForm.referenceTable}</span>
                        <button
                          type="button"
                          onClick={() => setFieldForm(prev => ({ ...prev, referenceTable: '' }))}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={fieldForm.isRequired}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                    />
                    <span className="text-sm">Обязательное</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={fieldForm.isSystem}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, isSystem: e.target.checked }))}
                    />
                    <span className="text-sm">Системное</span>
                  </label>
                </div>

                <div className="flex space-x-2">
                  {editingField ? (
                    <>
                      <Button onClick={handleUpdateField}>Обновить поле</Button>
                      <Button variant="outline" onClick={() => {
                        setEditingField(null);
                        setFieldForm({ name: '', type: 'text', isSystem: false, isRequired: false });
                      }}>
                        Отмена
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleAddField}>Добавить поле</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fields List */}
            {formData.fields && formData.fields.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Поля таблицы ({formData.fields.length})</h4>
                {formData.fields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{field.name}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-100 rounded">{field.type}</span>
                        {field.isRequired && <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded">Обязательное</span>}
                        {field.isSystem && <span className="px-2 py-0.5 bg-gray-100 rounded">Системное</span>}
                        {field.referenceTable && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">→ {field.referenceTable}</span>}
                      </div>
                      {field.options && (
                        <div className="text-xs text-gray-500 mt-1">
                          Варианты: {field.options.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditField(field, index)}>
                        Изменить
                      </Button>
                      {!field.isSystem && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteField(field)}>
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Создать таблицу' : 'Сохранить изменения'}
          </Button>
        </div>
      </div>
    </div>
  );
}