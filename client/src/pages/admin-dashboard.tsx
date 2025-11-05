import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SetCompositionModal } from "@/components/SetCompositionModal";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap,
  Search,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  TrendingUp,
  Layers,
  ClipboardList,
  Lightbulb,
  FileAudio,
  Users,
  PieChart,
  Settings,
  Plus,
  RotateCw,
  Pencil,
  Eye,
  Trash2,
  Upload,
  Clock,
  FolderOpen,
  BarChart3,
  Volume2,
  Image,
  LogOut,
  UserCircle,
} from "lucide-react";
import type { TestSet, Question, Tip, Media, Activity } from "@shared/schema";
import { QuestionImportButton } from "@/components/QuestionImportModal";
import { QuestionFormModal } from "@/components/QuestionFormModal";
import { GradingModal } from "@/components/GradingModal";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const { data: stats } = useQuery<{ setsCount: number; questionsCount: number }>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-6 bg-white px-6 py-4 border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent" />
          <span className="text-xl font-bold text-primary">APTIS KEYS</span>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 hover-elevate">
            PRO
          </Badge>
        </div>

        <div className="flex-1 max-w-lg relative">
          <Input
            data-testid="input-global-search"
            placeholder="Search across the platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <div className="flex items-center gap-3">
          <Button
            data-testid="button-notifications"
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
          </Button>
          <Button data-testid="button-settings" variant="ghost" size="icon">
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 hover-elevate cursor-pointer" data-testid="button-user-menu">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://i.pravatar.cc/40" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{user?.username || "Admin"}</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid grid-cols-[280px,1fr] min-h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="sticky top-[73px] h-[calc(100vh-73px)] bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-4 overflow-y-auto">
          <div className="space-y-8">
            {/* Main Navigation */}
            <div className="space-y-1">
              <Button
                variant="ghost"
                data-testid="nav-dashboard"
                onClick={() => setCurrentView("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "dashboard"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                data-testid="nav-sets"
                onClick={() => setCurrentView("sets")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "sets"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <Layers className="w-5 h-5" />
                <span className="font-medium">Test sets</span>
                <Badge className="ml-auto bg-gray-700 text-gray-300" data-testid="badge-sets-count">
                  {stats?.setsCount ?? 0}
                </Badge>
              </Button>
              <Button
                variant="ghost"
                data-testid="nav-questions"
                onClick={() => setCurrentView("questions")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "questions"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span className="font-medium">Question bank</span>
                <Badge className="ml-auto bg-gray-700 text-gray-300" data-testid="badge-questions-count">
                  {stats?.questionsCount ?? 0}
                </Badge>
              </Button>
              <Button
                variant="ghost"
                data-testid="nav-grading"
                onClick={() => setCurrentView("grading")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "grading"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <Pencil className="w-5 h-5" />
                <span className="font-medium">Grading</span>
              </Button>
              <Button
                variant="ghost"
                data-testid="nav-tips"
                onClick={() => setCurrentView("tips")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "tips"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <Lightbulb className="w-5 h-5" />
                <span className="font-medium">Tips & guides</span>
              </Button>
              <Button
                variant="ghost"
                data-testid="nav-media"
                onClick={() => setCurrentView("media")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "media"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <FileAudio className="w-5 h-5" />
                <span className="font-medium">Media library</span>
              </Button>
            </div>

            {/* System Administration */}
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-3 mb-3">
                System administration
              </div>
              <Button
                variant="ghost"
                data-testid="nav-users"
                onClick={() => setCurrentView("users")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "users"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Users</span>
              </Button>
              <Button
                variant="ghost"
                data-testid="nav-reports"
                onClick={() => setCurrentView("reports")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "reports"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <PieChart className="w-5 h-5" />
                <span className="font-medium">Reports & analytics</span>
              </Button>
              <Button
                variant="ghost"
                data-testid="nav-settings"
                onClick={() => setCurrentView("settings")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "settings"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-8 overflow-y-auto bg-gray-50">
          {currentView === "dashboard" && <DashboardView />}
          {currentView === "sets" && <TestSetsView />}
          {currentView === "questions" && <QuestionsView />}
          {currentView === "grading" && <GradingView />}
          {currentView === "tips" && <TipsView />}
          {currentView === "media" && <MediaView />}
          {currentView === "users" && <UsersView />}
        </main>
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView() {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  const kpiData = [
    { label: "Total test sets", value: stats?.setsCount || 0, sublabel: "Created", testId: "kpi-sets" },
    { label: "Questions", value: stats?.questionsCount || 0, sublabel: "Active", testId: "kpi-questions" },
    { label: "Study tips", value: stats?.tipsCount || 0, sublabel: "Published", testId: "kpi-tips" },
    { label: "Media files", value: stats?.mediaCount || 0, sublabel: "Audio & images", testId: "kpi-media" },
  ];

  return (
    <div className="space-y-8 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of the APTIS management workspace</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <Card
            key={kpi.testId}
            data-testid={kpi.testId}
            className="relative overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
            <div className="p-6 text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</div>
              <div className="text-4xl font-bold text-primary my-3">{kpi.value}</div>
              <div className="text-xs text-gray-500">{kpi.sublabel}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Activity and Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent activity</h3>
              <p className="text-sm text-gray-500 mt-1">Latest changes</p>
            </div>
            <Button variant="secondary" size="icon" data-testid="button-refresh-activity">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
          <ActivityFeed />
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Question distribution by skill</h3>
            <p className="text-sm text-gray-500 mt-1">Question bank analytics</p>
          </div>
          <SkillDistributionChart />
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button data-testid="button-create-set" className="gap-2">
            <Plus className="w-4 h-4" />
            Create new test set
          </Button>
          <Button variant="secondary" data-testid="button-create-question" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Add question
          </Button>
          <Button variant="secondary" data-testid="button-create-tip" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Write study tip
          </Button>
          <Button variant="secondary" data-testid="button-upload-media" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload media
          </Button>
        </div>
      </Card>
      <div className="flex justify-end mt-4">
        <QuestionImportButton />
      </div>
    </div>
  );
}

// Activity Feed Component
function ActivityFeed() {
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-3" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="activity-feed">
      {activities.slice(0, 5).map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
            activity.action === "created" ? "bg-success/10 text-success" :
            activity.action === "updated" ? "bg-primary/10 text-primary" :
            "bg-destructive/10 text-destructive"
          }`}>
            {activity.action === "created" ? <Plus className="w-4 h-4" /> :
             activity.action === "updated" ? <Pencil className="w-4 h-4" /> :
             <Trash2 className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.resourceTitle}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              { activity.action === "created" ? "Created" : activity.action === "updated" ? "Updated" : "Deleted" } -{" "}
              {new Date(activity.timestamp).toLocaleTimeString("vi-VN")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skill Distribution Chart Component
function SkillDistributionChart() {
  const { data: distribution } = useQuery<any>({
    queryKey: ["/api/questions/distribution"],
  });

  const skills = [
    { name: "Reading", count: distribution?.reading || 0, color: "bg-blue-500" },
    { name: "Listening", count: distribution?.listening || 0, color: "bg-cyan-500" },
    { name: "Speaking", count: distribution?.speaking || 0, color: "bg-green-500" },
    { name: "Writing", count: distribution?.writing || 0, color: "bg-orange-500" },
  ];

  const total = skills.reduce((sum, skill) => sum + skill.count, 0);

  if (total === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BarChart3 className="w-10 h-10 mx-auto mb-3" />
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="skill-chart">
      {skills.map((skill) => (
        <div key={skill.name}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">{skill.name}</span>
            <span className="text-gray-500">{skill.count} questions</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${skill.color} transition-all duration-500`}
              style={{ width: `${total > 0 ? (skill.count / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Test Sets View Component
function TestSetsView() {
  const [filterSkill, setFilterSkill] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [composeSet, setComposeSet] = useState<TestSet | null>(null);

  const { data: testSets } = useQuery<TestSet[]>({
    queryKey: ["/api/test-sets"],
  });

  const filteredSets = testSets?.filter((set) => {
    if (filterSkill && set.skill !== filterSkill) return false;
    if (filterStatus && set.status !== filterStatus) return false;
    if (searchQuery && !set.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage test sets</h1>
        <p className="text-gray-600">Create, edit and publish exam sets</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button data-testid="button-add-set" className="gap-2">
            <Plus className="w-4 h-4" />
            Add test set
          </Button>
          <div className="flex gap-2 ml-auto">
            <Select value={filterSkill} onValueChange={setFilterSkill}>
              <SelectTrigger className="w-40" data-testid="filter-skill">
                <SelectValue placeholder="All skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="filter-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Input
              data-testid="input-search-sets"
              placeholder="Search test sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Test set name</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="w-52">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredSets || filteredSets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <FolderOpen className="w-10 h-10 mx-auto mb-3" />
                    <p>No test sets found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSets.map((set, index) => (
                  <TableRow key={set.id} data-testid={`set-row-${set.id}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{set.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          set.skill === "Reading"
                            ? "bg-blue-100 text-blue-700"
                            : set.skill === "Listening"
                              ? "bg-cyan-100 text-cyan-700"
                              : set.skill === "Speaking"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                        }
                      >
                        {set.skill}
                      </Badge>
                    </TableCell>
                    <TableCell>{set.questionCount}</TableCell>
                    <TableCell>
                      <Badge variant={set.status === "published" ? "default" : "secondary"}>
                        {set.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(set.updatedAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${set.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setComposeSet(set)}
                          data-testid={`button-manage-questions-${set.id}`}
                        >
                          <ClipboardList className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-view-${set.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-${set.id}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      {composeSet && (
        <SetCompositionModal setItem={composeSet} onClose={() => setComposeSet(null)} />
      )}
    </div>
  );
}

// Questions View Component
type QuestionsResponse = {
  items: Question[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
};

function QuestionsView() {
  const [filterSkill, setFilterSkill] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const filteredQuestions = questions?.filter((q) => {
    if (filterSkill && q.skill !== filterSkill) return false;
    if (filterType && q.type !== filterType) return false;
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Question bank</h1>
        <p className="text-gray-600">Manage questions by skill and type</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button data-testid="button-add-question" className="gap-2">
            <Plus className="w-4 h-4" />
            Add new question
          </Button>
          <div className="flex gap-2 ml-auto">
            <Select value={filterSkill} onValueChange={setFilterSkill}>
              <SelectTrigger className="w-40" data-testid="filter-question-skill">
                <SelectValue placeholder="All skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48" data-testid="filter-question-type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="mcq_single">MCQ (single answer)</SelectItem>
                <SelectItem value="mcq_multi">MCQ (multiple answers)</SelectItem>
                <SelectItem value="fill_blank">Fill in the blanks</SelectItem>
                <SelectItem value="writing_prompt">Writing prompt</SelectItem>
              </SelectContent>
            </Select>
            <Input
              data-testid="input-search-questions"
              placeholder="Search by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Question title</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-56">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredQuestions || filteredQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3" />
                    <p>No questions found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((question, index) => (
                  <TableRow
                    key={question.id}
                    data-testid={`question-row-${question.id}`}
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{question.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          question.skill === "Reading"
                            ? "bg-blue-100 text-blue-700"
                            : question.skill === "Listening"
                              ? "bg-cyan-100 text-cyan-700"
                              : question.skill === "Speaking"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                        }
                      >
                        {question.skill}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {question.type === "mcq_single"
                        ? "MCQ (single answer)"
                        : question.type === "mcq_multi"
                          ? "MCQ (multiple answers)"
                          : question.type === "fill_blank"
                            ? "Fill in the blanks"
                            : "Writing prompt"}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{question.points}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {question.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-question-${question.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-view-question-${question.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-question-${question.id}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// Grading View Component
function GradingView() {
  const [filterSkill, setFilterSkill] = useState<string>("");
  const { data: queue, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/submissions", filterSkill],
    queryFn: async () => {
      const url = filterSkill ? `/api/admin/submissions?status=submitted&skill=${encodeURIComponent(filterSkill)}` : `/api/admin/submissions?status=submitted`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const [active, setActive] = useState<any | null>(null);

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grading</h1>
        <p className="text-gray-600">Submissions awaiting Writing/Speaking review</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-2 mb-4">
          <Select value={filterSkill} onValueChange={setFilterSkill}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="Writing">Writing</SelectItem>
              <SelectItem value="Speaking">Speaking</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Set</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!queue || queue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No submissions require grading
                  </TableCell>
                </TableRow>
              ) : (
                queue.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.userId}</TableCell>
                    <TableCell>{row.setId}</TableCell>
                    <TableCell>{row.submitTime ? new Date(row.submitTime).toLocaleString("vi-VN") : "-"}</TableCell>
                    <TableCell>{row.items}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setActive(row)}>Grade</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {active && (
        <GradingModal
          submission={active}
          onClose={() => setActive(null)}
          onDone={() => {
            setActive(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// Tips View Component
function TipsView() {
  const [filterSkill, setFilterSkill] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tips } = useQuery<Tip[]>({
    queryKey: ["/api/tips"],
  });

  const filteredTips = tips?.filter((tip) => {
    if (filterSkill && tip.skill !== filterSkill) return false;
    if (searchQuery && !tip.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Study tips & guides</h1>
        <p className="text-gray-600">Create learning resources for students</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button data-testid="button-add-tip" className="gap-2">
            <Plus className="w-4 h-4" />
            Add new tip
          </Button>
          <div className="flex gap-2 ml-auto">
            <Select value={filterSkill} onValueChange={setFilterSkill}>
              <SelectTrigger className="w-40" data-testid="filter-tip-skill">
                <SelectValue placeholder="All skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
            <Input
              data-testid="input-search-tips"
              placeholder="Search tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Applicable skill</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredTips || filteredTips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    <Lightbulb className="w-10 h-10 mx-auto mb-3" />
                    <p>No tips found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTips.map((tip, index) => (
                  <TableRow key={tip.id} data-testid={`tip-row-${tip.id}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{tip.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          tip.skill === "Reading"
                            ? "bg-blue-100 text-blue-700"
                            : tip.skill === "Listening"
                              ? "bg-cyan-100 text-cyan-700"
                              : tip.skill === "Speaking"
                                ? "bg-green-100 text-green-700"
                                : tip.skill === "Writing"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                        }
                      >
                        {tip.skill}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tip.status === "published" ? "default" : "secondary"}>
                        {tip.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(tip.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-tip-${tip.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-view-tip-${tip.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-tip-${tip.id}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// Media View Component
function MediaView() {
  const { data: mediaFiles } = useQuery<Media[]>({
    queryKey: ["/api/media"],
  });

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Media library</h1>
        <p className="text-gray-600">Manage audio and images for questions</p>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Button data-testid="button-upload-media-file" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload media
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="filter-audio" size="sm">
              <Volume2 className="w-4 h-4 mr-2" />
              Audio
            </Button>
            <Button variant="outline" data-testid="filter-image" size="sm">
              <Image className="w-4 h-4 mr-2" />
              Images
            </Button>
          </div>
        </div>

        {!mediaFiles || mediaFiles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileAudio className="w-14 h-14 mx-auto mb-4" />
            <p className="text-lg mb-2">No media uploaded</p>
            <p className="text-sm">Upload audio or images to attach to questions</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4" data-testid="media-grid">
            {mediaFiles.map((media) => (
              <Card
                key={media.id}
                data-testid={`media-item-${media.id}`}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-3">
                  {media.type === "audio" ? (
                    <Volume2 className="w-10 h-10 text-gray-400" />
                  ) : (
                    <Image className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate" title={media.filename}>
                  {media.filename}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(media.uploadedAt).toLocaleDateString("vi-VN")}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="ghost" size="sm" className="flex-1" data-testid={`button-view-media-${media.id}`}>
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-media-${media.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Users View Component (placeholder)
function UsersView() {
  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
        <p className="text-gray-600">Manage user accounts and permissions</p>
      </div>
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">User management features are under development</p>
      </Card>
    </div>
  );
}
