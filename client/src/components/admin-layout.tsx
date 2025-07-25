import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/use-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Users", path: "/users" },
    { name: "Workspaces", path: "/workspaces" },
    { name: "Tariffs", path: "/tariffs" },
    { name: "Templates", path: "/templates" },
    { name: "Domains", path: "/domains" },
    { name: "Audit Logs", path: "/audit-logs" },
  ];

  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold">CodeCraftHub</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <span
                    className={`block px-4 py-2 rounded-md cursor-pointer ${
                      location === item.path
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t dark:border-gray-700">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">CodeCraftHub</h1>
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? "✕" : "☰"}
        </Button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <nav className="p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <span
                      className={`block px-4 py-2 rounded-md cursor-pointer ${
                        location === item.path
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Button variant="outline" className="w-full mt-2" onClick={handleLogout}>
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}