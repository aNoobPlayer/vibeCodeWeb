import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
  X,
} from "lucide-react";
import type { Activity, Course, Lesson, TestSet, Tip } from "@shared/schema";

type TestResult = {
  setId: number;
  totalQuestions?: number | null;
  correctAnswers?: number | null;
  score?: number | null;
  createdAt?: string | Date;
};
import { useLocation } from "wouter";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export default function StudentDashboard() {
  const [currentPage, setCurrentPage] = useState("practice");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const trimmedSearch = searchQuery.trim();
  const hasSearch = trimmedSearch.length > 0;
  const searchPlaceholder =
    currentPage === "practice"
      ? "Tìm kiếm bài luyện tập..."
      : currentPage === "courses"
        ? "Tìm kiếm khóa học..."
        : currentPage === "tips"
          ? "Tìm kiếm mẹo học..."
          : "Tìm kiếm...";

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-[#9CCC65] via-[#66BB6A] to-[#1B5E20]">
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
              {currentPage === "practice" ? "Luyện tập" : currentPage === "courses" ? "Khóa học" : currentPage === "tips" ? "Mẹo học" : "Thống kê"}
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-2 mb-auto">
            <div className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-4">Menu chính</div>
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
              <span className="text-lg">›</span>
            </Button>
            <Button
              variant="ghost"
              data-testid="nav-student-courses"
              onClick={() => setCurrentPage("courses")}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-300 backdrop-blur-md ${
                currentPage === "courses"
                  ? "bg-white/15 shadow-lg"
                  : "hover:bg-white/10 hover:translate-x-2"
              }`}
            >
              <span className="font-medium">Khóa học</span>
              <span className="text-lg">›</span>
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
              <span className="text-lg">›</span>
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
              <span className="text-lg">›</span>
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
      <main className="flex-1 min-h-0 m-5 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="h-full scroll-ghost overflow-y-auto">
          {/* Header */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 p-6 backdrop-blur">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="flex items-center bg-white/80 backdrop-blur-xl border border-white/30 rounded-full px-6 py-3 shadow-lg focus-within:shadow-xl focus-within:-translate-y-0.5 transition-all">
                  <Input
                    data-testid="input-student-search"
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
                  />
                  <Button
                    type="button"
                    data-testid="button-student-search"
                    className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-full ml-3 shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    onClick={() => {
                      if (hasSearch) setSearchQuery("");
                    }}
                    aria-label={hasSearch ? "Xóa tìm kiếm" : "Tìm kiếm"}
                  >
                    {hasSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
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
                <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setLocation("/profile");
                    }}
                    data-testid="menu-student-profile"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Cài đặt</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <div className="p-8">
            {currentPage === "practice" && (
              <PracticePage searchQuery={searchQuery} onClearSearch={() => setSearchQuery("")} />
            )}
            {currentPage === "courses" && (
              <CoursesPage searchQuery={searchQuery} onClearSearch={() => setSearchQuery("")} />
            )}
            {currentPage === "tips" && (
              <TipsPage searchQuery={searchQuery} onClearSearch={() => setSearchQuery("")} />
            )}
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400">Cập nhật</p>
            <p className="text-lg font-semibold text-gray-900">Thông báo</p>
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
        <div className="max-h-[360px] scroll-ghost overflow-y-auto divide-y divide-gray-100">
          {isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">Đang tải thông báo mới...</div>
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
function PracticePage({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch: () => void;
}) {
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
  const hasSearch = searchQuery.trim().length > 0;

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
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-3 tracking-tight">Luyện tập APTIS</h1>
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
          <p className="text-gray-500 text-lg">
            {hasSearch ? "Không tìm thấy bài luyện tập phù hợp." : "Chưa có bài luyện tập nào."}
          </p>
          {hasSearch && (
            <Button variant="outline" className="mt-4" onClick={onClearSearch}>
              Xóa tìm kiếm
            </Button>
          )}
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


// Courses Page Component
function CoursesPage({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch: () => void;
}) {
  const [filterSkill, setFilterSkill] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeGroup, setActiveGroup] = useState<"studying" | "pending" | "open">("studying");
  const didSetInitialGroup = useRef(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: courses } = useQuery<(Course & { enrollmentStatus?: string })[]>({
    queryKey: ["/api/courses"],
  });

  const filteredCourses = (courses ?? []).filter((course) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      course.name.toLowerCase().includes(q) ||
      course.code.toLowerCase().includes(q) ||
      (course.description ?? "").toLowerCase().includes(q)
    );
  });
  const hasSearch = searchQuery.trim().length > 0;

  const courseGroups = useMemo(() => {
    const studying = filteredCourses.filter((course) => course.enrollmentStatus === "approved");
    const pending = filteredCourses.filter((course) => course.enrollmentStatus === "pending");
    const open = filteredCourses.filter(
      (course) => course.enrollmentStatus !== "approved" && course.enrollmentStatus !== "pending",
    );
    return { studying, pending, open };
  }, [filteredCourses]);

  const visibleCourses = courseGroups[activeGroup];

  useEffect(() => {
    if (didSetInitialGroup.current) return;
    const nextGroup =
      (courseGroups.studying.length > 0 && "studying") ||
      (courseGroups.pending.length > 0 && "pending") ||
      (courseGroups.open.length > 0 && "open") ||
      null;
    if (nextGroup && nextGroup !== activeGroup) {
      setActiveGroup(nextGroup);
    }
    if (nextGroup || filteredCourses.length === 0) {
      didSetInitialGroup.current = true;
    }
  }, [activeGroup, courseGroups, filteredCourses.length]);

  useEffect(() => {
    if (visibleCourses.length === 0) {
      if (selectedCourseId) setSelectedCourseId(null);
      return;
    }
    if (!selectedCourseId || !visibleCourses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(visibleCourses[0].id);
    }
  }, [selectedCourseId, visibleCourses]);

  const activeCourse = filteredCourses.find((course) => course.id === selectedCourseId) ?? null;
  const enrollmentStatus = activeCourse?.enrollmentStatus ?? "none";
  const isEnrolled = enrollmentStatus === "approved";
  const isOpen = (activeCourse?.status ?? "open") === "open";
  const canApply = isOpen && (enrollmentStatus === "none" || enrollmentStatus === "rejected");

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons", { courseId: selectedCourseId ?? "none" }],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const res = await fetch(`/api/lessons?courseId=${selectedCourseId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: Boolean(selectedCourseId) && isEnrolled,
  });

  const { data: testSets } = useQuery<TestSet[]>({
    queryKey: ["/api/test-sets"],
  });

  const { data: results } = useQuery<TestResult[]>({
    queryKey: ["/api/results/me"],
  });

  const testSetMap = useMemo(() => {
    const map = new Map<string, string>();
    (testSets ?? []).forEach((set) => {
      map.set(String(set.id), set.title);
    });
    return map;
  }, [testSets]);

  const bestScoresBySet = useMemo(() => {
    const map = new Map<string, number>();
    (results ?? []).forEach((result) => {
      const total = result.totalQuestions ?? 0;
      if (!total) return;
      const correct = result.correctAnswers ?? 0;
      const percent = Math.round((correct / total) * 100);
      const setId = String(result.setId);
      const prev = map.get(setId) ?? 0;
      if (percent > prev) map.set(setId, percent);
    });
    return map;
  }, [results]);

  const filteredLessons = lessons?.filter((lesson) => {
    if (lesson.status !== "published") return false;
    if (filterSkill && lesson.skill !== filterSkill) return false;
    return true;
  });

  const sortedLessons = useMemo(() => {
    return [...(filteredLessons ?? [])].sort((a, b) => {
      const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [filteredLessons]);
  const lessonOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedLessons.forEach((lesson, index) => {
      map.set(lesson.id, index + 1);
    });
    return map;
  }, [sortedLessons]);

  const lessonsByLevel = useMemo(() => {
    const map = new Map<number, Lesson[]>();
    (sortedLessons ?? []).forEach((lesson) => {
      const level = lesson.level ?? 1;
      if (!map.has(level)) map.set(level, []);
      map.get(level)?.push(lesson);
    });
    return map;
  }, [sortedLessons]);
  const levelsSorted = useMemo(
    () => Array.from(lessonsByLevel.keys()).sort((a, b) => a - b),
    [lessonsByLevel],
  );

  const passThreshold = activeCourse?.passThreshold ?? 80;
  const completionByLevel = useMemo(() => {
    const map = new Map<number, { percent: number; totalTests: number; passedTests: number }>();
    lessonsByLevel.forEach((lessons, level) => {
      const tests = lessons.filter((lesson) => lesson.testSetId);
      if (tests.length === 0) {
        map.set(level, { percent: 100, totalTests: 0, passedTests: 0 });
        return;
      }
      const passed = tests.filter((lesson) => {
        const best = bestScoresBySet.get(String(lesson.testSetId)) ?? 0;
        return best >= passThreshold;
      }).length;
      const percent = Math.round((passed / tests.length) * 100);
      map.set(level, { percent, totalTests: tests.length, passedTests: passed });
    });
    return map;
  }, [bestScoresBySet, lessonsByLevel, passThreshold]);

  const unlockedLevel = useMemo(() => {
    const levels = Array.from(lessonsByLevel.keys()).sort((a, b) => a - b);
    if (levels.length === 0) return 1;
    let maxUnlocked = levels[0];
    for (const level of levels) {
      if (level === levels[0]) {
        maxUnlocked = level;
        continue;
      }
      const prev = level - 1;
      const completion = completionByLevel.get(prev)?.percent ?? 0;
      if (completion >= 80) {
        maxUnlocked = level;
      } else {
        break;
      }
    }
    return maxUnlocked;
  }, [completionByLevel, lessonsByLevel]);

  useEffect(() => {
    if (sortedLessons.length === 0) {
      if (selectedLesson) setSelectedLesson(null);
      return;
    }
    const eligible = sortedLessons.filter((lesson) => (lesson.level ?? 1) <= unlockedLevel);
    const nextLesson = eligible[0] ?? sortedLessons[0];
    if (!selectedLesson || !sortedLessons.some((lesson) => lesson.id === selectedLesson.id)) {
      setSelectedLesson(nextLesson);
    }
  }, [sortedLessons, selectedLesson, unlockedLevel]);

  const eligibleLessons = useMemo(
    () => sortedLessons.filter((lesson) => (lesson.level ?? 1) <= unlockedLevel),
    [sortedLessons, unlockedLevel],
  );
  const activeLesson =
    eligibleLessons.find((lesson) => lesson.id === selectedLesson?.id) ?? eligibleLessons[0] ?? null;
  const activeLessonIndex = activeLesson
    ? eligibleLessons.findIndex((lesson) => lesson.id === activeLesson.id)
    : -1;
  const activeLessonVideo = getYouTubeEmbedUrl(activeLesson?.youtubeUrl ?? null);
  const activeContentParagraphs = useMemo(() => {
    const text = activeLesson?.content ?? "";
    return text
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [activeLesson?.content]);
  const activeOutcomes = (activeLesson?.outcomes ?? []).filter((item) => item && item.trim());
  const activeKeyPoints = (activeLesson?.keyPoints ?? []).filter((item) => item && item.trim());
  const activePractice = (activeLesson?.practicePrompts ?? []).filter((item) => item && item.trim());
  const activeTestSetLabel = activeLesson?.testSetId
    ? testSetMap.get(String(activeLesson.testSetId)) ?? "Bài luyện tập"
    : null;
  const totalDuration = useMemo(
    () => sortedLessons.reduce((sum, lesson) => sum + (lesson.durationMinutes ?? 0), 0),
    [sortedLessons],
  );
  const progressPercent =
    eligibleLessons.length > 0 && activeLessonIndex >= 0
      ? Math.round(((activeLessonIndex + 1) / eligibleLessons.length) * 100)
      : 0;
  const progressLabel =
    eligibleLessons.length > 0
      ? `${Math.max(1, activeLessonIndex + 1)} / ${eligibleLessons.length}`
      : "0 / 0";
  const totalDurationLabel = totalDuration > 0 ? `${totalDuration} phút` : "Tự học";
  const totalLessons = sortedLessons.length;
  const unlockedLessons = eligibleLessons.length;
  const lockedLessons = Math.max(0, totalLessons - unlockedLessons);
  const totalLevels = levelsSorted.length;
  const unlockedLevels = levelsSorted.filter((level) => level <= unlockedLevel).length;
  const currentLevelProgress = completionByLevel.get(unlockedLevel)?.percent ?? 0;
  const activeLessonScore =
    activeLesson?.testSetId ? bestScoresBySet.get(String(activeLesson.testSetId)) ?? null : null;
  const activeLessonPassed = activeLessonScore !== null && activeLessonScore >= passThreshold;
  const courseAverageScore = useMemo(() => {
    const scores: number[] = [];
    sortedLessons.forEach((lesson) => {
      if (!lesson.testSetId) return;
      const score = bestScoresBySet.get(String(lesson.testSetId));
      if (typeof score === "number") scores.push(score);
    });
    if (scores.length === 0) return null;
    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.round(total / scores.length);
  }, [sortedLessons, bestScoresBySet]);
  const learningChecklist = useMemo(
    () => [
      { label: "Tóm tắt", value: activeLesson?.description ? "Sẵn sàng" : "Chưa có" },
      {
        label: "Nội dung",
        value: activeContentParagraphs.length ? `${activeContentParagraphs.length} đoạn` : "Chưa có",
      },
      {
        label: "Mục tiêu",
        value: activeOutcomes.length ? `${activeOutcomes.length} mục tiêu` : "Chưa có",
      },
      {
        label: "Điểm cần nhớ",
        value: activeKeyPoints.length ? `${activeKeyPoints.length} ý chính` : "Chưa có",
      },
      {
        label: "Thực hành",
        value: activePractice.length ? `${activePractice.length} bài` : "Chưa có",
      },
    ],
    [
      activeLesson?.description,
      activeContentParagraphs.length,
      activeOutcomes.length,
      activeKeyPoints.length,
      activePractice.length,
    ],
  );
  const canGoPrev = activeLessonIndex > 0;
  const canGoNext = activeLessonIndex >= 0 && activeLessonIndex < sortedLessons.length - 1;
  const goPrev = () => {
    if (!canGoPrev) return;
    setSelectedLesson(sortedLessons[activeLessonIndex - 1]);
  };
  const goNext = () => {
    if (!canGoNext) return;
    setSelectedLesson(sortedLessons[activeLessonIndex + 1]);
  };

  const skillLabels: Record<string, string> = {
    Reading: "Đọc hiểu",
    Listening: "Nghe hiểu",
    Speaking: "Nói",
    Writing: "Viết",
    GrammarVocabulary: "Ngữ pháp & Từ vựng",
    General: "Tổng hợp",
  };

  const applyMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await fetch(`/api/courses/${courseId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Đã gửi đăng ký",
        description: "Yêu cầu của bạn đang chờ giảng viên duyệt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Không thể đăng ký",
        description: error?.message ?? "Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const startLessonTest = async (testSetId: string | null | undefined) => {
    if (!testSetId) return;
    try {
      const res = await fetch("/api/submissions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ setId: testSetId }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to start submission");
      }
      const data = await res.json();
      const submissionId = data.id;
      setLocation(`/student/test/${testSetId}/${submissionId}`);
    } catch (error) {
      console.error(error);
      alert("Không thể bắt đầu bài kiểm tra. Vui lòng đăng nhập hoặc thử lại.");
    }
  };

  const renderCourseCard = (course: Course & { enrollmentStatus?: string }) => {
    const status = course.enrollmentStatus ?? "none";
    const isActive = course.id === selectedCourseId;
    const statusLabel =
      status === "approved"
        ? "Đang học"
        : status === "pending"
          ? "Chờ duyệt"
          : status === "rejected"
            ? "Từ chối"
            : "Mở đăng ký";
    return (
      <button
        key={course.id}
        type="button"
        onClick={() => setSelectedCourseId(course.id)}
        className={`rounded-2xl border px-5 py-4 text-left transition-all ${
          isActive
            ? "border-primary/40 bg-primary/10 shadow-md"
            : "border-white/70 bg-white/80 hover:bg-white"
        }`}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{course.code}</p>
        <div className="mt-2 flex items-start justify-between gap-2">
          <p className="text-lg font-semibold text-gray-900">{course.name}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              status === "approved"
                ? "bg-emerald-100 text-emerald-700"
                : status === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : status === "rejected"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-blue-100 text-blue-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {course.description || "Chưa có mô tả khóa học."}
        </p>
      </button>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-3 tracking-tight">
          Khóa học
        </h1>
        <p className="text-gray-600 text-lg">Chọn khóa học để bắt đầu học.</p>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-20">
          <Library className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 text-lg">
            {hasSearch ? "Không tìm thấy khóa học phù hợp." : "Chưa có khóa học nào."}
          </p>
          {hasSearch && (
            <Button variant="outline" className="mt-4" onClick={onClearSearch}>
              Xóa tìm kiếm
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {([
              { key: "studying", label: "Đang học", count: courseGroups.studying.length },
              { key: "pending", label: "Chờ duyệt", count: courseGroups.pending.length },
              { key: "open", label: "Chưa đăng ký", count: courseGroups.open.length },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveGroup(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeGroup === tab.key
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                    : "bg-white/70 text-gray-700 hover:bg-white"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {visibleCourses.length === 0 ? (
              <Card className="p-5 text-sm text-gray-500">
                {activeGroup === "studying"
                  ? "Bạn chưa đăng ký khóa học nào."
                  : activeGroup === "pending"
                    ? "Không có yêu cầu chờ duyệt."
                    : "Chưa có khóa học để đăng ký."}
              </Card>
            ) : (
              visibleCourses.map(renderCourseCard)
            )}
          </div>
        </div>
      )}

      {activeCourse && (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Khóa học đang chọn</p>
                  <h2 className="text-3xl font-bold text-gray-900 mt-2">{activeCourse.name}</h2>
                  <p className="mt-2 text-gray-600 text-sm md:text-base">
                    {activeCourse.description || "Chưa có mô tả khóa học."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-gray-600 shadow-sm">
                    {sortedLessons.length} bài học
                  </span>
                  <span className="rounded-full bg-white/90 px-3 py-1 text-gray-600 shadow-sm">
                    {totalDurationLabel}
                  </span>
                  <span className="rounded-full bg-white/90 px-3 py-1 text-gray-600 shadow-sm">
                    {filterSkill ? skillLabels[filterSkill] ?? filterSkill : "Tất cả kỹ năng"}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Tiến độ khóa học</span>
                  <span>{progressLabel}</span>
                </div>
                <div className="mt-2">
                  <Progress value={progressPercent} className="h-2" />
                </div>
                {lessonsByLevel.size > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    {lessonsByLevel.has(unlockedLevel + 1)
                      ? completionByLevel.get(unlockedLevel)?.totalTests
                        ? `Hoàn thành bài kiểm tra cấp độ ${unlockedLevel} đạt ${passThreshold}% để mở khóa cấp độ ${
                            unlockedLevel + 1
                          }. Hiện tại: ${completionByLevel.get(unlockedLevel)?.percent ?? 0}%`
                        : `Cấp độ ${unlockedLevel} không có bài kiểm tra. Bạn có thể chuyển sang cấp độ ${
                            unlockedLevel + 1
                          }.`
                      : "Tất cả cấp độ đã được mở khóa."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isEnrolled && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
              <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
                <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Lộ trình hôm nay</p>
                      <h3 className="text-2xl font-semibold text-gray-900">
                        {activeLesson?.title ?? "Chưa có bài học"}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {activeLesson?.description || "Chọn một bài học để bắt đầu lộ trình."}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {activeLesson ? (
                      <>
                        <span className="rounded-full bg-white/80 px-2 py-1">
                          Cấp độ {activeLesson.level ?? 1}
                        </span>
                        <span className="rounded-full bg-white/80 px-2 py-1">
                          {skillLabels[activeLesson.skill] ?? activeLesson.skill}
                        </span>
                        <span className="rounded-full bg-white/80 px-2 py-1">
                          {activeLesson.durationMinutes ? `${activeLesson.durationMinutes} phút` : "Tự học"}
                        </span>
                        {activeLesson.testSetId && (
                          <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">
                            Có bài kiểm tra
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="rounded-full bg-white/80 px-2 py-1">
                        Chưa có bài học để hiển thị.
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        if (activeLesson) setSelectedLesson(activeLesson);
                      }}
                      disabled={!activeLesson}
                    >
                      {activeLesson ? "Tiếp tục học" : "Chưa có bài học"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span>Tiến độ bài học</span>
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">{progressPercent}%</div>
                  <p className="text-xs text-gray-500">
                    {unlockedLessons}/{totalLessons} bài đã mở, {lockedLessons} khóa
                  </p>
                  <Progress value={progressPercent} className="mt-3 h-1.5" />
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span>Cấp độ hiện tại</span>
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {totalLevels > 0 ? `Cấp ${unlockedLevel}` : "-"}
                  </div>
                  <p className="text-xs text-gray-500">
                    {totalLevels > 0 ? `${unlockedLevels}/${totalLevels} cấp đã mở` : "Chưa có cấp độ"}
                  </p>
                  <Progress value={currentLevelProgress} className="mt-3 h-1.5" />
                  <p className="mt-2 text-xs text-gray-500">Mục tiêu: đạt {passThreshold}% để mở cấp tiếp theo.</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span>Điểm kiểm tra</span>
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {courseAverageScore !== null ? `${courseAverageScore}%` : "Chưa có"}
                  </div>
                  <p className="text-xs text-gray-500">Trung bình các bài kiểm tra trong khóa học.</p>
                </div>
              </div>
            </div>
          )}

          {!isEnrolled ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-gray-600">
                {enrollmentStatus === "pending"
                  ? "Đơn đăng ký của bạn đang chờ duyệt."
                  : enrollmentStatus === "rejected"
                    ? "Đơn đăng ký đã bị từ chối. Bạn có thể đăng ký lại khi sẵn sàng."
                    : "Hãy đăng ký khóa học để mở khóa bài học và bài luyện tập."}
              </p>
              <div className="mt-4 flex justify-center">
                <Button
                  disabled={applyMutation.isPending || !canApply}
                  onClick={() => applyMutation.mutate(activeCourse.id)}
                >
                  {!isOpen
                    ? "Đã đóng đăng ký"
                    : enrollmentStatus === "pending"
                      ? "Chờ duyệt"
                      : applyMutation.isPending
                        ? "Đang gửi..."
                        : enrollmentStatus === "rejected"
                          ? "Đăng ký lại"
                          : "Đăng ký học"}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  data-testid="filter-lesson-all"
                  onClick={() => setFilterSkill("")}
                  className={`px-5 py-2 rounded-full font-medium transition-all ${
                    filterSkill === ""
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                      : "bg-white/60 text-gray-700 hover:bg-white/80"
                  }`}
                >
                  Tất cả kỹ năng
                </button>
                {[
                  "Reading",
                  "Listening",
                  "Speaking",
                  "Writing",
                  "GrammarVocabulary",
                  "General",
                ].map((skill) => (
                  <button
                    key={skill}
                    data-testid={`filter-lesson-${skill.toLowerCase()}`}
                    onClick={() => setFilterSkill(skill)}
                    className={`px-5 py-2 rounded-full font-medium transition-all ${
                      filterSkill === skill
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                        : "bg-white/60 text-gray-700 hover:bg-white/80"
                    }`}
                  >
                    {skillLabels[skill] ?? skill}
                  </button>
                ))}
              </div>

              {sortedLessons.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 text-lg">Chưa có bài học nào.</p>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" data-testid="lessons-grid">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Lộ trình khóa học</p>
                          <p className="text-lg font-semibold text-gray-900">Bài học</p>
                        </div>
                        <span className="text-xs text-gray-500">{sortedLessons.length} bài</span>
                      </div>
                      <div className="mt-4 max-h-[520px] scroll-ghost overflow-y-auto space-y-4 pr-1">
                        {levelsSorted.map((level) => {
                          const lessons = lessonsByLevel.get(level) ?? [];
                          const completion = completionByLevel.get(level);
                          const isLevelLocked = level > unlockedLevel;
                          return (
                            <div key={`level-${level}`} className="space-y-2">
                              <div className="flex items-center justify-between px-2 text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold uppercase tracking-wide text-gray-400">
                                    Cấp độ {level}
                                  </span>
                                  {isLevelLocked && (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                      Chưa mở
                                    </span>
                                  )}
                                </div>
                                {completion?.totalTests ? (
                                  <span>
                                    {completion.passedTests}/{completion.totalTests} bài kiểm tra đạt ({completion.percent}%)
                                  </span>
                                ) : (
                                  <span>Chưa có bài kiểm tra</span>
                                )}
                              </div>
                              <div className="mt-2 px-2">
                                <Progress value={completion?.percent ?? 0} className="h-1.5" />
                              </div>
                              {lessons.map((lesson) => {
                                const isActive = activeLesson?.id === lesson.id;
                                const isLocked = (lesson.level ?? 1) > unlockedLevel;
                                const order = lessonOrderMap.get(lesson.id) ?? 0;
                                const testScore = lesson.testSetId
                                  ? bestScoresBySet.get(String(lesson.testSetId)) ?? null
                                  : null;
                                const isPassed = testScore !== null && testScore >= passThreshold;
                                return (
                                  <button
                                    key={lesson.id}
                                    data-testid={`lesson-card-${lesson.id}`}
                                    onClick={() => {
                                      if (!isLocked) setSelectedLesson(lesson);
                                    }}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                      isLocked
                                        ? "border-dashed border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                        : isActive
                                        ? "border-primary/30 bg-primary/10 shadow-md"
                                        : "border-white/70 bg-white/70 hover:bg-white"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${
                                          isActive && !isLocked
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {String(order || 0).padStart(2, "0")}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                          <p
                                            className={`text-sm font-semibold ${
                                              isActive && !isLocked ? "text-primary" : "text-gray-900"
                                            }`}
                                          >
                                            {lesson.title}
                                          </p>
                                          {lesson.testSetId && (
                                            <span
                                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                isPassed
                                                  ? "bg-emerald-100 text-emerald-700"
                                                  : testScore !== null
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-indigo-100 text-indigo-600"
                                              }`}
                                            >
                                              {testScore === null
                                                ? "Chưa làm"
                                                : isPassed
                                                  ? `Đạt ${testScore}%`
                                                  : `${testScore}%`}
                                            </span>
                                          )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                          {lesson.description || lesson.content}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                                          <span className="rounded-full bg-white/80 px-2 py-0.5">
                                            {skillLabels[lesson.skill] ?? lesson.skill}
                                          </span>
                                          <span className="rounded-full bg-white/80 px-2 py-0.5">
                                            {lesson.durationMinutes ? `${lesson.durationMinutes} phút` : "Tự học"}
                                          </span>
                                        </div>
                                      </div>
                                      {isLocked ? (
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                          Đã khóa
                                        </span>
                                      ) : isActive ? (
                                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                          Đang học
                                        </span>
                                      ) : null}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {activeLesson && (
                      <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Đang học</p>
                            <h2 className="text-2xl font-semibold text-gray-900">{activeLesson.title}</h2>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Tóm tắt</p>
                            <p className="mt-1 text-sm text-gray-600">
                              {activeLesson.description || "Chưa có tóm tắt."}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              activeLesson.skill === "Reading"
                                ? "bg-blue-100 text-blue-700"
                                : activeLesson.skill === "Listening"
                                  ? "bg-cyan-100 text-cyan-700"
                                  : activeLesson.skill === "Speaking"
                                    ? "bg-green-100 text-green-700"
                                    : activeLesson.skill === "Writing"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-gray-100 text-gray-700"
                            }
                          >
                            {skillLabels[activeLesson.skill] ?? activeLesson.skill}
                          </Badge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="rounded-full bg-gray-100 px-2 py-1">Bài học {progressLabel}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-1">
                            Cấp độ {activeLesson.level ?? 1}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-1">
                            {activeLesson.durationMinutes ? `${activeLesson.durationMinutes} phút` : "Tự học"}
                          </span>
                          {activeLesson.testSetId && (
                            <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">
                              Có bài kiểm tra
                            </span>
                          )}
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Tiến độ bài học</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="mt-2 h-2" />
                        </div>

                        {activeLessonVideo ? (
                          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                            <div className="relative w-full pt-[56.25%]">
                              <iframe
                                src={activeLessonVideo}
                                title={`${activeLesson.title} video`}
                                className="absolute inset-0 h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        ) : activeLesson.coverImageUrl ? (
                          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                            <img
                              src={activeLesson.coverImageUrl}
                              alt={activeLesson.title}
                              className="h-56 w-full object-cover"
                            />
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                          <div className="space-y-4">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nội dung</p>
                              {activeContentParagraphs.length > 0 ? (
                                <div className="mt-3 space-y-3 text-sm text-gray-700">
                                  {activeContentParagraphs.map((paragraph, index) => (
                                    <p key={`content-${index}`}>{paragraph}</p>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-gray-400">Chưa có nội dung bài học.</p>
                              )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mục tiêu</p>
                                {activeOutcomes.length > 0 ? (
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                    {activeOutcomes.map((item, index) => (
                                      <li key={`outcome-${index}`}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2 text-sm text-gray-400">Chưa có mục tiêu.</p>
                                )}
                              </div>
                              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Điểm cần nhớ</p>
                                {activeKeyPoints.length > 0 ? (
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                    {activeKeyPoints.map((item, index) => (
                                      <li key={`keypoint-${index}`}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2 text-sm text-gray-400">Chưa có điểm cần nhớ.</p>
                                )}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Luyện tập</p>
                              {activePractice.length > 0 ? (
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                  {activePractice.map((item, index) => (
                                    <li key={`practice-${index}`}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 text-sm text-gray-400">Chưa có bài luyện tập.</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lộ trình học gợi ý</p>
                              <div className="mt-3 space-y-2 text-sm">
                                {learningChecklist.map((item) => (
                                  <div key={item.label} className="flex items-center justify-between">
                                    <span className="text-gray-600">{item.label}</span>
                                    <span
                                      className={`text-xs font-semibold ${
                                        item.value === "Chưa có" ? "text-gray-400" : "text-emerald-600"
                                      }`}
                                    >
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bài kiểm tra</p>
                              {activeLesson?.testSetId ? (
                                <div className="mt-3 space-y-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {activeTestSetLabel ?? "Bài luyện tập"}
                                    </p>
                                    <span
                                      className={`text-xs font-semibold ${
                                        activeLessonScore === null
                                          ? "text-gray-400"
                                          : activeLessonPassed
                                            ? "text-emerald-600"
                                            : "text-amber-600"
                                      }`}
                                    >
                                      {activeLessonScore !== null ? `${activeLessonScore}%` : "Chưa làm"}
                                    </span>
                                  </div>
                                  <Progress value={activeLessonScore ?? 0} className="h-1.5" />
                                  <p className="text-xs text-gray-500">
                                    Mục tiêu: đạt {passThreshold}% để mở cấp độ tiếp theo.
                                  </p>
                                  <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => startLessonTest(activeLesson.testSetId)}
                                  >
                                    Bắt đầu kiểm tra
                                  </Button>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-gray-500">
                                  Chưa có bài kiểm tra cho bài học này.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                          <Button variant="outline" onClick={goPrev} disabled={!canGoPrev}>
                            Bài trước
                          </Button>
                          <Button variant="outline" onClick={goNext} disabled={!canGoNext}>
                            Bài tiếp
                          </Button>
                          {activeTestSetLabel && (
                            <span className="text-xs text-gray-500">Bài luyện tập: {activeTestSetLabel}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Tips Page Component

function TipsPage({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch: () => void;
}) {
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
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-3 tracking-tight">Mẹo & Hướng dẫn</h1>
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
          <p className="text-gray-500 text-lg">
            {hasSearch ? "Không tìm thấy mẹo học phù hợp." : "Chưa có mẹo học nào."}
          </p>
          {hasSearch && (
            <Button variant="outline" className="mt-4" onClick={onClearSearch}>
              Xóa tìm kiếm
            </Button>
          )}
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
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent mb-3 tracking-tight">Tiến độ học tập</h1>
        <p className="text-gray-600 text-lg">Theo dõi quá trình học tập của bạn</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Stats Cards */}
        <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
          <div className="text-gray-700 font-medium">Ngày liên tiếp</div>
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

