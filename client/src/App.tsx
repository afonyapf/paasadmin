import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import WorkspacesPage from "@/pages/workspaces";
import TariffsPage from "@/pages/tariffs";
import TemplatesPage from "@/pages/templates";
import DomainsPage from "@/pages/domains";
import AuditLogsPage from "@/pages/audit-logs";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin-layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!admin) {
    return <LoginPage />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute>
          <UsersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/workspaces">
        <ProtectedRoute>
          <WorkspacesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/tariffs">
        <ProtectedRoute>
          <TariffsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/templates">
        <ProtectedRoute>
          <TemplatesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/domains">
        <ProtectedRoute>
          <DomainsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/audit-logs">
        <ProtectedRoute>
          <AuditLogsPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
