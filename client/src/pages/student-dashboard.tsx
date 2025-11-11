import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GraduationCap,
  Rocket,
  Search,
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Library,
  Lightbulb,
  BarChart3,
  Timer,
  Flame,
  Trophy,
  LogOut,
  UserCircle,
  Settings,
  Bell,
  RotateCw,
  Clock3,
  Sparkles,
} from "lucide-react";
import type { Activity, TestSet, Tip } from "@shared/schema";
import { useLocation } from "wouter";

export default function StudentDashboard() {
  const [currentPage, setCurrentPage] = useState("practice");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#9CCC65] via-[#66BB6A] to-[#1B5E20]">
      {/* Glassmorphic Sidebar */}
      <aside className="w-80 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-3xl border-r border-white/20"></div>
        <div className="relative z-10 h-full flex flex-col text-white">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <GraduationCap className="w-8 h-8 drop-shadow-lg" />
            <div>
              <div className="font-bold text-xl">APTIS KEYS</div>
              <div className="text-xs text-white/80">Luyện thi APTIS</div>
            </div>
          </div>

          {/* Current Page Indicator */}
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 rounded-2xl p-4 mb-10 shadow-2xl">
            <div className="text-sm text-white/90 mb-1">Trang hiện tại</div>
            <div className="font-semibold text-lg">
              {currentPage === "practice" ? "Luyện tập" : currentPage === "tips" ? "Mẹo học" : "Thống kê"}
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-2 mb-auto">
            <div className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-4">
              Menu chính
            </div>
            <Button
              variant="ghost"
              data-testid="nav-student-practice"
              onClick={() => setCurrentPage("practice")}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-300 backdrop-blur-md ${
                currentPage === "practice"
                  ? "bg-white/15 shadow-lg"
                  : "hover:bg-white/10 hover:translate-x-2"
              }`}
            >
              <span className="font-medium">Luyện tập</span>
              <span className="text-lg">→</span>
            </Button>
            <Button
              variant="ghost"
              data-testid="nav-student-tips"
              onClick={() => setCurrentPage("tips")}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-300 backdrop-blur-md ${
                currentPage === "tips"
                  ? "bg-white/15 shadow-lg"
                  : "hover:bg-white/10 hover:translate-x-2"
              }`}
            >
              <span className="font-medium">Mẹo & Hướng dẫn</span>
              <span className="text-lg">→</span>
            </Button>
            <Button
              variant="ghost"
              data-testid="nav-student-progress"
              onClick={() => setCurrentPage("progress")}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-300 backdrop-blur-md ${
                currentPage === "progress"
                  ? "bg-white/15 shadow-lg"
                  : "hover:bg-white/10 hover:translate-x-2"
              }`}
            >
              <span className="font-medium">Tiến độ học tập</span>
              <span className="text-lg">→</span>
            </Button>
          </div>

          {/* Bottom Section with Rocket */}
          <div className="text-center pt-6 border-t border-white/20">
            <Rocket className="w-12 h-12 mx-auto mb-4 animate-float" />
            <p className="text-sm text-white/90 leading-relaxed mb-4">
              Học tập hiệu quả
              <br />
              Chinh phục APTIS!
            </p>
            <Button 
              data-testid="button-join-group"
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Join Group FB
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 m-5 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="flex items-center bg-white/80 backdrop-blur-xl border border-white/30 rounded-full px-6 py-3 shadow-lg focus-within:shadow-xl focus-within:-translate-y-0.5 transition-all">
                  <Input
                    data-testid="input-student-search"
                    type="text"
                    placeholder="Tìm kiếm bài học..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
                  />
                  <Button 
                    data-testid="button-student-search"
                    className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-full ml-3 shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg shadow-lg cursor-pointer hover:scale-110 transition-transform" data-testid="button-student-avatar">
                    {user?.username?.charAt(0).toUpperCase() || "SV"}
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
                    data-testid="menu-student-profile"
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

          {/* Content */}
          <div className="p-8">
            {currentPage === "practice" && <PracticePage searchQuery={searchQuery} />}
            {currentPage === "tips" && <TipsPage searchQuery={searchQuery} />}
            {currentPage === "progress" && <ProgressPage />}
          </div>
        </div>
      </main>
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading, refetch } = useQuery<Activity[]>({
    queryKey: ["/api/activities?limit=6"],
  });

  const count = notifications?.length ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="button-student-notifications"
          className="relative w-12 h-12 rounded-2xl bg-white/20 border border-white/40 text-white flex items-center justify-center shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] text-xs rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white font-semibold flex items-center justify-center border border-white/60">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0 bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400">Updates</p>
            <p className="text-lg font-semibold text-gray-900">Notifications</p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-primary hover:bg-primary/10"
            onClick={(event) => {
              event.stopPropagation();
              refetch();
            }}
            data-testid="button-refresh-student-notifications"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
          {isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">Loading latest updates...</div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notification) => {
              const palette = getNotificationPalette(notification.action);
              return (
                <div
                  key={notification.id}
                  data-testid={`notification-item-${notification.id}`}
                  className="px-5 py-4 hover:bg-primary/5 transition-colors flex items-start gap-4"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${palette.icon}`}>
                    {palette.iconElement}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${palette.badge}`}>
                        {formatActionLabel(notification.action)}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {new Date(notification.timestamp).toLocaleTimeString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2">
                      {notification.resourceTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatResourceType(notification.resourceType)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              Nothing new yet. Keep practicing and check back soon!
            </div>
          )}
        </div>
        <div className="px-5 py-3 text-right text-[11px] text-gray-400 bg-gray-50/70">
          Auto-synced every visit
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatActionLabel(action: string) {
  if (action === "created") return "New content";
  if (action === "updated") return "Updated";
  if (action === "deleted") return "Removed";
  return "Activity";
}

function formatResourceType(value?: string | null) {
  if (!value) return "General update";
  const cleaned = value.replace(/[_-]/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getNotificationPalette(action: string) {
  if (action === "created") {
    return {
      icon: "bg-emerald-100 text-emerald-600",
      badge: "bg-emerald-50 text-emerald-700",
      iconElement: <Sparkles className="w-5 h-5" />,
    };
  }
  if (action === "updated") {
    return {
      icon: "bg-cyan-100 text-cyan-600",
      badge: "bg-cyan-50 text-cyan-700",
      iconElement: <PenTool className="w-5 h-5" />,
    };
  }
  if (action === "deleted") {
    return {
      icon: "bg-rose-100 text-rose-600",
      badge: "bg-rose-50 text-rose-700",
      iconElement: <Flame className="w-5 h-5" />,
    };
  }
  return {
    icon: "bg-gray-100 text-gray-600",
    badge: "bg-gray-50 text-gray-600",
    iconElement: <Library className="w-5 h-5" />,
  };
}

// Practice Page Component
function PracticePage({ searchQuery }: { searchQuery: string }) {
  const [activeSkill, setActiveSkill] = useState("all");
  
  const { data: testSets } = useQuery<TestSet[]>({
    queryKey: ["/api/test-sets"],
  });

  const filteredSets = testSets?.filter((set) => {
    if (set.status !== "published") return false;
    if (activeSkill !== "all" && set.skill !== activeSkill) return false;
    if (searchQuery && !set.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const skillCategories = {
    all: { label: "Tất cả", sets: filteredSets || [] },
    Reading: { label: "Reading", sets: filteredSets?.filter(s => s.skill === "Reading") || [] },
    Listening: { label: "Listening", sets: filteredSets?.filter(s => s.skill === "Listening") || [] },
    Speaking: { label: "Speaking", sets: filteredSets?.filter(s => s.skill === "Speaking") || [] },
    Writing: { label: "Writing", sets: filteredSets?.filter(s => s.skill === "Writing") || [] },
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Title with Gradient */}
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-3 tracking-tight">
          Luyện tập APTIS
        </h1>
        <p className="text-gray-600 text-lg">Chọn kỹ năng và bắt đầu luyện tập ngay!</p>
      </div>

      {/* Skill Tabs */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-white/30 inline-flex gap-2 mx-auto" data-testid="skill-tabs">
        {Object.entries(skillCategories).map(([key, { label }]) => (
          <button
            key={key}
            data-testid={`tab-${key.toLowerCase()}`}
            onClick={() => setActiveSkill(key)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeSkill === key
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg -translate-y-0.5"
                : "text-gray-700 hover:bg-gray-100 hover:-translate-y-px"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Practice Cards Grid */}
      {!filteredSets || filteredSets.length === 0 ? (
        <div className="text-center py-20">
          <Library className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 text-lg">Chưa có bài luyện tập nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5" data-testid="practice-cards-grid">
          {filteredSets.map((set) => (
            <PracticeCard key={set.id} testSet={set} />
          ))}
        </div>
      )}
    </div>
  );
}

// Practice Card Component
function PracticeCard({ testSet }: { testSet: TestSet }) {
  const gradients = {
    Reading: "from-blue-500 to-blue-700",
    Listening: "from-cyan-500 to-cyan-700",
    Speaking: "from-green-500 to-green-700",
    Writing: "from-orange-500 to-orange-700",
    GrammarVocabulary: "from-purple-500 to-indigo-700",
    General: "from-slate-500 to-slate-700",
  } as const;

  const icons = {
    Reading: BookOpen,
    Listening: Headphones,
    Speaking: Mic,
    Writing: PenTool,
    GrammarVocabulary: BookOpen,
    General: Library,
  } as const;
  
  const skillKey = (testSet.skill in icons ? testSet.skill : "General") as keyof typeof icons;
  const IconComponent = icons[skillKey] || BookOpen;
  const gradientClass = gradients[skillKey] || gradients.General;

  const [, setLocation] = useLocation();

  async function onStart() {
    try {
      const res = await fetch("/api/submissions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ setId: testSet.id }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Failed to start submission`);
      }
      const data = await res.json();
      const submissionId = data.id;
      setLocation(`/student/test/${testSet.id}/${submissionId}`);
    } catch (e) {
      // Optionally surface error via toast if available
      console.error(e);
      alert("Cannot start test. Please login or try again.");
    }
  }

  return (
    <button
      onClick={onStart}
      data-testid={`practice-card-${testSet.id}`}
      className={`relative overflow-hidden bg-gradient-to-br ${
        gradientClass
      } text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 text-left group`}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-lg mb-1">{testSet.title}</div>
          <div className="text-sm text-white/90">{testSet.questionCount} câu hỏi</div>
        </div>
        <div className="text-2xl opacity-80 group-hover:translate-x-1 transition-transform">
          →
        </div>
      </div>
    </button>
  );
}

// Tips Page Component
function TipsPage({ searchQuery }: { searchQuery: string }) {
  const [filterSkill, setFilterSkill] = useState("");

  const { data: tips } = useQuery<Tip[]>({
    queryKey: ["/api/tips"],
  });

  const filteredTips = tips?.filter((tip) => {
    if (tip.status !== "published") return false;
    if (filterSkill && tip.skill !== filterSkill) return false;
    if (searchQuery && !tip.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-3 tracking-tight">
          Mẹo & Hướng dẫn
        </h1>
        <p className="text-gray-600 text-lg">Tổng hợp các mẹo học hiệu quả cho kỳ thi APTIS</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          data-testid="filter-tip-all"
          onClick={() => setFilterSkill("")}
          className={`px-5 py-2 rounded-full font-medium transition-all ${
            filterSkill === ""
              ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
              : "bg-white/60 text-gray-700 hover:bg-white/80"
          }`}
        >
          Tất cả
        </button>
        {["Reading", "Listening", "Speaking", "Writing", "General"].map((skill) => (
          <button
            key={skill}
            data-testid={`filter-tip-${skill.toLowerCase()}`}
            onClick={() => setFilterSkill(skill)}
            className={`px-5 py-2 rounded-full font-medium transition-all ${
              filterSkill === skill
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white/80"
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Tips Grid */}
      {!filteredTips || filteredTips.length === 0 ? (
        <div className="text-center py-20">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 text-lg">Chưa có mẹo học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6" data-testid="tips-grid">
          {filteredTips.map((tip) => (
            <Card
              key={tip.id}
              data-testid={`tip-card-${tip.id}`}
              className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors">
                      {tip.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={
                        tip.skill === "Reading" ? "bg-blue-100 text-blue-700" :
                        tip.skill === "Listening" ? "bg-cyan-100 text-cyan-700" :
                        tip.skill === "Speaking" ? "bg-green-100 text-green-700" :
                        tip.skill === "Writing" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }
                    >
                      {tip.skill}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">{tip.content}</p>
                  <div className="mt-3 text-xs text-gray-400">
                    {new Date(tip.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Progress Page Component (placeholder)
function ProgressPage() {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-3 tracking-tight">
          Tiến độ học tập
        </h1>
        <p className="text-gray-600 text-lg">Theo dõi quá trình học tập của bạn</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Stats Cards */}
        <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
          <div className="text-gray-700 font-medium">Bài đã hoàn thành</div>
        </Card>
        <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <div className="text-4xl font-bold text-green-600 mb-2">0</div>
          <div className="text-gray-700 font-medium">Điểm trung bình</div>
        </Card>
        <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <Timer className="w-12 h-12 mx-auto mb-3 text-purple-600" />
          <div className="text-4xl font-bold text-purple-600 mb-2">0h</div>
          <div className="text-gray-700 font-medium">Thời gian luyện tập</div>
        </Card>
        <Card className="p-8 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <Flame className="w-12 h-12 mx-auto mb-3 text-orange-600" />
          <div className="text-4xl font-bold text-orange-600 mb-2">0</div>
          <div className="text-gray-700 font-medium">Ngày liên tiếp</div>
        </Card>
      </div>

      <Card className="p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 text-lg">Bắt đầu luyện tập để xem tiến độ của bạn!</p>
      </Card>
    </div>
  );
}

