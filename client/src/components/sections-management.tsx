import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

interface Section {
  id: number;
  name: string;
  parentId?: number;
  tableName?: string;
  accessType: 'open' | 'restricted';
  applicability: 'global' | 'local';
  isSystem: boolean;
  isEnabled: boolean;
  description?: string;
  createdAt: string;
}

interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<Section>) => void;
  section?: Section | null;
  mode: 'create' | 'edit';
  tables: Array<{code: string, name: string}>;
  sections: Section[];
}

function SectionFormModal({ isOpen, onClose, onSave, section, mode, tables, sections }: SectionFormModalProps) {
  const [formData, setFormData] = useState<Partial<Section>>({
    name: '',
    parentId: undefined,
    tableName: '',
    accessType: 'open',
    applicability: 'local',
    description: ''
  });

  useEffect(() => {
    if (section && mode === 'edit') {
      setFormData(section);
    } else {
      setFormData({
        name: '',
        parentId: undefined,
        tableName: '',
        accessType: 'open',
        applicability: 'local',
        description: ''
      });
    }
  }, [section, mode, isOpen]);

  const handleSave = async () => {
    try {
      const url = mode === 'create' ? '/api/sections' : `/api/sections/${section?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to save section');
      
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Ошибка при сохранении раздела');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Создание раздела' : 'Редактирование раздела'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Название *</label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Название раздела"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Родительский раздел</label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Без родителя</option>
              {sections.filter(s => s.id !== section?.id).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Таблица</label>
            <select
              value={formData.tableName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, tableName: e.target.value || undefined }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Не привязано</option>
              {tables.map(table => (
                <option key={table.code} value={table.code}>{table.name} ({table.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Тип доступа</label>
              <select
                value={formData.accessType}
                onChange={(e) => setFormData(prev => ({ ...prev, accessType: e.target.value as 'open' | 'restricted' }))}
                className="w-full p-2 border rounded"
              >
                <option value="open">Открытый</option>
                <option value="restricted">Закрытый</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Применимость</label>
              <select
                value={formData.applicability}
                onChange={(e) => setFormData(prev => ({ ...prev, applicability: e.target.value as 'global' | 'local' }))}
                className="w-full p-2 border rounded"
              >
                <option value="local">Локальный</option>
                <option value="global">Глобальный</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Описание раздела"
              className="w-full p-2 border rounded h-20 resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SectionsManagement() {
  const [sections, setSections] = useState<Section[]>([]);
  const [tables, setTables] = useState<Array<{code: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    applicability: '',
    accessType: ''
  });

  useEffect(() => {
    fetchSections();
    fetchTables();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections');
      if (!response.ok) throw new Error('Failed to fetch sections');
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/table-schemas');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data.map((t: any) => ({ code: t.code, name: t.name })));
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleEdit = (section: Section) => {
    setModalMode('edit');
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleDelete = async (section: Section) => {
    if (section.isSystem) {
      alert('Системный раздел нельзя удалить');
      return;
    }
    
    if (confirm(`Вы уверены, что хотите удалить раздел "${section.name}"?`)) {
      try {
        const response = await fetch(`/api/sections/${section.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete section');
        fetchSections();
      } catch (error) {
        alert('Ошибка при удалении раздела');
      }
    }
  };

  const handleToggle = async (section: Section) => {
    try {
      const response = await fetch(`/api/sections/${section.id}/toggle`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to toggle section');
      fetchSections();
    } catch (error) {
      alert('Ошибка при изменении статуса');
    }
  };

  const handleSave = () => {
    fetchSections();
  };

  const filteredSections = sections.filter(section => {
    if (filters.status && (filters.status === 'enabled' ? !section.isEnabled : section.isEnabled)) return false;
    if (filters.applicability && section.applicability !== filters.applicability) return false;
    if (filters.accessType && section.accessType !== filters.accessType) return false;
    return true;
  });

  if (loading) {
    return <div className="p-4 text-center">Загрузка разделов...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Управление разделами</h2>
        <Button onClick={handleCreate}>Создать раздел</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Статус</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="">Все</option>
                <option value="enabled">Включен</option>
                <option value="disabled">Отключен</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Применимость</label>
              <select
                value={filters.applicability}
                onChange={(e) => setFilters(prev => ({ ...prev, applicability: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="">Все</option>
                <option value="global">Глобальный</option>
                <option value="local">Локальный</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Тип доступа</label>
              <select
                value={filters.accessType}
                onChange={(e) => setFilters(prev => ({ ...prev, accessType: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="">Все</option>
                <option value="open">Открытый</option>
                <option value="restricted">Закрытый</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections Table */}
      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Название</th>
              <th className="text-left p-4 font-medium">Таблица</th>
              <th className="text-left p-4 font-medium">Тип доступа</th>
              <th className="text-left p-4 font-medium">Применимость</th>
              <th className="text-left p-4 font-medium">Статус</th>
              <th className="text-left p-4 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredSections.map((section) => (
              <tr key={section.id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <div className="font-medium">{section.name}</div>
                    {section.description && (
                      <div className="text-sm text-gray-500">{section.description}</div>
                    )}
                    {section.isSystem && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mt-1">
                        Системный
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {section.tableName ? (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {section.tableName}
                    </span>
                  ) : (
                    <span className="text-gray-500">не привязано</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    section.accessType === 'open' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {section.accessType === 'open' ? 'Открытый' : 'Закрытый'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    section.applicability === 'global' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {section.applicability === 'global' ? 'Глобальный' : 'Локальный'}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggle(section)}
                    className={`px-2 py-1 text-xs rounded ${
                      section.isEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {section.isEnabled ? 'Включен' : 'Отключен'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(section)}>
                      ✏️
                    </Button>
                    {!section.isSystem && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(section)}>
                        🗑️
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        section={editingSection}
        mode={modalMode}
        tables={tables}
        sections={sections}
      />
    </div>
  );
}