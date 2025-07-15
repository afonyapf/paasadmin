import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Eye, Settings, FileText, Database, History } from "lucide-react";
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
        <h1 className="text-3xl font-bold">Templates</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            Template List
          </TabsTrigger>
          <TabsTrigger value="sections">
            <Settings className="w-4 h-4 mr-2" />
            Platform Sections
          </TabsTrigger>
          <TabsTrigger value="table-schemas">
            <Database className="w-4 h-4 mr-2" />
            Table Schemas
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
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new workspace template
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
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Template Details and Configuration
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateDetails template={selectedTemplate} />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Actions</TableHead>
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
        <h2 className="text-xl font-semibold">Platform Sections</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Section
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
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
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
            <DialogTitle>Create New Section</DialogTitle>
            <DialogDescription>
              Create a new platform section
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
      if (!response.ok) throw new Error("Failed to create schema");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/table-schemas"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Schema created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error creating schema", 
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
      if (!response.ok) throw new Error("Failed to update schema");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/table-schemas"] });
      setEditingSchema(null);
      toast({ title: "Schema updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating schema", 
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
      if (!response.ok) throw new Error("Failed to delete schema");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/table-schemas"] });
      toast({ title: "Schema deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting schema", 
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
    if (window.confirm("Are you sure you want to delete this schema?")) {
      deleteSchemaMutation.mutate(id);
    }
  };

  const schemaTypes = [
    { value: "directory", label: "📗 Directory", icon: "📗" },
    { value: "document", label: "📘 Document", icon: "📘" },
    { value: "register", label: "📙 Register", icon: "📙" },
    { value: "journal", label: "📒 Journal", icon: "📒" },
    { value: "report", label: "📓 Report", icon: "📓" },
    { value: "procedure", label: "📕 Procedure", icon: "📕" },
  ];

  const filteredSchemas = selectedType ? schemas.filter(schema => schema.type === selectedType) : schemas;

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Table Schemas</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Schema
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
          <CardTitle>Table Schemas</CardTitle>
          <CardDescription>
            Centralized management of table schemas used in templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading schemas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchemas?.map((schema) => (
                  <TableRow key={schema.id}>
                    <TableCell className="font-medium">{schema.name}</TableCell>
                    <TableCell className="font-mono text-sm">{schema.code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {schemaTypes.find(t => t.value === schema.type)?.icon} {schema.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={schema.isSystem ? "default" : "secondary"}>
                        {schema.isSystem ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSchema(schema)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchema(schema.id)}
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

      {/* Create Schema Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Schema</DialogTitle>
            <DialogDescription>
              Create a new table schema
            </DialogDescription>
          </DialogHeader>
          <TableSchemaForm onSubmit={handleCreateSchema} schemaTypes={schemaTypes} />
        </DialogContent>
      </Dialog>

      {/* Edit Schema Dialog */}
      <Dialog open={!!editingSchema} onOpenChange={() => setEditingSchema(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Schema</DialogTitle>
            <DialogDescription>
              Update the schema information
            </DialogDescription>
          </DialogHeader>
          <TableSchemaForm 
            initialData={editingSchema || undefined} 
            onSubmit={handleUpdateSchema} 
            schemaTypes={schemaTypes}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function TemplateDetails({ template }: { template: Template }) {
  const { data: versions } = useQuery({
    queryKey: ["/api/templates", template.id, "versions"],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${template.id}/versions`);
      if (!response.ok) throw new Error("Failed to fetch versions");
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Description</Label>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Type</Label>
          <p className="text-sm text-muted-foreground">{template.type}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Version</Label>
          <p className="text-sm text-muted-foreground">{template.version}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex space-x-2">
            <Badge variant={template.isActive ? "default" : "secondary"}>
              {template.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={template.isDefault ? "default" : "secondary"}>
              {template.isDefault ? "Default" : "Not Default"}
            </Badge>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Configuration</Label>
        <pre className="text-sm bg-muted p-4 rounded-md overflow-auto max-h-40">
          {JSON.stringify(template.config, null, 2)}
        </pre>
      </div>

      {versions && versions.length > 0 && (
        <div>
          <Label className="text-sm font-medium flex items-center">
            <History className="w-4 h-4 mr-2" />
            Version History
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
      )}
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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="version">Version</Label>
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
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
        />
        <Label htmlFor="isDefault">Default Template</Label>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Update Template" : "Create Template"}
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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="parentId">Parent Section</Label>
        <Select
          value={formData.parentId?.toString() || "none"}
          onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? null : parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select parent section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {sections.map(section => (
              <SelectItem key={section.id} value={section.id.toString()}>
                {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tableName">Table Name</Label>
        <Input
          id="tableName"
          value={formData.tableName}
          onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="accessType">Access Type</Label>
        <Select
          value={formData.accessType}
          onValueChange={(value) => setFormData({ ...formData, accessType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="restricted">Restricted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
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
        <Label htmlFor="isSystem">System Section</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="status"
          checked={formData.status}
          onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
        />
        <Label htmlFor="status">Active</Label>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Update Section" : "Create Section"}
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
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
          id="isSystem"
          checked={formData.isSystem}
          onCheckedChange={(checked) => setFormData({ ...formData, isSystem: checked })}
        />
        <Label htmlFor="isSystem">System Schema</Label>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Update Schema" : "Create Schema"}
      </Button>
    </form>
  );
}