import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Folder, 
  CreditCard, 
  FileText, 
  Globe, 
  ScrollText,
  Shield,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Workspaces", href: "/workspaces", icon: Folder },
  { name: "Tariff Plans", href: "/tariffs", icon: CreditCard },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Domains", href: "/domains", icon: Globe },
  { name: "Audit Logs", href: "/audit-logs", icon: ScrollText },
];

export function Sidebar() {
  const [location] = useLocation();
  const { admin, logout } = useAuth();

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col sidebar-transition">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-md flex items-center justify-center">
            <Shield className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">Admin Panel</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a 
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      {/* User Menu */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-md">
          <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-sidebar-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">{admin?.name}</p>
            <p className="text-xs text-sidebar-foreground/70">{admin?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => logout()}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
