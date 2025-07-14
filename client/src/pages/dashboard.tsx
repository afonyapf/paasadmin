import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Settings, User } from "lucide-react";
import { StatsCards } from "@/components/stats-cards";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { User as UserType, AuditLog } from "@shared/schema";

export default function DashboardPage() {
  const { data: recentUsers, isLoading: isUsersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/dashboard/recent-users"],
    refetchInterval: 30000,
  });

  const { data: recentActivity, isLoading: isActivityLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/dashboard/recent-activity"],
    refetchInterval: 15000,
  });

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

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'login':
      case 'create':
        return 'bg-green-500';
      case 'update':
        return 'bg-blue-500';
      case 'delete':
        return 'bg-red-500';
      default:
        return 'bg-orange-500';
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Platform administration overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Users</CardTitle>
                <Button variant="link" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isUsersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUsers?.map((user) => (
                    <div key={user.id} className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-secondary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(user.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Activity */}
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>System Activity</CardTitle>
                <Button variant="link" size="sm">
                  View Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isActivityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start space-x-4 animate-pulse">
                      <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.action)}`}></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          {activity.action} {activity.resourceType}
                          {activity.resourceId && ` #${activity.resourceId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
