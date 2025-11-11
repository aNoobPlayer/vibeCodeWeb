import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut, Search, GraduationCap } from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
  badge?: ReactNode;
};

type AdminShellProps = {
  navItems: AdminNavItem[];
  user: { username: string; role: string; avatar?: string | null } | null;
  onLogout: () => void;
  children: ReactNode;
};

export function AdminShell({ navItems, user, onLogout, children }: AdminShellProps) {
  const [location] = useLocation();
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white/90 p-6">
          <div className="mb-10 flex items-center gap-3 text-primary">
            <GraduationCap className="h-8 w-8 bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent" />
            <div>
              <p className="text-lg font-bold">APTIS KEYS</p>
              <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">
                PRO
              </Badge>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    data-testid={item.testId}
                    className={`group flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"}`} />
                      {item.label}
                    </span>
                    {item.badge}
                  </a>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 flex flex-wrap items-center gap-6 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative w-full max-w-lg">
                <Input
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search across the platform..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5 text-gray-500" />
              </Button>
              <div className="flex items-center gap-3 rounded-full border border-gray-200 px-3 py-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar ?? undefined} />
                  <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() ?? "AD"}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.username ?? "Admin"}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role ?? "admin"}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2 text-gray-600">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50 p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
