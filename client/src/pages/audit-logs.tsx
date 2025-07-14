import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { AuditLog } from "@shared/schema";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: auditLogsData, isLoading } = useQuery({
    queryKey: ["/api/audit-logs", { page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/audit-logs?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }
      return response.json();
    },
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return 'bg-blue-100 text-blue-800';
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceTypeBadgeColor = (resourceType: string) => {
    switch (resourceType) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'workspace':
        return 'bg-green-100 text-green-800';
      case 'tariff':
        return 'bg-orange-100 text-orange-800';
      case 'template':
        return 'bg-cyan-100 text-cyan-800';
      case 'domain':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diff = now.getTime() - created.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export audit logs");
  };

  const totalPages = Math.ceil((auditLogsData?.total || 0) / limit);

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Audit Logs</h2>
            <p className="text-sm text-muted-foreground">System activity and security logs</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle>Audit Log History</CardTitle>
              <Button size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </CardHeader>

          {/* Audit Logs Table */}
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Timestamp</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Action</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Resource</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">IP Address</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogsData?.logs.map((log: AuditLog) => (
                      <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(log.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Badge className={getResourceTypeBadgeColor(log.resourceType)}>
                              {log.resourceType}
                            </Badge>
                            {log.resourceId && (
                              <span className="text-sm text-muted-foreground">
                                #{log.resourceId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                              <ScrollText className="w-3 h-3 text-secondary-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {log.adminId ? `Admin #${log.adminId}` : log.userId ? `User #${log.userId}` : 'System'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {log.ipAddress || 'N/A'}
                        </td>
                        <td className="p-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate">
                              {log.details ? JSON.stringify(log.details).substring(0, 50) + '...' : 'No details'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, auditLogsData?.total || 0)} of {auditLogsData?.total || 0} logs
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
