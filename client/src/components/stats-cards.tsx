import { Card, CardContent } from "@/components/ui/card";
import { Users, Folder, CreditCard, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers?.toLocaleString() || "0",
      icon: Users,
      change: "+2.1% from last month",
    },
    {
      title: "Active Workspaces",
      value: stats?.activeWorkspaces?.toLocaleString() || "0",
      icon: Folder,
      change: "+5.4% from last month",
    },
    {
      title: "Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString() || "0"}`,
      icon: CreditCard,
      change: "+12.5% from last month",
    },
    {
      title: "Custom Domains",
      value: stats?.customDomains?.toLocaleString() || "0",
      icon: Globe,
      change: "+8.1% from last month",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-muted-foreground">{stat.title}</div>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-green-600 mt-1">{stat.change}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
