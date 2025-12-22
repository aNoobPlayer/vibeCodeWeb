import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Course, Lesson } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
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
import { LessonFormModal } from "@/components/LessonFormModal";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useLessons } from "@/features/lessons/hooks/useLessons";
import { useTestSets } from "@/features/test-sets/hooks/useTestSets";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import {
  BookOpen,
  Plus,
  Pencil,
  Eye,
  Trash2,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from "lucide-react";

const getLessonDelivery = (lesson: Lesson, testRequiredForReady: boolean) => {
  const isPublished = lesson.status === "published";
  const isArchived = lesson.status === "archived";
  const hasCourse = Boolean(lesson.courseId);
  const hasTest = Boolean(lesson.testSetId);
  const hasContent = Boolean(lesson.content && lesson.content.trim());
  const missingCourse = !hasCourse;
  const missingContent = !hasContent;
  const missingTest = testRequiredForReady && !hasTest;
  const isBlocked = false;
  const missingSetup = missingCourse || missingContent || missingTest;
  const isReady = !missingSetup && !isBlocked;
  return {
    isPublished,
    isArchived,
    hasCourse,
    hasTest,
    hasContent,
    missingCourse,
    missingContent,
    missingTest,
    missingSetup,
    isBlocked,
    isReady,
  };
};

export default function LessonsPage() {
  const [filterSkill, setFilterSkill] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [viewLesson, setViewLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const { toast } = useToast();
  const testRequiredForReady = false;
  const { testSets } = useTestSets();
  const viewLessonVideoEmbed = getYouTubeEmbedUrl(viewLesson?.youtubeUrl ?? null);
  const viewLessonVideoUrl =
    viewLesson?.youtubeUrl && !viewLessonVideoEmbed ? viewLesson.youtubeUrl : null;

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const { lessons } = useLessons({
    skill: filterSkill !== "all" ? filterSkill : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    courseId: filterCourse !== "all" ? filterCourse : undefined,
    search: searchQuery || undefined,
  });

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    return lessons.filter((lesson) => {
      if (filterSkill !== "all" && lesson.skill !== filterSkill) return false;
      if (filterStatus !== "all" && lesson.status !== filterStatus) return false;
      if (filterCourse !== "all" && String(lesson.courseId ?? "") !== filterCourse) return false;
      if (filterLevel !== "all" && String(lesson.level ?? 1) !== filterLevel) return false;
      if (searchQuery && !lesson.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [lessons, filterSkill, filterStatus, filterCourse, filterLevel, searchQuery]);

  const deliveryStats = useMemo(() => {
    const stats = {
      total: filteredLessons.length,
      ready: 0,
      missingSetup: 0,
      published: 0,
      draft: 0,
    };
    filteredLessons.forEach((lesson) => {
      const delivery = getLessonDelivery(lesson, testRequiredForReady);
      if (delivery.isReady) stats.ready += 1;
      if (delivery.missingSetup && !delivery.isBlocked) stats.missingSetup += 1;
      if (delivery.isPublished) stats.published += 1;
      if (!delivery.isPublished && !delivery.isArchived) stats.draft += 1;
    });
    return stats;
  }, [filteredLessons, testRequiredForReady]);

  const deliveryFilteredLessons = useMemo(() => {
    if (deliveryFilter === "all") return filteredLessons;
    return filteredLessons.filter((lesson) => {
      const delivery = getLessonDelivery(lesson, testRequiredForReady);
      if (deliveryFilter === "ready") return delivery.isReady;
      if (deliveryFilter === "missing") return delivery.missingSetup && !delivery.isBlocked;
      if (deliveryFilter === "published") return delivery.isPublished;
      if (deliveryFilter === "draft") return !delivery.isPublished && !delivery.isArchived;
      return true;
    });
  }, [filteredLessons, deliveryFilter, testRequiredForReady]);

  const testSetMap = useMemo(() => {
    const map = new Map<string, string>();
    testSets.forEach((set) => {
      map.set(String(set.id), set.title);
    });
    return map;
  }, [testSets]);

  const courseMap = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((course) => {
      map.set(String(course.id), course.name);
    });
    return map;
  }, [courses]);

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/lessons/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons() });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Lesson deleted", description: "The lesson has been removed." });
      setLessonToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Unable to delete lesson",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (lessonToDelete?.id) {
      deleteLesson.mutate(lessonToDelete.id);
    }
  };

  const publishLesson = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiRequest(`/api/lessons/${id}`, "PATCH", { status: "published" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons() });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Lesson published", description: "The lesson is now visible to students." });
    },
    onError: (error: any) => {
      toast({
        title: "Unable to publish lesson",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateLesson = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lesson> }) => {
      await apiRequest(`/api/lessons/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons() });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const handleQuickUpdate = ({
    lesson,
    updates,
    title,
  }: {
    lesson: Lesson;
    updates: Partial<Lesson>;
    title: string;
  }) => {
    const undoPayload = Object.keys(updates).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = (lesson as Record<string, unknown>)[key] ?? null;
      return acc;
    }, {});
    updateLesson.mutate(
      { id: lesson.id, updates },
      {
        onSuccess: () => {
          toast({
            title,
            description: "Changes saved.",
            action: (
              <ToastAction
                altText="Undo"
                onClick={() => updateLesson.mutate({ id: lesson.id, updates: undoPayload })}
              >
                Undo
              </ToastAction>
            ),
          });
        },
        onError: (error: any) => {
          toast({
            title: "Update failed",
            description: error?.message ?? "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lessons library</h1>
        <p className="text-gray-600">Create structured learning content for students</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            data-testid="button-add-lesson"
            className="gap-2"
            onClick={() => {
              setEditingLesson(null);
              setIsLessonFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add new lesson
          </Button>
          <div className="flex gap-2 ml-auto">
            <Select value={filterSkill} onValueChange={setFilterSkill}>
              <SelectTrigger className="w-40" data-testid="filter-lesson-skill">
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36" data-testid="filter-lesson-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-52" data-testid="filter-lesson-course">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-32" data-testid="filter-lesson-level">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <SelectItem key={lvl} value={String(lvl)}>
                    Level {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              data-testid="input-search-lessons"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60"
            />
          </div>
        </div>

        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Total lessons</span>
              <BookOpen className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{deliveryStats.total}</p>
            <p className="text-xs text-gray-500">All lessons in the current filters.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Ready</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{deliveryStats.ready}</p>
            <p className="text-xs text-gray-500">Course + content checklist completed.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Missing setup</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{deliveryStats.missingSetup}</p>
            <p className="text-xs text-gray-500">Needs course or content to be ready.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Published</span>
              <FileText className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{deliveryStats.published}</p>
            <p className="text-xs text-gray-500">Visible to students right now.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "all", label: "All lessons", count: deliveryStats.total },
            { key: "ready", label: "Ready", count: deliveryStats.ready },
            { key: "missing", label: "Missing setup", count: deliveryStats.missingSetup },
            { key: "published", label: "Published", count: deliveryStats.published },
            { key: "draft", label: "Draft", count: deliveryStats.draft },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setDeliveryFilter(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                deliveryFilter === item.key
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Readiness</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryFilteredLessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-3" />
                    <p>
                      {filteredLessons.length === 0
                        ? "No lessons yet."
                        : deliveryFilter === "ready"
                          ? "No ready lessons."
                          : "No lessons match the current filters."}
                    </p>
                    {deliveryFilter !== "all" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setDeliveryFilter("all")}
                      >
                        Clear delivery filter
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                deliveryFilteredLessons.map((lesson, index) => {
                  const delivery = getLessonDelivery(lesson, testRequiredForReady);
                  const readinessLabel = delivery.isBlocked
                    ? "Blocked"
                    : delivery.isReady
                      ? "Ready"
                      : "Missing setup";
                  const readinessClass = delivery.isBlocked
                    ? "bg-rose-100 text-rose-700"
                    : delivery.isReady
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700";
                  const lifecycleLabel = delivery.isArchived
                    ? "Archived"
                    : delivery.isPublished
                      ? "Published"
                      : "Draft";
                  const lifecycleClass = delivery.isArchived
                    ? "bg-slate-100 text-slate-600"
                    : delivery.isPublished
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-700";
                  const testPillLabel = delivery.hasTest
                    ? "Attached"
                    : testRequiredForReady
                      ? "Missing"
                      : "Optional";
                  const testPillClass = delivery.hasTest
                    ? "bg-indigo-50 text-indigo-700"
                    : testRequiredForReady
                      ? "bg-rose-50 text-rose-700"
                      : "bg-amber-50 text-amber-700";
                  const publishBlocked =
                    delivery.missingSetup || delivery.isBlocked || delivery.isArchived || delivery.isPublished;
                  const missingParts: string[] = [];
                  if (delivery.missingCourse) missingParts.push("Course");
                  if (delivery.missingContent) missingParts.push("Content");
                  if (delivery.missingTest) missingParts.push("Test");
                  const publishTooltip =
                    missingParts.length > 0
                      ? `Missing ${missingParts.join(", ")}`
                      : delivery.isArchived
                        ? "Archived lessons cannot be published"
                        : delivery.isBlocked
                          ? "Blocked by prerequisites"
                          : delivery.isPublished
                            ? "Already published"
                            : "Publish lesson";
                  const isPublishing =
                    publishLesson.isPending && publishLesson.variables?.id === lesson.id;
                  return (
                  <TableRow key={lesson.id} data-testid={`lesson-row-${lesson.id}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">{lesson.title}</p>
                          <Badge variant="secondary" className={lifecycleClass}>
                            {lifecycleLabel}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              delivery.hasCourse
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            Course: {delivery.hasCourse ? "Assigned" : "Missing"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              delivery.hasContent
                                ? "bg-blue-50 text-blue-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            Content: {delivery.hasContent ? "Has content" : "Missing"}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 ${testPillClass}`}>
                            Test: {testPillLabel}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lesson.courseId ? String(lesson.courseId) : "none"}
                        onValueChange={(value) => {
                          const nextCourseId = value === "none" ? null : value;
                          if ((lesson.courseId ?? null) === nextCourseId) return;
                          handleQuickUpdate({
                            lesson,
                            updates: { courseId: nextCourseId },
                            title: "Course updated",
                          });
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={String(course.id)}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        key={`level-${lesson.id}-${lesson.level ?? 1}`}
                        type="number"
                        min={1}
                        defaultValue={lesson.level ?? 1}
                        className="w-20"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        onBlur={(event) => {
                          const raw = event.target.value.trim();
                          const nextLevel = raw ? parseInt(raw, 10) : 1;
                          if (!Number.isFinite(nextLevel) || nextLevel < 1) {
                            event.target.value = String(lesson.level ?? 1);
                            return;
                          }
                          if ((lesson.level ?? 1) === nextLevel) return;
                          handleQuickUpdate({
                            lesson,
                            updates: { level: nextLevel },
                            title: "Level updated",
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        key={`order-${lesson.id}-${lesson.orderIndex ?? "none"}`}
                        type="number"
                        min={1}
                        defaultValue={lesson.orderIndex ?? ""}
                        className="w-20"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        onBlur={(event) => {
                          const raw = event.target.value.trim();
                          const nextOrder = raw === "" ? null : parseInt(raw, 10);
                          if (raw !== "" && (!Number.isFinite(nextOrder) || (nextOrder ?? 0) < 1)) {
                            event.target.value = lesson.orderIndex ? String(lesson.orderIndex) : "";
                            return;
                          }
                          if ((lesson.orderIndex ?? null) === nextOrder) return;
                          handleQuickUpdate({
                            lesson,
                            updates: { orderIndex: nextOrder },
                            title: "Order updated",
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={badgeClassForSkill(lesson.skill)}>
                        {lesson.skill}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lesson.testSetId ? String(lesson.testSetId) : "none"}
                        onValueChange={(value) => {
                          const nextTestId = value === "none" ? null : value;
                          if ((lesson.testSetId ?? null) === nextTestId) return;
                          handleQuickUpdate({
                            lesson,
                            updates: { testSetId: nextTestId },
                            title: "Test updated",
                          });
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No test</SelectItem>
                          {testSets.map((set) => (
                            <SelectItem key={set.id} value={String(set.id)}>
                              {set.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {lesson.durationMinutes ? `${lesson.durationMinutes} min` : "Self-paced"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(lesson.updatedAt ?? lesson.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="secondary" className={readinessClass}>
                          {readinessLabel}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {lesson.status !== "published" && lesson.status !== "archived" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={publishBlocked || isPublishing}
                            title={publishTooltip}
                            onClick={() => publishLesson.mutate({ id: lesson.id })}
                          >
                            {isPublishing ? "Publishing..." : "Publish"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-lesson-${lesson.id}`}
                          onClick={() => {
                            setEditingLesson(lesson);
                            setIsLessonFormOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-view-lesson-${lesson.id}`}
                          onClick={() => setViewLesson(lesson)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-lesson-${lesson.id}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setLessonToDelete(lesson)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      <LessonFormModal
        open={isLessonFormOpen}
        lesson={editingLesson}
        onOpenChange={(open) => {
          setIsLessonFormOpen(open);
          if (!open) {
            setEditingLesson(null);
          }
        }}
      />

      <Dialog
        open={Boolean(viewLesson)}
        onOpenChange={(open) => {
          if (!open) setViewLesson(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto scroll-ghost">
          <DialogHeader>
            <DialogTitle>{viewLesson?.title}</DialogTitle>
            <DialogDescription>
              {viewLesson
                ? `${viewLesson.skill} - ${viewLesson.durationMinutes ? `${viewLesson.durationMinutes} min` : "Self-paced"}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewLesson?.courseId && (
              <p className="text-sm text-gray-500">
                Course: {courseMap.get(String(viewLesson.courseId)) ?? "Unknown"}
              </p>
            )}
            {viewLesson?.level && (
              <p className="text-sm text-gray-500">Level: {viewLesson.level}</p>
            )}
            {viewLesson?.testSetId && (
              <p className="text-sm text-gray-500">
                Test set: {testSetMap.get(String(viewLesson.testSetId)) ?? "Unknown"}
              </p>
            )}
            {viewLesson?.description && (
              <p className="text-sm text-gray-500">{viewLesson.description}</p>
            )}
            {viewLessonVideoEmbed ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <div className="relative w-full pt-[56.25%]">
                  <iframe
                    src={viewLessonVideoEmbed}
                    title={`${viewLesson?.title ?? "Lesson"} video`}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : viewLessonVideoUrl ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <video className="w-full" controls src={viewLessonVideoUrl}>
                  Your browser does not support the video element.
                </video>
              </div>
            ) : null}
            {viewLesson?.outcomes && viewLesson.outcomes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Objectives</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {viewLesson.outcomes.map((item, index) => (
                    <li key={`outcome-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {viewLesson?.keyPoints && viewLesson.keyPoints.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Key takeaways</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {viewLesson.keyPoints.map((item, index) => (
                    <li key={`keypoint-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {viewLesson?.practicePrompts && viewLesson.practicePrompts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Practice prompts</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {viewLesson.practicePrompts.map((item, index) => (
                    <li key={`practice-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{viewLesson?.content}</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(lessonToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteLesson.isPending) setLessonToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lesson</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected lesson will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLesson.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteLesson.isPending}
            >
              {deleteLesson.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
