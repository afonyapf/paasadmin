import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Eye, Settings, FileText, Database, History, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Template, Section, GlobalTableSchema } from "@shared/schema";

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  const { data: templates, isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery<{ sections: Section[]; total: number }>({
    queryKey: ["/api/sections"],
  });

  const { data: tableSchemasData, isLoading: tableSchemasLoading } = useQuery<{ schemas: GlobalTableSchema[]; total: number }>({
    queryKey: ["/api/table-schemas"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Template created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error creating template", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditingTemplate(null);
      toast({ title: "Template updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating template", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting template", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTemplate = (data: any) => {
    createMutation.mutate({
      ...data,
      config: data.config || {},
    });
  };

  const handleUpdateTemplate = (data: any) => {
    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: {
          ...data,
          config: data.config || editingTemplate.config,
        },
      });
    }
  };

  const handleDeleteTemplate = (id: number) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Шаблоны</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать шаблон
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            Список шаблонов
          </TabsTrigger>
          <TabsTrigger value="sections">
            <Settings className="w-4 h-4 mr-2" />
            Разделы платформы
          </TabsTrigger>
          <TabsTrigger value="table-schemas">
            <Database className="w-4 h-4 mr-2" />
            Структура таблиц
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <TemplateListTab 
            templates={filteredTemplates}
            isLoading={templatesLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onViewTemplate={handleViewTemplate}
            onEditTemplate={setEditingTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <SectionsTab 
            sections={sectionsData?.sections || []}
            isLoading={sectionsLoading}
          />
        </TabsContent>

        <TabsContent value="table-schemas" className="space-y-4">
          <TableSchemasTab 
            schemas={tableSchemasData?.schemas || []}
            isLoading={tableSchemasLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Создать новый шаблон</DialogTitle>
            <DialogDescription>
              Создание нового шаблона workspace
            </DialogDescription>
          </DialogHeader>
          <TemplateForm onSubmit={handleCreateTemplate} />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update the template information
            </DialogDescription>
          </DialogHeader>
          <TemplateForm 
            initialData={editingTemplate || undefined} 
            onSubmit={handleUpdateTemplate} 
          />
        </DialogContent>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTemplate?.name}</span>
              <Button variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Применить к workspace
              </Button>
            </DialogTitle>
            <DialogDescription>
              Редактор шаблона и его конфигурация
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateEditor template={selectedTemplate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateListTab({ 
  templates, 
  isLoading, 
  searchTerm, 
  setSearchTerm, 
  onViewTemplate, 
  onEditTemplate, 
  onDeleteTemplate 
}: {
  templates: Template[] | undefined;
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onViewTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (id: number) => void;
}) {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template List</CardTitle>
          <CardDescription>
            Manage workspace templates and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название шаблона</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Версия</TableHead>
                  <TableHead>Активен</TableHead>
                  <TableHead>Применён по умолчанию</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.type}</Badge>
                    </TableCell>
                    <TableCell>{template.version}</TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isDefault ? "default" : "secondary"}>
                        {template.isDefault ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTemplate(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function SectionsTab({ sections, isLoading }: { sections: Section[]; isLoading: boolean }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const { toast } = useToast();

  const createSectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create section");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Section created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error creating section", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/sections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update section");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      setEditingSection(null);
      toast({ title: "Section updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating section", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sections/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete section");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      toast({ title: "Section deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting section", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleCreateSection = (data: any) => {
    createSectionMutation.mutate(data);
  };

  const handleUpdateSection = (data: any) => {
    if (editingSection) {
      updateSectionMutation.mutate({
        id: editingSection.id,
        data,
      });
    }
  };

  const handleDeleteSection = (id: number) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      deleteSectionMutation.mutate(id);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Разделы платформы</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать раздел
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>
            Manage platform sections and features that can be included in templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading sections...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Родительский раздел</TableHead>
                  <TableHead>Тип доступа</TableHead>
                  <TableHead>Привязанная таблица</TableHead>
                  <TableHead>Системный</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections?.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell>{section.parentId ? sections.find(s => s.id === section.parentId)?.name : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={section.accessType === "open" ? "default" : "secondary"}>
                        {section.accessType}
                      </Badge>
                    </TableCell>
                    <TableCell>{section.tableName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={section.isSystem ? "default" : "secondary"}>
                        {section.isSystem ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={section.status ? "default" : "secondary"}>
                        {section.status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSection(section)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Section Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Создать новый раздел</DialogTitle>
            <DialogDescription>
              Создание нового раздела платформы
            </DialogDescription>
          </DialogHeader>
          <SectionForm onSubmit={handleCreateSection} sections={sections} />
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Update the section information
            </DialogDescription>
          </DialogHeader>
          <SectionForm 
            initialData={editingSection || undefined} 
            onSubmit={handleUpdateSection} 
            sections={sections}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function TableSchemasTab({ schemas, isLoading }: { schemas: GlobalTableSchema[]; isLoading: boolean }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState<GlobalTableSchema | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const { toast } = useToast();

  const createSchemaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/table-schemas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create table");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/table-schemas"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Таблица создана успешно" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ошибка создания таблицы", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateSchemaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/table-schemas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update table");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/table-schemas"] });
      setEditingSchema(null);
      toast({ title: "Таблица обновлена успешно" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ошибка обновления таблицы", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteSchemaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/table-schemas/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete table");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/table-schemas"] });
      toast({ title: "Таблица удалена успешно" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ошибка удаления таблицы", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleCreateSchema = (data: any) => {
    createSchemaMutation.mutate(data);
  };

  const handleUpdateSchema = (data: any) => {
    if (editingSchema) {
      updateSchemaMutation.mutate({
        id: editingSchema.id,
        data,
      });
    }
  };

  const handleDeleteSchema = (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить эту таблицу?")) {
      deleteSchemaMutation.mutate(id);
    }
  };

  const handleCloneSchema = (schema: GlobalTableSchema) => {
    // Create a copy of the schema with modified name and code
    const clonedSchema = {
      ...schema,
      name: `${schema.name} (копия)`,
      code: `${schema.code}_copy`,
      isSystem: false,
    };
    setEditingSchema(clonedSchema);
  };

  const schemaTypes = [
    { value: "directory", label: "📗 Справочники", icon: "📗" },
    { value: "document", label: "📘 Документы", icon: "📘" },
    { value: "register", label: "📙 Регистры", icon: "📙" },
    { value: "journal", label: "📒 Журналы", icon: "📒" },
    { value: "report", label: "📓 Отчёты", icon: "📓" },
    { value: "procedure", label: "📕 Обработки", icon: "📕" },
  ];

  const filteredSchemas = selectedType ? schemas.filter(schema => schema.type === selectedType) : schemas;

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Структура таблиц</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать таблицу
        </Button>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          variant={selectedType === "" ? "default" : "outline"}
          onClick={() => setSelectedType("")}
        >
          All Types
        </Button>
        {schemaTypes.map(type => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? "default" : "outline"}
            onClick={() => setSelectedType(type.value)}
          >
            {type.icon} {type.value}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Структура таблиц</CardTitle>
          <CardDescription>
            Централизованное управление таблицами, используемыми в шаблонах
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Загрузка таблиц...</div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {schemaTypes.map(type => {
                const typeSchemas = schemas.filter(schema => schema.type === type.value);
                return (
                  <AccordionItem key={type.value} value={type.value}>
                    <AccordionTrigger>
                      <div className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                        <Badge variant="secondary">{typeSchemas.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Название таблицы</TableHead>
                            <TableHead>Техническое имя</TableHead>
                            <TableHead>Тип</TableHead>
                            <TableHead>Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {typeSchemas.map((schema) => (
                            <TableRow key={schema.id}>
                              <TableCell className="font-medium">{schema.name}</TableCell>
                              <TableCell className="font-mono text-sm">{schema.code}</TableCell>
                              <TableCell>
                                <Badge variant={schema.isSystem ? "default" : "secondary"}>
                                  {schema.isSystem ? "Системная" : "Пользовательская"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingSchema(schema)}
                                    title="Редактировать"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSchema(schema.id)}
                                    title="Удалить"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCloneSchema(schema)}
                                    title="Создать на основе"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Create Table Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Создать новую таблицу</DialogTitle>
            <DialogDescription>
              Создание новой таблицы для использования в шаблонах
            </DialogDescription>
          </DialogHeader>
          <TableSchemaForm onSubmit={handleCreateSchema} schemaTypes={schemaTypes} />
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={!!editingSchema} onOpenChange={() => setEditingSchema(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingSchema?.id ? 'Редактировать таблицу' : 'Создать на основе'}</DialogTitle>
            <DialogDescription>
              {editingSchema?.id ? 'Обновление информации о таблице' : 'Создание новой таблицы на основе существующей'}
            </DialogDescription>
          </DialogHeader>
          <TableSchemaForm 
            initialData={editingSchema || undefined} 
            onSubmit={editingSchema?.id ? handleUpdateSchema : handleCreateSchema} 
            schemaTypes={schemaTypes}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function TemplateEditor({ template }: { template: Template }) {
  const { data: versions } = useQuery({
    queryKey: ["/api/templates", template.id, "versions"],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${template.id}/versions`);
      if (!response.ok) throw new Error("Failed to fetch versions");
      return response.json();
    },
  });

  const { data: sectionsData } = useQuery<{ sections: Section[]; total: number }>({
    queryKey: ["/api/sections"],
  });

  const { data: tableSchemasData } = useQuery<{ schemas: GlobalTableSchema[]; total: number }>({
    queryKey: ["/api/table-schemas"],
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Общая информация</TabsTrigger>
          <TabsTrigger value="tables">Структура таблиц</TabsTrigger>
          <TabsTrigger value="sections">Разделы</TabsTrigger>
          <TabsTrigger value="features">Фичи и роли</TabsTrigger>
          <TabsTrigger value="versions">История версий</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Описание</Label>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Тип</Label>
              <p className="text-sm text-muted-foreground">{template.type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Версия</Label>
              <p className="text-sm text-muted-foreground">{template.version}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Статус</Label>
              <div className="flex space-x-2">
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Активен" : "Неактивен"}
                </Badge>
                <Badge variant={template.isDefault ? "default" : "secondary"}>
                  {template.isDefault ? "По умолчанию" : "Не по умолчанию"}
                </Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Структура таблиц (на основе глобальных схем)</Label>
            <div className="mt-2 space-y-2">
              {tableSchemasData?.schemas.map((schema) => (
                <div key={schema.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium">{schema.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({schema.code})</span>
                  </div>
                  <Badge variant="secondary">{schema.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Разделы</Label>
            <div className="mt-2 space-y-2">
              {sectionsData?.sections.map((section) => (
                <div key={section.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium">{section.name}</span>
                    {section.description && (
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    )}
                  </div>
                  <Badge variant={section.accessType === "open" ? "default" : "secondary"}>
                    {section.accessType}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Список фич и ролей</Label>
            <div className="text-sm text-muted-foreground mt-2">
              Здесь будет отображаться список фич и ролей, связанных с шаблоном
            </div>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          {versions && versions.length > 0 ? (
            <div>
              <Label className="text-sm font-medium flex items-center">
                <History className="w-4 h-4 mr-2" />
                История версий
              </Label>
              <div className="mt-2 space-y-2">
                {versions.map((version: any) => (
                  <div key={version.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="font-medium">{version.version}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              История версий пуста
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateForm({ initialData, onSubmit }: { 
  initialData?: Template; 
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || "client",
    version: initialData?.version || "1.0",
    isActive: initialData?.isActive ?? true,
    isDefault: initialData?.isDefault ?? false,
    config: initialData?.config || {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Название</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="type">Тип</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Клиент</SelectItem>
            <SelectItem value="supplier">Поставщик</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="version">Версия</Label>
        <Input
          id="version"
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Активен</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
        />
        <Label htmlFor="isDefault">Применить по умолчанию</Label>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Обновить шаблон" : "Создать шаблон"}
      </Button>
    </form>
  );
}

function SectionForm({ initialData, onSubmit, sections }: { 
  initialData?: Section; 
  onSubmit: (data: any) => void;
  sections: Section[];
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    parentId: initialData?.parentId || null,
    tableName: initialData?.tableName || "",
    accessType: initialData?.accessType || "open",
    description: initialData?.description || "",
    isSystem: initialData?.isSystem ?? false,
    status: initialData?.status ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Название</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="parentId">Родительский раздел</Label>
        <Select
          value={formData.parentId?.toString() || "none"}
          onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? null : parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите родительский раздел" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Нет</SelectItem>
            {sections.map(section => (
              <SelectItem key={section.id} value={section.id.toString()}>
                {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tableName">Привязанная таблица</Label>
        <TableTreeSelect
          value={formData.tableName}
          onValueChange={(value) => setFormData({ ...formData, tableName: value })}
        />
      </div>

      <div>
        <Label htmlFor="accessType">Тип доступа</Label>
        <Select
          value={formData.accessType}
          onValueChange={(value) => setFormData({ ...formData, accessType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Открытый</SelectItem>
            <SelectItem value="restricted">Закрытый</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isSystem"
          checked={formData.isSystem}
          onCheckedChange={(checked) => setFormData({ ...formData, isSystem: checked })}
        />
        <Label htmlFor="isSystem">Системный раздел</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="status"
          checked={formData.status}
          onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
        />
        <Label htmlFor="status">Активен</Label>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Обновить раздел" : "Создать раздел"}
      </Button>
    </form>
  );
}

function TableSchemaForm({ initialData, onSubmit, schemaTypes }: { 
  initialData?: GlobalTableSchema; 
  onSubmit: (data: any) => void;
  schemaTypes: Array<{ value: string; label: string; icon: string }>;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    type: initialData?.type || "directory",
    isSystem: initialData?.isSystem ?? false,
    includeSystemFields: true,
    customFields: [] as Array<{
      name: string;
      type: string;
      required: boolean;
      reference?: string;
    }>,
  });

  const fieldTypes = [
    { value: "string", label: "Строка" },
    { value: "number", label: "Число" },
    { value: "boolean", label: "Логическое значение" },
    { value: "date", label: "Дата" },
    { value: "reference", label: "Ссылка" },
    { value: "select", label: "Выбор" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addCustomField = () => {
    setFormData({
      ...formData,
      customFields: [...formData.customFields, {
        name: "",
        type: "string",
        required: false,
      }],
    });
  };

  const removeCustomField = (index: number) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.filter((_, i) => i !== index),
    });
  };

  const updateCustomField = (index: number, field: Partial<typeof formData.customFields[0]>) => {
    const updatedFields = [...formData.customFields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFormData({ ...formData, customFields: updatedFields });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Название</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="code">Техническое имя</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Тип таблицы</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schemaTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="includeSystemFields"
          checked={formData.includeSystemFields}
          onCheckedChange={(checked) => setFormData({ ...formData, includeSystemFields: checked })}
        />
        <Label htmlFor="includeSystemFields">Включить системные поля (created_at, updated_at, status, external_id, owner_id)</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isSystem"
          checked={formData.isSystem}
          onCheckedChange={(checked) => setFormData({ ...formData, isSystem: checked })}
        />
        <Label htmlFor="isSystem">Системная таблица</Label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Пользовательские поля</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить поле
          </Button>
        </div>
        
        {formData.customFields.map((field, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Поле {index + 1}</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => removeCustomField(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Название</Label>
                <Input
                  value={field.name}
                  onChange={(e) => updateCustomField(index, { name: e.target.value })}
                  placeholder="Название поля"
                />
              </div>
              
              <div>
                <Label>Тип</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => updateCustomField(index, { type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => updateCustomField(index, { required: checked })}
                />
                <Label>Обязательное</Label>
              </div>
              
              {field.type === "reference" && (
                <div className="flex-1">
                  <Label>Справочник-ссылка</Label>
                  <Input
                    value={field.reference || ""}
                    onChange={(e) => updateCustomField(index, { reference: e.target.value })}
                    placeholder="Название справочника"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full">
        {initialData?.id ? "Обновить таблицу" : "Создать таблицу"}
      </Button>
    </form>
  );
}

function TableTreeSelect({ value, onValueChange }: { 
  value: string; 
  onValueChange: (value: string) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tableSchemasData } = useQuery<{ schemas: GlobalTableSchema[]; total: number }>({
    queryKey: ["/api/table-schemas"],
  });

  const schemaTypes = [
    { value: "directory", label: "📗 Справочники", icon: "📗" },
    { value: "document", label: "📘 Документы", icon: "📘" },
    { value: "register", label: "📙 Регистры", icon: "📙" },
    { value: "journal", label: "📒 Журналы", icon: "📒" },
    { value: "report", label: "📓 Отчёты", icon: "📓" },
    { value: "procedure", label: "📕 Обработки", icon: "📕" },
  ];

  const schemas = tableSchemasData?.schemas || [];
  
  // Filter schemas based on search term
  const filteredSchemas = schemas.filter(schema => 
    searchTerm === "" || 
    schema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schema.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedSchema = schemas.find(schema => schema.code === value);
  const selectedType = schemaTypes.find(type => type.value === selectedSchema?.type);

  const toggleTypeExpansion = (e: React.MouseEvent, typeValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeValue)) {
      newExpanded.delete(typeValue);
    } else {
      newExpanded.add(typeValue);
    }
    setExpandedTypes(newExpanded);
  };

  const handleSelectValue = (e: React.MouseEvent, selectedValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange(selectedValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Auto-expand types that contain matching schemas
    if (e.target.value) {
      const newExpanded = new Set<string>();
      schemaTypes.forEach(type => {
        const hasMatchingSchema = schemas.some(schema => 
          schema.type === type.value && 
          (schema.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
           schema.code.toLowerCase().includes(e.target.value.toLowerCase()))
        );
        if (hasMatchingSchema) {
          newExpanded.add(type.value);
        }
      });
      setExpandedTypes(newExpanded);
    }
  };

  const displayValue = selectedSchema 
    ? `${selectedType?.icon} ${selectedSchema.name} (${selectedSchema.code})`
    : "Выберите таблицу";

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        {displayValue}
        <span className="ml-2 h-4 w-4 shrink-0 opacity-50">▼</span>
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-1">
            <div className="px-2 py-2 border-b border-gray-200">
              <Input
                placeholder="Поиск по названию или коду таблицы..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-8"
                autoFocus
              />
            </div>
            <div 
              className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
              onClick={(e) => handleSelectValue(e, "")}
            >
              <span className="text-gray-500">Не выбрано</span>
            </div>
            
            {schemaTypes.map(type => {
              const typeSchemas = filteredSchemas.filter(schema => schema.type === type.value);
              const isExpanded = expandedTypes.has(type.value);
              
              if (typeSchemas.length === 0) return null;
              
              return (
                <div key={type.value}>
                  <div 
                    className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded flex items-center justify-between"
                    onClick={(e) => toggleTypeExpansion(e, type.value)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{type.icon}</span>
                      <span className="font-medium">{type.value}</span>
                      <Badge variant="secondary" className="text-xs">
                        {typeSchemas.length}
                      </Badge>
                    </div>
                    <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-4 border-l border-gray-200">
                      {typeSchemas.map(schema => {
                        // Highlight matching text
                        const highlightText = (text: string, search: string) => {
                          if (!search) return text;
                          const regex = new RegExp(`(${search})`, 'gi');
                          const parts = text.split(regex);
                          return parts.map((part, index) => 
                            regex.test(part) ? (
                              <span key={index} className="bg-yellow-200 font-medium">{part}</span>
                            ) : part
                          );
                        };

                        return (
                          <div
                            key={schema.id}
                            className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded flex items-center space-x-2"
                            onClick={(e) => handleSelectValue(e, schema.code)}
                          >
                            <span className="text-sm">
                              {highlightText(schema.name, searchTerm)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({highlightText(schema.code, searchTerm)})
                            </span>
                            {schema.isSystem && (
                              <Badge variant="outline" className="text-xs">
                                Системная
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}