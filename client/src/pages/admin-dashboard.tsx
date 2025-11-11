import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SetCompositionModal } from "@/components/SetCompositionModal";
import { TestSetFormModal } from "@/components/TestSetFormModal";
import { QuestionFormModal } from "@/components/QuestionFormModal";
import { TipFormModal } from "@/components/TipFormModal";
import { MediaUploadButton } from "@/components/MediaUpload";
import { Sparkles } from "lucide-react";
import { TemplateFormModal, type TemplateFormData } from "@/components/TemplateFormModal";
import { TestSetPreviewModal } from "@/components/TestSetPreviewModal";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Clock,
  FolderOpen,
  BarChart3,
  Volume2,
  Image,
  LogOut,
  UserCircle,
  UserPlus,
  ShieldCheck,
  Loader2,
  FolderPlus,
} from "lucide-react";
import type { TestSet, Question, Tip, Media, Activity, QuestionTemplate } from "@shared/schema";
import { QuestionImportButton } from "@/components/QuestionImportModal";
import { GradingModal } from "@/components/GradingModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTemplates } from "@/hooks/admin/useTemplates";
import { useTestSets } from "@/hooks/admin/useTestSets";
import { useQuestions } from "@/hooks/admin/useQuestions";
import { queryKeys } from "@/lib/queryKeys";

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState("sets");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
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
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setLocation("/profile");
                }}
                data-testid="menu-admin-profile"
              >
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
        <aside className="sticky top-[73px] h-[calc(100vh-73px)] bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-4 scroll-ghost overflow-y-auto">
          <div className="space-y-8">
            {/* Focus Navigation */}
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">
                Focus areas
              </div>
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
            </div>
            {/* Workspace Tools */}
            <div className="space-y-1 border-t border-white/10 pt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">
                Workspace
              </div>
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
                <span className="font-medium">Overview</span>
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
                data-testid="nav-templates"
                onClick={() => setCurrentView("templates")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  currentView === "templates"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Template studio</span>
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
        <main className="p-8 scroll-ghost overflow-y-auto bg-gray-50">
          {currentView === "dashboard" && <DashboardView onShowTemplates={() => setCurrentView("templates")} />}
          {currentView === "sets" && <TestSetsView />}
          {currentView === "questions" && <QuestionsView onShowTemplates={() => setCurrentView("templates")} />}
          {currentView === "grading" && <GradingView />}
          {currentView === "tips" && <TipsView />}
          {currentView === "templates" && <QuestionTemplatesView />}
          {currentView === "media" && <MediaView />}
          {currentView === "users" && <UsersView />}
        </main>
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView({ onShowTemplates }: { onShowTemplates: () => void }) {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
  });
  const { testSets } = useTestSets();
  const { questionsResponse, questions } = useQuestions();
  const questionItems = useMemo(() => questions, [questions]);

  const kpiData = [
    {
      label: "Total test sets",
      value: stats?.setsCount || 0,
      sublabel: "Ready to assign",
      testId: "kpi-sets",
    },
    {
      label: "Question bank items",
      value: stats?.questionsCount ?? questionsResponse?.total ?? questionItems.length ?? 0,
      sublabel: "Curated questions",
      testId: "kpi-questions",
    },
  ];
  const recentSets = useMemo(() => (testSets ? testSets.slice(0, 4) : []), [testSets]);
  const recentQuestions = useMemo(() => questionItems.slice(0, 5), [questionItems]);
  const { templates } = useTemplates();
  const featuredTemplates = useMemo(() => templates.slice(0, 4), [templates]);

  const formatQuestionType = (type: Question["type"]) => {
    switch (type) {
      case "mcq_single":
        return "MCQ (single answer)";
      case "mcq_multi":
        return "MCQ (multiple answers)";
      case "fill_blank":
        return "Fill in the blanks";
      case "writing_prompt":
        return "Writing prompt";
      case "speaking_prompt":
        return "Speaking prompt";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment content</h1>
        <p className="text-gray-600">
          Monitor your test sets and question bank in one place to keep exam materials aligned.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {kpiData.map((kpi) => (
          <Card
            key={kpi.testId}
            data-testid={kpi.testId}
            className="relative overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
            <div className="p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</div>
              <div className="text-4xl font-bold text-primary my-3">{kpi.value}</div>
              <div className="text-xs text-gray-500">{kpi.sublabel}</div>
            </div>
          </Card>
        ))}
      </div>

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
          <div>
            <QuestionImportButton />
          </div>
        </div>
      </Card>

      {featuredTemplates.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Template quick list</p>
              <p className="text-xs text-gray-500">Review popular templates before creating a new question.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onShowTemplates}>
              <Sparkles className="w-4 h-4 mr-1" />
              Open template studio
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {featuredTemplates.map((template) => (
              <div key={`featured-${template.id}`} className="rounded-xl border bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{template.label}</p>
                <p className="text-xs text-gray-500">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase text-gray-400">
                  {template.skills.map((skill) => (
                    <span key={`${template.id}-${skill}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Latest test sets</h3>
              <p className="text-sm text-gray-500 mt-1">Recently updated collections</p>
            </div>
          </div>
          {recentSets.length === 0 ? (
            <div className="text-sm text-gray-500">No test sets yet. Create one to get started.</div>
          ) : (
            <ul className="space-y-4">
              {recentSets.map((set) => (
                <li key={set.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{set.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {set.skill} · Updated {new Date(set.updatedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <Badge variant={set.status === "published" ? "default" : "secondary"}>
                    {set.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent question bank entries</h3>
              <p className="text-sm text-gray-500 mt-1">Fresh content across skills</p>
            </div>
          </div>
          {recentQuestions.length === 0 ? (
            <div className="text-sm text-gray-500">No questions found. Add a question to populate the bank.</div>
          ) : (
            <ul className="space-y-4">
              {recentQuestions.map((question) => (
                <li key={question.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{question.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {question.skill} · {formatQuestionType(question.type)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {question.points} pts
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Activity and Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent activity</h3>
              <p className="text-sm text-gray-500 mt-1">Latest changes across sets and questions</p>
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
            <p className="text-sm text-gray-500 mt-1">Track balance across the bank</p>
          </div>
          <SkillDistributionChart />
        </Card>
      </div>
    </div>
  );
}

function QuestionTemplatesView() {
  const { toast } = useToast();
  const { templates, isLoading: templatesLoading } = useTemplates();
  const [search, setSearch] = useState("");
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (skillFilters.length && !template.skills.some((skill) => skillFilters.includes(skill))) return false;
      if (typeFilter !== "all" && !template.types.includes(typeFilter as Question["type"])) return false;
      if (search) {
        const haystack = `${template.label} ${template.description} ${template.content}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [templates, skillFilters, typeFilter, search]);

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      t.skills.forEach((skill) => set.add(skill));
    });
    return Array.from(set).sort();
  }, [templates]);

  const toggleSkillFilter = (skill: string) => {
    setSkillFilters((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const clearSkillFilters = () => setSkillFilters([]);

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: TemplateFormData }) => {
      if (id) {
        await apiRequest(`/api/templates/${id}`, "PATCH", data);
      } else {
        await apiRequest("/api/templates", "POST", data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      toast({
        title: variables.id ? "Template updated" : "Template created",
        description: variables.id
          ? "Your changes are now available in the question builder."
          : "Template added to the shared library.",
      });
      setModalOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save template",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (template: QuestionTemplate) => apiRequest(`/api/templates/${template.id}`, "DELETE"),
    onSuccess: (_, template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      toast({ title: "Template removed", description: `"${template.label}" was deleted.` });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete template",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: (template: QuestionTemplate) =>
      apiRequest("/api/templates", "POST", {
        label: `${template.label} (copy)`,
        description: template.description,
        skills: template.skills,
        types: template.types,
        content: template.content,
        options: template.options,
        correctAnswers: template.correctAnswers,
        tags: template.tags,
        difficulty: template.difficulty,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      toast({ title: "Template duplicated", description: "Feel free to tweak the copy." });
    },
  });

  const resetTemplatesMutation = useMutation({
    mutationFn: () => apiRequest("/api/templates/reset", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      toast({ title: "Templates reset", description: "Restored the default library." });
    },
  });

  const handleSaveTemplate = async (data: TemplateFormData) => {
    await saveTemplateMutation.mutateAsync({ id: editingTemplate?.id, data });
  };

  const handleDelete = (template: QuestionTemplate) => {
    const confirmed = window.confirm(`Delete "${template.label}"? This cannot be undone.`);
    if (!confirmed) return;
    deleteTemplateMutation.mutate(template);
  };

  return (
    <div className="space-y-6 animate-slideIn">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Template studio</h1>
          <p className="text-gray-600 max-w-2xl">
            Build reusable prompts, answer sets, and guidance so question authors can move faster.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              const confirmed = window.confirm("Reset to the default template library?");
              if (!confirmed) return;
              resetTemplatesMutation.mutate();
            }}
            disabled={resetTemplatesMutation.isPending}
          >
            Restore defaults
          </Button>
          <Button
            onClick={() => {
              setEditingTemplate(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New template
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2">
            {skillOptions.map((skill) => {
              const active = skillFilters.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkillFilter(skill)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
            {skillOptions.length > 0 && (
              <button type="button" className="text-xs text-gray-400 underline" onClick={clearSkillFilters}>
                Clear
              </button>
            )}
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="mcq_single">MCQ (single)</SelectItem>
              <SelectItem value="mcq_multi">MCQ (multi)</SelectItem>
              <SelectItem value="fill_blank">Fill in the blank</SelectItem>
              <SelectItem value="writing_prompt">Writing prompt</SelectItem>
              <SelectItem value="speaking_prompt">Speaking prompt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="rounded-2xl border border-gray-200 bg-white/80 min-h-[200px]">
        {templatesLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No templates match your filters.</div>
        ) : (
          <ScrollArea className="max-h-[65vh] pr-2">
            <div className="space-y-4 p-4 pr-4">
              {filteredTemplates.map((template) => {
                const options = Array.isArray(template.options) ? template.options : [];
                const correctAnswers = Array.isArray(template.correctAnswers) ? template.correctAnswers : [];
                const hasOptions = options.length > 0;
                const showExpected = !hasOptions && correctAnswers.length > 0;
                return (
                  <Card key={template.id} className="p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900">{template.label}</h3>
                          {template.skills.map((skill) => (
                            <Badge key={`${template.id}-${skill}`} variant="secondary" className="bg-gray-100 text-gray-700">
                              {skill}
                            </Badge>
                          ))}
                          {template.difficulty && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                              {template.difficulty}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{template.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          {template.types.map((type) => (
                            <span key={type} className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                              {type}
                            </span>
                          ))}
                          {(template.tags ?? []).map((tag) => (
                            <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTemplate(template);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateTemplateMutation.mutate(template)}>
                          Duplicate
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(template)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    <pre className="rounded-xl bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
                      {template.content}
                    </pre>
                    {hasOptions && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">Options</p>
                        <ul className="grid gap-2 md:grid-cols-2">
                          {options.map((option, index) => {
                            const isCorrect = correctAnswers.includes(option);
                            return (
                              <li
                                key={`${template.id}-option-${index}`}
                                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700"
                              >
                                <span>
                                  <span className="mr-2 font-semibold text-gray-900">
                                    {String.fromCharCode(65 + index)}.
                                  </span>
                                  {option}
                                </span>
                                {isCorrect && (
                                  <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                                    Correct
                                  </Badge>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {showExpected && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        Expected answer: {correctAnswers.join(", ")}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <TemplateFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSubmit={handleSaveTemplate}
        submitting={saveTemplateMutation.isPending}
        title={editingTemplate ? "Update template" : "New template"}
        description="Store the full prompt, answer patterns, and guidance for re-use."
      />
    </div>
  );
}

function QuestionAssignModal({ question, onClose }: { question: Question | null; onClose: () => void }) {
  const open = Boolean(question);
  const { toast } = useToast();
  const [section, setSection] = useState("Section A");
  const [selectedSetId, setSelectedSetId] = useState<string>("");

  const { testSets } = useTestSets();

  const { data: usedSets = [], isLoading: usageLoading } = useQuery<TestSet[]>({
    queryKey: ["question-sets", question?.id],
    enabled: open && Boolean(question?.id),
    queryFn: async () => {
      const res = await fetch(`/api/questions/${question?.id}/sets`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  useEffect(() => {
    if (open) {
      setSection("Section A");
      setSelectedSetId("");
    }
  }, [open, question?.id]);

  const recommendedSets = useMemo(() => {
    if (!testSets || !question) return [];
    return testSets.filter((set) => set.skill === question.skill);
  }, [testSets, question]);

  const otherSets = useMemo(() => {
    if (!testSets || !question) return [];
    return testSets.filter((set) => set.skill !== question.skill);
  }, [testSets, question]);

  const assignMutation = useMutation({
    mutationFn: async (setId: string) => {
      if (!question) throw new Error("No question selected");
      const parsedId = parseInt(question.id, 10);
      if (Number.isNaN(parsedId)) throw new Error("Question id is not numeric");
      const payload = {
        questionId: parsedId,
        section: section || "Section A",
        score: question.points ?? 1,
      };
      const res = await fetch(`/api/test-sets/${setId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      if (question) {
        queryClient.invalidateQueries({ queryKey: ["question-sets", question.id] });
      }
      toast({ title: "Question assigned", description: "Question added to the selected test set." });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign question",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleAssign = (setId: string) => {
    setSelectedSetId(setId);
    assignMutation.mutate(setId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Assign question to test set</DialogTitle>
          <DialogDescription>Link "{question?.title || question?.type}" directly to a set without leaving the question bank.</DialogDescription>
        </DialogHeader>

        {!question ? (
          <p className="text-sm text-gray-500">Select a question to continue.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{question.title || `Question ${question.id}`}</p>
              <p className="text-xs text-gray-500 mt-1">
                Skill: {question.skill} &bull; Type: {question.type} &bull; Points: {question.points}
              </p>
              <p className="mt-2 text-sm text-gray-700 line-clamp-2">{question.content}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Currently used in</p>
                {usageLoading ? (
                  <p className="text-xs text-gray-500">Loading...</p>
                ) : usedSets.length === 0 ? (
                  <p className="text-xs text-gray-500">Not linked to any test set yet.</p>
                ) : (
                  <div className="scroll-ghost max-h-40 overflow-y-auto space-y-2">
                    {usedSets.map((set) => (
                      <div key={`used-${set.id}`} className="rounded-lg border border-gray-200 px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{set.title}</p>
                        <p className="text-xs text-gray-500">
                          Skill: {set.skill} &bull; Status: {set.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Assign to set</p>
                <div className="space-y-3">
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select test set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>
                        Choose test set
                      </SelectItem>
                      {(testSets ?? []).map((set) => (
                        <SelectItem key={set.id} value={String(set.id)}>
                          {set.title} ({set.skill})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={section}
                    onChange={(event) => setSection(event.target.value)}
                    placeholder="Section label (e.g., Section A)"
                  />
                  <Button
                    onClick={() => selectedSetId && handleAssign(selectedSetId)}
                    disabled={!selectedSetId || assignMutation.isPending}
                  >
                    {assignMutation.isPending ? "Assigning..." : "Assign to selected set"}
                  </Button>
                </div>
              </div>
            </div>

            {recommendedSets.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Recommended sets (matching skill)</p>
                <div className="flex flex-wrap gap-2">
                  {recommendedSets.map((set) => (
                    <Button
                      key={`rec-${set.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssign(String(set.id))}
                      disabled={assignMutation.isPending}
                    >
                      {set.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {otherSets.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Other available sets</p>
                <div className="scroll-ghost max-h-48 overflow-y-auto space-y-2">
                  {otherSets.map((set) => (
                    <div key={`other-${set.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700">
                      <div>
                        <p className="font-semibold text-gray-900">{set.title}</p>
                        <p className="text-xs text-gray-500">Skill: {set.skill}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleAssign(String(set.id))}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  const { toast } = useToast();
  const [filterSkill, setFilterSkill] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [composeSet, setComposeSet] = useState<TestSet | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<TestSet | null>(null);
  const [setToDelete, setSetToDelete] = useState<TestSet | null>(null);
  const [previewSet, setPreviewSet] = useState<TestSet | null>(null);

  const { testSets } = useTestSets();

  const filteredSets = useMemo(() => {
    if (!testSets) return [];
    return testSets.filter((set) => {
      if (filterSkill && set.skill !== filterSkill) return false;
      if (filterStatus && set.status !== filterStatus) return false;
      if (searchQuery && !set.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [testSets, filterSkill, filterStatus, searchQuery]);
  const deleteSetMutation = useMutation<void, Error, TestSet>({
    mutationFn: async (set) => {
      await apiRequest(`/api/test-sets/${set.id}`, "DELETE");
    },
    onSuccess: (_, set) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSets() });
      toast({
        title: "Test set deleted",
        description: `"${set.title}" has been removed.`,
      });
      setSetToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test set",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage test sets</h1>
        <p className="text-gray-600">Create, edit and publish exam sets</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
           <Button
            data-testid="button-add-set"
            className="gap-2"
            onClick={() => {
              setEditingSet(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add test set
          </Button>
          <div className="flex gap-2 ml-auto">
            <Select
              value={filterSkill || "all"}
              onValueChange={(value) => setFilterSkill(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-40" data-testid="filter-skill">
                <SelectValue placeholder="All skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="GrammarVocabulary">Grammar &amp; Vocabulary</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus || "all"}
              onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
            >
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
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-preview-${set.id}`}
                          onClick={() => setPreviewSet(set)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${set.id}`}
                          onClick={() => {
                            setEditingSet(set);
                            setIsFormOpen(true);
                          }}
                        >
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
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-${set.id}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setSetToDelete(set)}
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
      <TestSetFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingSet(null);
          }
        }}
        testSet={editingSet ?? undefined}
      />
      <TestSetPreviewModal
        open={Boolean(previewSet)}
        onOpenChange={(open) => {
          if (!open) setPreviewSet(null);
        }}
        testSet={previewSet}
      />
      <AlertDialog open={!!setToDelete} onOpenChange={(open) => !open && setSetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{setToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => setToDelete && deleteSetMutation.mutate(setToDelete)}
              disabled={deleteSetMutation.isPending}
            >
              {deleteSetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Questions View Component
function QuestionsView({ onShowTemplates }: { onShowTemplates: () => void }) {
  const [filterSkill, setFilterSkill] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>();
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [assignTarget, setAssignTarget] = useState<Question | null>(null);
  const { toast } = useToast();

  const { questionsResponse, questions, isLoading } = useQuestions({
    skill: filterSkill || undefined,
    type: filterType || undefined,
    search: searchQuery || undefined,
  });
  const { templates } = useTemplates();
  const featuredTemplates = useMemo(() => templates.slice(0, 4), [templates]);

  const questionItems = useMemo(() => questions, [questions]);
  const deleteQuestionMutation = useMutation<void, Error, Question>({
    mutationFn: async (question) => {
      await apiRequest(`/api/questions/${question.id}`, "DELETE");
    },
    onSuccess: (_, question) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions() });
      toast({
        title: "Question deleted",
        description: `"${question.title || question.type}" has been removed from the bank.`,
      });
      setQuestionToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Question bank</h1>
        <p className="text-gray-600">Manage questions by skill and type</p>
      </div>

      {featuredTemplates.length > 0 && (
        <Card className="space-y-3 border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Template shortcuts</p>
              <p className="text-xs text-gray-600">
                Start from a proven prompt. Applying a template pre-fills content, options, and tags.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onShowTemplates}>
              <Sparkles className="w-4 h-4 mr-1" />
              Manage templates
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {featuredTemplates.map((template) => (
              <div
                key={`qb-template-${template.id}`}
                className="min-w-[220px] flex-1 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-sm font-semibold text-gray-900">{template.label}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {template.skills.map((skill) => (
                    <span key={`${template.id}-${skill}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            data-testid="button-add-question"
            className="gap-2"
            onClick={() => {
              setEditingQuestion(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add new question
          </Button>
          <Button variant="outline" asChild data-testid="button-download-question-template">
            <a href="/templates/question-template.csv" download="question-template.csv">
              Download Excel template
            </a>
          </Button>
          <QuestionImportButton
            onImported={() =>
              queryClient.invalidateQueries({ queryKey: queryKeys.questions() })
            }
          />
          <div className="flex gap-2 ml-auto">
            <Select
              value={filterSkill || "all"}
              onValueChange={(value) => setFilterSkill(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-40" data-testid="filter-question-skill">
                <SelectValue placeholder="All skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="GrammarVocabulary">Grammar &amp; Vocabulary</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterType || "all"}
              onValueChange={(value) => setFilterType(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-48" data-testid="filter-question-type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="mcq_single">MCQ (single answer)</SelectItem>
                <SelectItem value="mcq_multi">MCQ (multiple answers)</SelectItem>
                <SelectItem value="fill_blank">Fill in the blanks</SelectItem>
                <SelectItem value="writing_prompt">Writing prompt</SelectItem>
                <SelectItem value="speaking_prompt">Speaking prompt</SelectItem>
              </SelectContent>
            </Select>
            <Input
              data-testid="input-search-questions"
              placeholder="Tìm theo tiêu đề, nội dung, tags..."
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    Đang tải danh sách câu hỏi...
                  </TableCell>
                </TableRow>
              ) : !questionItems || questionItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3" />
                    <p>No questions found</p>
                  </TableCell>
                </TableRow>
              ) : (
                questionItems.map((question, index) => (
                  <TableRow
                    key={question.id}
                    data-testid={`question-row-${question.id}`}
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {question.title}
                    </TableCell>
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
                            : question.skill === "Writing"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-purple-100 text-purple-700"
                        }
                      >
                        {question.skill}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {question.type === "mcq_single"
                        ? "MCQ (1)"
                        : question.type === "mcq_multi"
                        ? "MCQ (nhiều)"
                        : question.type === "fill_blank"
                        ? "Điền chỗ trống"
                        : question.type === "writing_prompt"
                        ? "Writing prompt"
                        : "Speaking prompt"}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {question.points}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {question.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-question-${question.id}`}
                          onClick={() => {
                            setEditingQuestion(question);
                            setIsModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-view-question-${question.id}`}
                          onClick={() => setViewingQuestion(question)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-assign-question-${question.id}`}
                          onClick={() => setAssignTarget(question)}
                          title="Assign to test set"
                        >
                          <FolderPlus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-question-${question.id}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setQuestionToDelete(question)}
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
      <QuestionFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingQuestion(null);
          }
        }}
        question={editingQuestion ?? undefined}
      />
      <QuestionAssignModal
        question={assignTarget}
        onClose={() => setAssignTarget(null)}
      />
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{questionToDelete?.title || questionToDelete?.type}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => questionToDelete && deleteQuestionMutation.mutate(questionToDelete)}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Grading View Component
function GradingView() {
  const [filterSkill, setFilterSkill] = useState<string>("all");
  const { data: queue, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/submissions", filterSkill],
    queryFn: async () => {
      const skillParam = filterSkill === "all" ? "" : `&skill=${encodeURIComponent(filterSkill)}`;
      const url = `/api/admin/submissions?status=submitted${skillParam}`;
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
              <SelectItem value="all">All</SelectItem>
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
  const [filterSkill, setFilterSkill] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTipFormOpen, setIsTipFormOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [viewTip, setViewTip] = useState<Tip | null>(null);
  const [tipToDelete, setTipToDelete] = useState<Tip | null>(null);
  const { toast } = useToast();

  const { data: tips } = useQuery<Tip[]>({
    queryKey: ["/api/tips"],
  });

  const filteredTips = useMemo(() => {
    if (!tips) return [];
    return tips.filter((tip) => {
      if (filterSkill !== "all" && tip.skill !== filterSkill) return false;
      if (searchQuery && !tip.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tips, filterSkill, searchQuery]);

  const deleteTip = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/tips/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
      toast({ title: "Tip deleted", description: "The tip has been removed." });
      setTipToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Unable to delete tip",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (tipToDelete?.id) {
      deleteTip.mutate(tipToDelete.id);
    }
  };

  const badgeClassForSkill = (skill: string) => {
    switch (skill) {
      case "Reading":
        return "bg-blue-100 text-blue-700";
      case "Listening":
        return "bg-cyan-100 text-cyan-700";
      case "Speaking":
        return "bg-green-100 text-green-700";
      case "Writing":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Study tips & guides</h1>
        <p className="text-gray-600">Create learning resources for students</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            data-testid="button-add-tip"
            className="gap-2"
            onClick={() => {
              setEditingTip(null);
              setIsTipFormOpen(true);
            }}
          >
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
                <SelectItem value="GrammarVocabulary">Grammar &amp; Vocabulary</SelectItem>
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
              {filteredTips.length === 0 ? (
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
                      <Badge variant="secondary" className={badgeClassForSkill(tip.skill)}>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-tip-${tip.id}`}
                          onClick={() => {
                            setEditingTip(tip);
                            setIsTipFormOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-view-tip-${tip.id}`}
                          onClick={() => setViewTip(tip)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-tip-${tip.id}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setTipToDelete(tip)}
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

      <TipFormModal
        open={isTipFormOpen}
        tip={editingTip}
        onOpenChange={(open) => {
          setIsTipFormOpen(open);
          if (!open) {
            setEditingTip(null);
          }
        }}
      />

      <Dialog
        open={Boolean(viewTip)}
        onOpenChange={(open) => {
          if (!open) setViewTip(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewTip?.title}</DialogTitle>
            <DialogDescription>
              {viewTip ? `${viewTip.skill} · ${viewTip.priority ?? "medium"} priority` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              {viewTip && new Date(viewTip.createdAt).toLocaleString("vi-VN")}
            </div>
            <p className="whitespace-pre-wrap text-gray-800">{viewTip?.content}</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(tipToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteTip.isPending) setTipToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tip</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected tip will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTip.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteTip.isPending}
            >
              {deleteTip.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Media View Component
function MediaView() {
  const { data: mediaFiles } = useQuery<Media[]>({
    queryKey: ["/api/media"],
  });
  const handleUploaded = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/media"] });
  };

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Media library</h1>
        <p className="text-gray-600">Manage audio and images for questions</p>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <MediaUploadButton onUploaded={handleUploaded} />
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
        <p className="text-xs text-muted-foreground mb-4">
          Files are stored under <code>/uploads</code> and automatically recorded in SQL when <code>DATABASE_URL</code>{" "}
          is configured on the server.
        </p>

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

type AdminUserSummary = {
  id: string;
  username: string;
  role: "admin" | "student";
  isActive?: boolean;
  createdAt?: string | null;
  lastLogin?: string | null;
};

function UsersView() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserSummary | null>(null);
  const [newUser, setNewUser] = useState<{ username: string; password: string; role: "admin" | "student" }>(
    {
      username: "",
      password: "",
      role: "student",
    },
  );

  const { data: users, isLoading } = useQuery<AdminUserSummary[]>({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation<
    AdminUserSummary,
    Error,
    { username: string; password: string; role: "admin" | "student" }
  >({
    mutationFn: async (payload) => {
      const res = await apiRequest("/api/admin/users", "POST", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Tạo tài khoản thành công",
        description: "Người dùng mới đã được thêm vào hệ thống.",
      });
      setIsCreateOpen(false);
      setNewUser({ username: "", password: "", role: "student" });
    },
    onError: (error) => {
      toast({
        title: "Không thể tạo tài khoản",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation<
    AdminUserSummary,
    Error,
    { id: string; role: "admin" | "student"; username: string }
  >({
    mutationFn: async (payload) => {
      const res = await apiRequest(`/api/admin/users/${payload.id}`, "PATCH", { role: payload.role });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Cập nhật quyền thành công",
        description: `${variables.username} đã được chuyển sang nhóm ${
          variables.role === "admin" ? "quản trị viên" : "học viên"
        }`,
      });
    },
    onError: (error) => {
      toast({
        title: "Không thể cập nhật quyền",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation<void, Error, { id: string; username: string }>({
    mutationFn: async (payload) => {
      await apiRequest(`/api/admin/users/${payload.id}`, "DELETE");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserToDelete(null);
      toast({
        title: "Đã xóa người dùng",
        description: `${variables.username} đã bị xóa khỏi hệ thống.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Không thể xóa người dùng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users
      .filter((item) => {
        if (roleFilter !== "all" && item.role !== roleFilter) return false;
        if (searchQuery && !item.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      });
  }, [users, roleFilter, searchQuery]);

  const totalUsers = users?.length ?? 0;
  const adminCount = users?.filter((user) => user.role === "admin").length ?? 0;
  const studentCount = users?.filter((user) => user.role === "student").length ?? 0;
  const activeCount = users?.filter((user) => user.isActive !== false).length ?? 0;

  const pendingRoleUserId = updateRoleMutation.variables?.id;
  const pendingDeleteUserId = deleteUserMutation.variables?.id;

  const handleCreateUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newUser.username.trim()) {
      toast({
        title: "Tên đăng nhập không hợp lệ",
        description: "Vui lòng nhập tên đăng nhập.",
        variant: "destructive",
      });
      return;
    }
    if (newUser.password.trim().length < 6) {
      toast({
        title: "Mật khẩu quá ngắn",
        description: "Mật khẩu cần có tối thiểu 6 ký tự.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate({ ...newUser });
  };

  const handleRoleChange = (user: AdminUserSummary, role: "admin" | "student") => {
    if (role === user.role) return;
    updateRoleMutation.mutate({ id: user.id, role, username: user.username });
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate({ id: userToDelete.id, username: userToDelete.username });
  };

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Người dùng</h1>
        <p className="text-gray-600">Quản lý tài khoản, phân quyền và trạng thái hoạt động</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white shadow-sm border border-primary/10" data-testid="user-stat-total">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Tổng tài khoản</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
            </div>
            <Users className="w-10 h-10 text-primary/80" />
          </div>
        </Card>
        <Card className="p-5 bg-white shadow-sm border border-indigo-100" data-testid="user-stat-admins">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Quản trị viên</p>
              <p className="text-3xl font-bold text-primary mt-2">{adminCount}</p>
            </div>
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
        </Card>
        <Card className="p-5 bg-white shadow-sm border border-cyan-100" data-testid="user-stat-students">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Học viên</p>
              <p className="text-3xl font-bold text-cyan-600 mt-2">{studentCount}</p>
            </div>
            <GraduationCap className="w-10 h-10 text-cyan-500" />
          </div>
        </Card>
        <Card className="p-5 bg-white shadow-sm border border-emerald-100" data-testid="user-stat-active">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Đang hoạt động</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{activeCount}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-emerald-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-user" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Thêm tài khoản
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm người dùng mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin tài khoản để cấp quyền truy cập vào hệ thống.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <div className="space-y-1">
                  <Label htmlFor="new-username">Tên đăng nhập</Label>
                  <Input
                    id="new-username"
                    value={newUser.username}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="vd: giangvien01"
                    data-testid="input-new-username"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password">Mật khẩu tạm</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newUser.password}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Tối thiểu 6 ký tự"
                    data-testid="input-new-password"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phân quyền</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "admin" | "student") =>
                      setNewUser((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger data-testid="select-new-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Học viên</SelectItem>
                      <SelectItem value="admin">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    data-testid="button-create-user"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Tạo tài khoản
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex gap-2 ml-auto flex-1 justify-end">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44" data-testid="filter-user-role">
                <SelectValue placeholder="Tất cả quyền" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả quyền</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="student">Học viên</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Tìm kiếm theo tên đăng nhập..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-56"
              data-testid="input-search-users"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Quyền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hoạt động cuối</TableHead>
                <TableHead className="w-48 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    Đang tải danh sách người dùng...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3" />
                    <p>Không tìm thấy người dùng phù hợp</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userItem, index) => {
                  const createdAtLabel = userItem.createdAt
                    ? new Date(userItem.createdAt).toLocaleDateString("vi-VN")
                    : "--";
                  const lastLoginLabel = userItem.lastLogin
                    ? new Date(userItem.lastLogin).toLocaleString("vi-VN")
                    : "Chưa cập nhật";
                  const isSelf = currentUser?.id === userItem.id;

                  return (
                    <TableRow key={userItem.id} data-testid={`user-row-${userItem.id}`} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{userItem.username}</TableCell>
                      <TableCell>
                        <Select
                          value={userItem.role}
                          onValueChange={(value: "admin" | "student") =>
                            handleRoleChange(userItem, value)
                          }
                          disabled={
                            updateRoleMutation.isPending && pendingRoleUserId === userItem.id
                          }
                          data-testid={`select-user-role-${userItem.id}`}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Quản trị viên</SelectItem>
                            <SelectItem value="student">Học viên</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={userItem.isActive === false ? "secondary" : "default"}
                          className={
                            userItem.isActive === false
                              ? "bg-gray-200 text-gray-600"
                              : "bg-emerald-100 text-emerald-700"
                          }
                        >
                          {userItem.isActive === false ? "Tạm khóa" : "Hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{createdAtLabel}</TableCell>
                      <TableCell className="text-sm text-gray-500">{lastLoginLabel}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setUserToDelete(userItem)}
                            disabled={
                              isSelf ||
                              (deleteUserMutation.isPending && pendingDeleteUserId === userItem.id)
                            }
                            data-testid={`button-delete-user-${userItem.id}`}
                          >
                            {deleteUserMutation.isPending && pendingDeleteUserId === userItem.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => (!open ? setUserToDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn tài khoản {userToDelete?.username}. Bạn không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              data-testid="confirm-delete-user"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Xóa tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
