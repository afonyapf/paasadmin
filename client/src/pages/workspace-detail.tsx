import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Checkbox } from "../components/ui/checkbox";
import { 
  Settings, 
  Users, 
  BarChart3, 
  FileText, 
  Building2, 
  CreditCard,
  Shield,
  Edit,
  Plus,
  Trash2,
  UserPlus,
  Download,
  Search
} from "lucide-react";

export default function WorkspaceDetailPage() {
  const [match, params] = useRoute("/workspaces/:id");
  const workspaceId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("settings");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch workspace");
      }
      return response.json();
    },
    enabled: !!workspaceId,
  });

  const { data: members } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return response.json();
    },
    enabled: !!workspaceId,
  });

  const { data: companies } = useQuery({
    queryKey: ["workspace-companies", workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/companies`);
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      return response.json();
    },
    enabled: !!workspaceId,
  });

  const { data: allCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      return response.json();
    },
  });

  const { data: backups } = useQuery({
    queryKey: ["workspace-backups", workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/backups`);
      if (!response.ok) {
        throw new Error("Failed to fetch backups");
      }
      return response.json();
    },
    enabled: !!workspaceId,
  });

  const { data: usageMetrics } = useQuery({
    queryKey: ["workspace-usage", workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/usage`);
      if (!response.ok) {
        throw new Error("Failed to fetch usage metrics");
      }
      return response.json();
    },
    enabled: !!workspaceId,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const response = await fetch("/api/sections");
      if (!response.ok) {
        throw new Error("Failed to fetch sections");
      }
      return response.json();
    },
  });

  const { data: accessControl } = useQuery({
    queryKey: ["workspace-access-control", workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/access-control`);
      if (!response.ok) {
        throw new Error("Failed to fetch access control");
      }
      return response.json();
    },
    enabled: !!workspaceId,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { userId: number; role: string }) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to invite member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
      setIsInviteDialogOpen(false);
    },
  });

  const updateCompaniesMutation = useMutation({
    mutationFn: async (companyIds: number[]) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/companies`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIds }),
      });
      if (!response.ok) {
        throw new Error("Failed to update companies");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-companies", workspaceId] });
    },
  });

  const updateAccessControlMutation = useMutation({
    mutationFn: async (accessRules: any[]) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/access-control`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessRules }),
      });
      if (!response.ok) {
        throw new Error("Failed to update access control");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-access-control", workspaceId] });
    },
  });

  if (!workspaceId) {
    return <div>Invalid workspace ID</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-800",
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[role] || "bg-gray-100 text-gray-800"}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{workspace?.name}</h1>
        <p className="text-muted-foreground">/{workspace?.slug}</p>
        {workspace?.description && (
          <p className="text-sm text-muted-foreground mt-2">{workspace.description}</p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Workspace Name</Label>
                  <Input defaultValue={workspace?.name} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input defaultValue={workspace?.slug} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea defaultValue={workspace?.description} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select defaultValue={workspace?.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup & Clone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Recent Backups</h4>
                  <div className="space-y-2">
                    {backups?.slice(0, 3).map((backup: any) => (
                      <div key={backup.id} className="flex justify-between items-center text-sm">
                        <span>{backup.name}</span>
                        <span className="text-muted-foreground">
                          {new Date(backup.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                  <Button variant="outline" size="sm">
                    Clone Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Workspace Members</h2>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Member</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    inviteMemberMutation.mutate({
                      userId: parseInt(formData.get("userId") as string),
                      role: formData.get("role") as string,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="userId">User</Label>
                    <Select name="userId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* This would be populated with available users */}
                        <SelectItem value="1">John Doe (john@example.com)</SelectItem>
                        <SelectItem value="2">Jane Smith (jane@example.com)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="viewer">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Send Invitation
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.userName}</div>
                          <div className="text-sm text-muted-foreground">{member.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "Pending"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>API Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4 GB</div>
                <p className="text-sm text-muted-foreground">of 10 GB limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-sm text-muted-foreground">Current users</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search logs..." className="pl-10" />
                </div>
                <Button variant="outline">Export CSV</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Member Added</TableCell>
                    <TableCell>Admin User</TableCell>
                    <TableCell>john.doe@example.com</TableCell>
                    <TableCell>2024-01-15 10:30</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Settings Updated</TableCell>
                    <TableCell>Admin User</TableCell>
                    <TableCell>Workspace Settings</TableCell>
                    <TableCell>2024-01-14 15:45</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Associated Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allCompanies?.companies?.map((company: any) => (
                  <div key={company.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`company-${company.id}`}
                      checked={companies?.some((c: any) => c.id === company.id)}
                      onCheckedChange={(checked) => {
                        const currentIds = companies?.map((c: any) => c.id) || [];
                        const newIds = checked
                          ? [...currentIds, company.id]
                          : currentIds.filter((id: number) => id !== company.id);
                        updateCompaniesMutation.mutate(newIds);
                      }}
                    />
                    <Label htmlFor={`company-${company.id}`} className="flex-1">
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">{company.description}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{workspace?.tariffName || "No Plan"}</div>
                  <p className="text-sm text-muted-foreground">
                    {workspace?.tariffName ? "Active subscription" : "No active subscription"}
                  </p>
                </div>
                <Button className="mt-4">Change Plan</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usage & Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>API Requests</span>
                      <span>1,234 / 10,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "12%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Storage</span>
                      <span>2.4 GB / 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "24%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sections?.sections?.map((section: any) => (
                  <div key={section.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{section.name}</div>
                      <div className="text-sm text-muted-foreground">{section.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={accessControl?.some((ac: any) => ac.sectionId === section.id && ac.isEnabled)}
                        onCheckedChange={(checked) => {
                          const currentRules = accessControl || [];
                          const existingRule = currentRules.find((ac: any) => ac.sectionId === section.id);
                          
                          let newRules;
                          if (existingRule) {
                            newRules = currentRules.map((ac: any) =>
                              ac.sectionId === section.id ? { ...ac, isEnabled: checked } : ac
                            );
                          } else {
                            newRules = [
                              ...currentRules,
                              { workspaceId, sectionId: section.id, isEnabled: checked, overrideTariff: false }
                            ];
                          }
                          
                          updateAccessControlMutation.mutate(newRules);
                        }}
                      />
                      <Label className="text-sm">Enabled</Label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}