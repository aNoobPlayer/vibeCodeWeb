import { useEffect, useMemo, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Layers, ClipboardList, Lightbulb, Users, Pencil, Image } from "lucide-react";
import { AdminShell, type AdminNavItem } from "@/layouts/AdminShell";

const OverviewPage = lazy(() => import("@/features/overview/pages/OverviewPage"));
const TestSetsPage = lazy(() => import("@/features/test-sets/pages/TestSetsPage"));
const QuestionsPage = lazy(() => import("@/features/questions/pages/QuestionsPage"));
const TemplatesPage = lazy(() => import("@/features/templates/pages/TemplatesPage"));
const GradingPage = lazy(() => import("@/features/grading/pages/GradingPage"));
const TipsPage = lazy(() => import("@/features/tips/pages/TipsPage"));
const MediaPage = lazy(() => import("@/features/media/pages/MediaPage"));
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: stats } = useQuery<{ setsCount: number; questionsCount: number }>({
    queryKey: ["/api/stats"],
  });

  useEffect(() => {
    if (location === "/admin" || location === "/admin/") {
      setLocation("/admin/dashboard");
    }
  }, [location, setLocation]);

  const navItems = useMemo<AdminNavItem[]>(
    () => [
      {
        label: "Overview",
        href: "/admin/dashboard",
        icon: TrendingUp,
        testId: "nav-dashboard",
      },
      {
        label: "Test sets",
        href: "/admin/sets",
        icon: Layers,
        testId: "nav-sets",
        badge: (
          <Badge className="bg-gray-800 text-gray-200 text-xs">
            {stats?.setsCount ?? 0}
          </Badge>
        ),
      },
      {
        label: "Question bank",
        href: "/admin/questions",
        icon: ClipboardList,
        testId: "nav-questions",
        badge: (
          <Badge className="bg-gray-800 text-gray-200 text-xs">
            {stats?.questionsCount ?? 0}
          </Badge>
        ),
      },
      {
        label: "Templates",
        href: "/admin/templates",
        icon: Sparkles,
        testId: "nav-templates",
      },
      {
        label: "Grading",
        href: "/admin/grading",
        icon: Pencil,
        testId: "nav-grading",
      },
      {
        label: "Tips & guides",
        href: "/admin/tips",
        icon: Lightbulb,
        testId: "nav-tips",
      },
      {
        label: "Media",
        href: "/admin/media",
        icon: Image,
        testId: "nav-media",
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
        testId: "nav-users",
      },
    ],
    [stats?.questionsCount, stats?.setsCount],
  );

  return (
    <AdminShell navItems={navItems} user={user} onLogout={logout}>
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path="/admin/dashboard">
            <OverviewPage onShowTemplates={() => setLocation("/admin/templates")} />
          </Route>
        <Route path="/admin/sets">
          <TestSetsPage />
        </Route>
        <Route path="/admin/questions">
          <QuestionsPage onShowTemplates={() => setLocation("/admin/templates")} />
        </Route>
        <Route path="/admin/templates">
          <TemplatesPage />
        </Route>
        <Route path="/admin/grading">
          <GradingPage />
        </Route>
        <Route path="/admin/tips">
          <TipsPage />
        </Route>
        <Route path="/admin/media">
          <MediaPage />
        </Route>
        <Route path="/admin/users">
          <UsersPage />
        </Route>
          <Route>
            <OverviewPage onShowTemplates={() => setLocation("/admin/templates")} />
          </Route>
        </Switch>
      </Suspense>
    </AdminShell>
  );
}

function RouteFallback() {
  return (
    <div className="py-10 text-center text-sm text-gray-500">
      Loading admin tools...
    </div>
  );
}

// Dashboard View Component

