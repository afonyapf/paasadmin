import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../components/MetricCard";
import { 
  Users, 
  Activity, 
  Clock, 
  Calendar, 
  UserPlus, 
  Briefcase, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  BarChart3, 
  DollarSign, 
  ArrowUpRight, 
  UserX, 
  Target, 
  PiggyBank, 
  Timer, 
  CheckCircle, 
  Star, 
  MessageCircle, 
  Headphones 
} from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
  });

  const { data: advancedStats, isLoading: advancedLoading } = useQuery({
    queryKey: ["dashboard-advanced-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/advanced-stats");
      if (!response.ok) {
        throw new Error("Failed to fetch advanced dashboard stats");
      }
      return response.json();
    },
  });

  const isLoading = statsLoading || advancedLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(0)}`;
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* User Engagement Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Пользовательская активность</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <MetricCard
            title="Активные пользователи"
            value={advancedStats?.activeUsers || 0}
            subtitle="текущие сессии"
            icon={Activity}
          />
          <MetricCard
            title="Средняя длительность сессии"
            value={formatDuration(advancedStats?.avgSessionDuration || 0)}
            icon={Clock}
          />
          <MetricCard
            title="DAU"
            value={advancedStats?.dau || 0}
            subtitle="ежедневная активность"
            icon={Calendar}
          />
          <MetricCard
            title="MAU"
            value={advancedStats?.mau || 0}
            subtitle="месячная активность"
            icon={Users}
          />
          <MetricCard
            title="Общее количество пользователей"
            value={stats?.totalUsers || 0}
            subtitle="все аккаунты"
            icon={Users}
          />
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Рост платформы</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Регистраций за день"
            value={advancedStats?.dailyRegistrations || 0}
            subtitle="новые пользователи"
            icon={UserPlus}
          />
          <MetricCard
            title="Workspace за день"
            value={advancedStats?.dailyWorkspaces || 0}
            subtitle="новые пространства"
            icon={Briefcase}
          />
          <MetricCard
            title="Feature Adoption"
            value={`${advancedStats?.featureAdoption || 0}%`}
            subtitle="использование ключевых фич"
            icon={TrendingUp}
          />
          <MetricCard
            title="Активные Workspace"
            value={stats?.activeWorkspaces || 0}
            icon={Briefcase}
          />
        </div>
      </div>

      {/* Technical Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Техническая производительность</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Ошибки 5xx"
            value={`${(advancedStats?.errorRate5xx || 0).toFixed(2)}%`}
            subtitle="критические ошибки"
            icon={AlertTriangle}
            className={advancedStats?.errorRate5xx > 1 ? "border-red-200" : ""}
          />
          <MetricCard
            title="Задержка API"
            value={`${advancedStats?.avgApiResponseTime || 0}ms`}
            subtitle="среднее время ответа"
            icon={Zap}
          />
          <MetricCard
            title="RPC/API запросы"
            value={advancedStats?.apiRequestsPerMinute || 0}
            subtitle="в минуту"
            icon={BarChart3}
          />
          <MetricCard
            title="Кастомные домены"
            value={stats?.customDomains || 0}
            icon={Target}
          />
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Финансовые показатели</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="MRR"
            value={formatCurrency(advancedStats?.mrr || 0)}
            subtitle="месячный доход"
            icon={DollarSign}
          />
          <MetricCard
            title="ARR"
            value={formatCurrency(advancedStats?.arr || 0)}
            subtitle="годовой доход"
            icon={ArrowUpRight}
          />
          <MetricCard
            title="Churn Rate"
            value={`${(advancedStats?.churnRate || 0).toFixed(1)}%`}
            subtitle="отток клиентов"
            icon={UserX}
            className={advancedStats?.churnRate > 5 ? "border-red-200" : ""}
          />
          <MetricCard
            title="NRR"
            value={`${(advancedStats?.nrr || 0).toFixed(0)}%`}
            subtitle="удержание дохода"
            icon={Target}
          />
          <MetricCard
            title="Общий доход"
            value={formatCurrency((stats?.totalRevenue || 0) * 100)}
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Customer Success Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Клиентский успех</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="CAC"
            value={formatCurrency(advancedStats?.cac || 0)}
            subtitle="стоимость привлечения"
            icon={PiggyBank}
          />
          <MetricCard
            title="LTV"
            value={formatCurrency(advancedStats?.ltv || 0)}
            subtitle="пожизненная ценность"
            icon={TrendingUp}
          />
          <MetricCard
            title="Time to Value"
            value={`${advancedStats?.ttv || 0} дней`}
            subtitle="до первой ценности"
            icon={Timer}
          />
          <MetricCard
            title="Signup → Activation"
            value={`${(advancedStats?.signupToActivation || 0).toFixed(0)}%`}
            subtitle="конверсия активации"
            icon={CheckCircle}
          />
          <MetricCard
            title="Activation → Paid"
            value={`${(advancedStats?.activationToPaid || 0).toFixed(0)}%`}
            subtitle="конверсия в платный"
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Customer Satisfaction */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Удовлетворенность клиентов</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="CSAT"
            value={`${(advancedStats?.csat || 0).toFixed(1)}/5`}
            subtitle="удовлетворенность"
            icon={Star}
          />
          <MetricCard
            title="NPS"
            value={advancedStats?.nps || 0}
            subtitle="лояльность клиентов"
            icon={MessageCircle}
          />
          <MetricCard
            title="First Response Time"
            value={formatTime(advancedStats?.firstResponseTime || 0)}
            subtitle="время первого ответа"
            icon={Headphones}
          />
          <MetricCard
            title="Resolution Time"
            value={formatTime(advancedStats?.resolutionTime || 0)}
            subtitle="время решения"
            icon={CheckCircle}
          />
        </div>
      </div>
    </div>
  );
}