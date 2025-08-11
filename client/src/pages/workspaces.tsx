import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MoreHorizontal, 
  Archive, 
  Copy, 
  Database, 
  Pause, 
  Play,
  Building2,
  Users,
  HardDrive,
  Calendar
} from "lucide-react";
import { insertWorkspaceSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";

type WorkspaceFormData = z.infer<typeof insertWorkspaceSchema>;

export default function WorkspacesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: workspacesData, isLoading } = useQuery({
    queryKey: ["workspaces", searchTerm, statusFilter, typeFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
      });
      const response = await fetch(`/api/workspaces?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }
      return response.json();
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      return response.json();
    },
  });

  const { data: tariffs } = useQuery({
    queryKey: ["tariffs"],
    queryFn: async () => {
      const response = await fetch("/api/tariffs");
      if (!response.ok) {
        throw new Error("Failed to fetch tariffs");
      }
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: WorkspaceFormData) => {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WorkspaceFormData> }) => {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update workspace");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setEditingWorkspace(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/workspaces/${id}/archive`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to archive workspace");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async ({ id, name, slug }: { id: number; name: string; slug: string }) => {
      const response = await fetch(`/api/workspaces/${id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!response.ok) {
        throw new Error("Failed to clone workspace");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const backupMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name?: string }) => {
      const response = await fetch(`/api/workspaces/${id}/backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error("Failed to create backup");
      }
    },
    onSuccess: () => {
      alert("Backup created successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const data = {
      name,
      slug,
      description: formData.get("description") as string,
      ownerId: parseInt(formData.get("ownerId") as string),
      status: formData.get("status") as string,
      type: formData.get("type") as string,
      templateId: formData.get("templateId") ? parseInt(formData.get("templateId") as string) : undefined,
      tariffId: formData.get("tariffId") ? parseInt(formData.get("tariffId") as string) : undefined,
    };

    if (editingWorkspace) {
      updateMutation.mutate({ id: editingWorkspace.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      suspended: "secondary",
      archived: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      client: "bg-blue-100 text-blue-800",
      supplier: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {type}
      </Badge>
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Workspaces</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue="client">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ownerId">Owner</Label>
                <Select name="ownerId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tariffId">Tariff</Label>
                <Select name="tariffId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select tariff" />
                  </SelectTrigger>
                  <SelectContent>
                    {tariffs?.map((tariff: any) => (
                      <SelectItem key={tariff.id} value={tariff.id.toString()}>
                        {tariff.name} - ${(tariff.price / 100).toFixed(2)}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="templateId">Template (Optional)</Label>
                <Select name="templateId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template: any) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Workspace"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search workspaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspaces ({workspacesData?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Slug</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tariff</TableHead>
                <TableHead>Data Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspacesData?.workspaces?.map((workspace: any) => (
                <TableRow key={workspace.id}>
                  <TableCell>
                    <div>
                      <Link href={`/workspaces/${workspace.id}`}>
                        <div className="font-medium hover:text-blue-600 cursor-pointer">
                          {workspace.name}
                        </div>
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        /{workspace.slug}
                      </div>
                      {workspace.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {workspace.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {workspace.ownerName}
                      </div>
                      <div className="text-muted-foreground">
                        {workspace.ownerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(workspace.status)}</TableCell>
                  <TableCell>{getTypeBadge(workspace.type)}</TableCell>
                  <TableCell>
                    {workspace.tariffName ? (
                      <div className="text-sm">
                        <div>{workspace.tariffName}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No tariff</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <HardDrive className="h-3 w-3" />
                      {formatBytes(workspace.dataSize || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(workspace.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingWorkspace(workspace)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const name = prompt("Enter backup name (optional):");
                            if (name !== null) {
                              backupMutation.mutate({ id: workspace.id, name: name || undefined });
                            }
                          }}
                        >
                          <Database className="mr-2 h-4 w-4" />
                          Create Backup
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const name = prompt("Enter name for cloned workspace:", `${workspace.name} (Copy)`);
                            if (name) {
                              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                              cloneMutation.mutate({ id: workspace.id, name, slug });
                            }
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Clone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {workspace.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => {
                              updateMutation.mutate({ id: workspace.id, data: { status: 'suspended' } });
                            }}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        ) : workspace.status === 'suspended' ? (
                          <DropdownMenuItem
                            onClick={() => {
                              updateMutation.mutate({ id: workspace.id, data: { status: 'active' } });
                            }}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm("Are you sure you want to archive this workspace?")) {
                              archiveMutation.mutate(workspace.id);
                            }
                          }}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm("Are you sure you want to permanently delete this workspace?")) {
                              deleteMutation.mutate(workspace.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingWorkspace} onOpenChange={() => setEditingWorkspace(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
          </DialogHeader>
          {editingWorkspace && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingWorkspace.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingWorkspace.description || ""}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select name="type" defaultValue={editingWorkspace.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-ownerId">Owner</Label>
                <Select name="ownerId" defaultValue={editingWorkspace.ownerId?.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-tariffId">Tariff</Label>
                <Select name="tariffId" defaultValue={editingWorkspace.tariffId?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tariff" />
                  </SelectTrigger>
                  <SelectContent>
                    {tariffs?.map((tariff: any) => (
                      <SelectItem key={tariff.id} value={tariff.id.toString()}>
                        {tariff.name} - ${(tariff.price / 100).toFixed(2)}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Workspace"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}