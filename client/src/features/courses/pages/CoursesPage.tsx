import { useMemo, useState, type DragEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ToastAction } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Course, Lesson } from "@shared/schema";
import { GripVertical } from "lucide-react";

type AdminCourse = Course & { pendingCount?: number; approvedCount?: number; lessonCount?: number };
type CourseApplication = {
  id: string;
  courseId: string;
  userId: string;
  username: string;
  status: string;
  role: string;
  joinedAt: string | Date;
};

export default function CoursesPage() {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [curriculumCourseId, setCurriculumCourseId] = useState<string | null>(null);
  const [reindexingLevel, setReindexingLevel] = useState<number | null>(null);
  const [draggingLessonId, setDraggingLessonId] = useState<string | null>(null);
  const [draggingLevel, setDraggingLevel] = useState<number | null>(null);
  const [hoveredLessonId, setHoveredLessonId] = useState<string | null>(null);
  const testRequiredForReady = false;
  const [formState, setFormState] = useState({
    name: "",
    code: "",
    description: "",
    status: "open",
    passThreshold: 80,
  });

  const { data: courses, isLoading } = useQuery<AdminCourse[]>({
    queryKey: ["/api/admin/courses"],
  });

  const curriculumCourse =
    (courses ?? []).find((course) => course.id === curriculumCourseId) ?? null;

  const { data: courseLessons = [], isLoading: loadingLessons } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons", { courseId: curriculumCourseId ?? "none" }],
    queryFn: async () => {
      if (!curriculumCourseId) return [];
      const res = await fetch(`/api/lessons?courseId=${curriculumCourseId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: Boolean(curriculumCourseId),
  });

  const sortedLessons = useMemo(() => {
    return [...courseLessons].sort((a, b) => {
      const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.updatedAt ?? a.createdAt).getTime() - new Date(b.updatedAt ?? b.createdAt).getTime();
    });
  }, [courseLessons]);

  const lessonsByLevel = useMemo(() => {
    const map = new Map<number, Lesson[]>();
    sortedLessons.forEach((lesson) => {
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

  const orderConflictsByLevel = useMemo(() => {
    const map = new Map<number, Set<number>>();
    lessonsByLevel.forEach((lessons, level) => {
      const counts = new Map<number, number>();
      lessons.forEach((lesson) => {
        if (lesson.orderIndex == null) return;
        const count = counts.get(lesson.orderIndex) ?? 0;
        counts.set(lesson.orderIndex, count + 1);
      });
      const conflicts = new Set<number>();
      counts.forEach((count, order) => {
        if (count > 1) conflicts.add(order);
      });
      if (conflicts.size > 0) map.set(level, conflicts);
    });
    return map;
  }, [lessonsByLevel]);

  const lessonStats = useMemo(() => {
    const stats = { total: courseLessons.length, ready: 0, missingSetup: 0 };
    courseLessons.forEach((lesson) => {
      const hasCourse = Boolean(lesson.courseId);
      const hasContent = Boolean(lesson.content && lesson.content.trim());
      const hasTest = Boolean(lesson.testSetId);
      const missingTest = testRequiredForReady && !hasTest;
      const isReady = hasCourse && hasContent && !missingTest;
      if (isReady) stats.ready += 1;
      else stats.missingSetup += 1;
    });
    return stats;
  }, [courseLessons, testRequiredForReady]);

  const { data: applications, isLoading: loadingApplications } = useQuery<CourseApplication[]>({
    queryKey: ["/api/admin/courses", selectedCourse?.id, "applications"],
    queryFn: async () => {
      if (!selectedCourse?.id) return [];
      const res = await fetch(`/api/admin/courses/${selectedCourse.id}/applications`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: Boolean(selectedCourse?.id),
  });

  const sortedCourses = useMemo(() => courses ?? [], [courses]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formState.name.trim(),
        code: formState.code.trim(),
        description: formState.description.trim() || null,
        status: formState.status,
        passThreshold: Number.isFinite(formState.passThreshold)
          ? Math.min(100, Math.max(0, formState.passThreshold))
          : 80,
      };
      return apiRequest("/api/admin/courses", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Course created", description: "Students can now apply to this course." });
      setFormState({ name: "", code: "", description: "", status: "open", passThreshold: 80 });
    },
    onError: (error: any) => {
      toast({
        title: "Unable to create course",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, status, passThreshold }: { id: string; status: string; passThreshold?: number }) => {
      return apiRequest(`/api/admin/courses/${id}`, "PATCH", { status, passThreshold });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lesson> }) => {
      await apiRequest(`/api/lessons/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
    },
  });

  const bulkUpdateLessons = useMutation({
    mutationFn: async (updates: Array<{ id: string; orderIndex: number | null }>) => {
      await Promise.all(
        updates.map((update) =>
          apiRequest(`/api/lessons/${update.id}`, "PATCH", { orderIndex: update.orderIndex }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
    },
  });

  const handleLessonUpdate = ({
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
    updateLessonMutation.mutate(
      { id: lesson.id, updates },
      {
        onSuccess: () => {
          toast({
            title,
            description: "Changes saved.",
            action: (
              <ToastAction
                altText="Undo"
                onClick={() => updateLessonMutation.mutate({ id: lesson.id, updates: undoPayload })}
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

  const handleReindexLevel = (level: number) => {
    const lessons = lessonsByLevel.get(level) ?? [];
    if (lessons.length === 0) return;
    const previousOrders = lessons.map((lesson) => ({
      id: lesson.id,
      orderIndex: lesson.orderIndex ?? null,
    }));
    const nextUpdates = [...lessons]
      .sort((a, b) => {
        const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.updatedAt ?? a.createdAt).getTime() - new Date(b.updatedAt ?? b.createdAt).getTime();
      })
      .map((lesson, index) => ({
        id: lesson.id,
        orderIndex: index + 1,
      }))
      .filter((update) => {
        const current = lessons.find((lesson) => lesson.id === update.id);
        return (current?.orderIndex ?? null) !== update.orderIndex;
      });

    if (nextUpdates.length === 0) return;

    setReindexingLevel(level);
    bulkUpdateLessons.mutate(nextUpdates, {
      onSuccess: () => {
        toast({
          title: "Order updated",
          description: "Lesson order has been reindexed.",
          action: (
            <ToastAction
              altText="Undo"
              onClick={() => bulkUpdateLessons.mutate(previousOrders)}
            >
              Undo
            </ToastAction>
          ),
        });
      },
      onError: (error: any) => {
        toast({
          title: "Unable to reindex order",
          description: error?.message ?? "Please try again.",
          variant: "destructive",
        });
      },
      onSettled: () => setReindexingLevel(null),
    });
  };

  const handleLessonDragStart = (
    event: DragEvent<HTMLDivElement>,
    lessonId: string,
    level: number,
  ) => {
    if (bulkUpdateLessons.isPending) return;
    event.dataTransfer.setData("text/plain", lessonId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingLessonId(lessonId);
    setDraggingLevel(level);
  };

  const handleLessonDragEnd = () => {
    setDraggingLessonId(null);
    setDraggingLevel(null);
    setHoveredLessonId(null);
  };

  const handleLessonDragOver = (
    event: DragEvent<HTMLDivElement>,
    lessonId: string,
    level: number,
  ) => {
    if (!draggingLessonId || draggingLevel !== level) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setHoveredLessonId(lessonId);
  };

  const handleLessonDrop = (
    event: DragEvent<HTMLDivElement>,
    targetLessonId: string,
    level: number,
  ) => {
    event.preventDefault();
    if (!draggingLessonId || draggingLevel !== level) {
      handleLessonDragEnd();
      return;
    }
    if (draggingLessonId === targetLessonId) {
      handleLessonDragEnd();
      return;
    }

    const lessons = lessonsByLevel.get(level) ?? [];
    const fromIndex = lessons.findIndex((lesson) => lesson.id === draggingLessonId);
    const toIndex = lessons.findIndex((lesson) => lesson.id === targetLessonId);
    if (fromIndex < 0 || toIndex < 0) {
      handleLessonDragEnd();
      return;
    }

    const reordered = [...lessons];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const previousOrders = lessons.map((lesson) => ({
      id: lesson.id,
      orderIndex: lesson.orderIndex ?? null,
    }));
    const orderMap = new Map(previousOrders.map((item) => [item.id, item.orderIndex]));
    const nextUpdates = reordered
      .map((lesson, index) => ({ id: lesson.id, orderIndex: index + 1 }))
      .filter((update) => (orderMap.get(update.id) ?? null) !== update.orderIndex);

    if (nextUpdates.length === 0) {
      handleLessonDragEnd();
      return;
    }

    setReindexingLevel(level);
    bulkUpdateLessons.mutate(nextUpdates, {
      onSuccess: () => {
        toast({
          title: "Order updated",
          description: "Lesson order has been updated.",
          action: (
            <ToastAction
              altText="Undo"
              onClick={() => bulkUpdateLessons.mutate(previousOrders)}
            >
              Undo
            </ToastAction>
          ),
        });
      },
      onError: (error: any) => {
        toast({
          title: "Unable to update order",
          description: error?.message ?? "Please try again.",
          variant: "destructive",
        });
      },
      onSettled: () => {
        setReindexingLevel(null);
      },
    });
    handleLessonDragEnd();
  };

  const updateMemberStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/admin/course-members/${id}`, "PATCH", { status });
    },
    onSuccess: () => {
      if (selectedCourse?.id) {
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/courses", selectedCourse.id, "applications"],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Application updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCourse = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim() || !formState.code.trim()) {
      toast({
        title: "Missing information",
        description: "Course name and code are required.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  const applicationStatusBadge = (status?: string | null) => {
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "rejected") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
        <p className="text-gray-600">Create courses and approve student applications.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Course name</label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="APTIS Foundation Course"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Course code</label>
              <Input
                value={formState.code}
                onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="APTIS-FOUND"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Textarea
                rows={2}
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Overview for students."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                value={formState.status}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pass threshold (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formState.passThreshold}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    passThreshold: event.target.value ? parseInt(event.target.value, 10) : 0,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create course"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Course list</h2>
            <p className="text-sm text-gray-500">Review enrollment and applications.</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Course</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Pass %</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                    Loading courses...
                  </TableCell>
                </TableRow>
              ) : sortedCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                    No courses created yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">{course.name}</p>
                        <p className="text-xs text-gray-500">{course.description || "No description."}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{course.code}</TableCell>
                    <TableCell>
                      <Select
                        value={course.status ?? "open"}
                        onValueChange={(value) =>
                          updateCourseMutation.mutate({ id: course.id, status: value, passThreshold: course.passThreshold ?? 80 })
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {course.lessonCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={course.passThreshold ?? 80}
                        onChange={(event) =>
                          updateCourseMutation.mutate({
                            id: course.id,
                            status: course.status ?? "open",
                            passThreshold: event.target.value ? parseInt(event.target.value, 10) : 0,
                          })
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        {course.pendingCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {course.approvedCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedCourse(course)}>
                          Review
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurriculumCourseId(course.id)}
                        >
                          Curriculum
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

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Curriculum builder</h2>
            <p className="text-sm text-gray-500">
              Organize lessons by level and check readiness before delivery.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={curriculumCourseId ?? "none"}
              onValueChange={(value) => setCurriculumCourseId(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a course</SelectItem>
                {sortedCourses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {curriculumCourse && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {lessonStats.total} lessons
              </Badge>
            )}
          </div>
        </div>

        {!curriculumCourse ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            Pick a course to start arranging lessons by level.
          </div>
        ) : loadingLessons ? (
          <div className="mt-6 text-sm text-gray-500">Loading lessons...</div>
        ) : courseLessons.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            No lessons assigned to this course yet.
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ready</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{lessonStats.ready}</p>
                <p className="text-xs text-gray-500">Course + content checklist complete.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Missing setup</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{lessonStats.missingSetup}</p>
                <p className="text-xs text-gray-500">Needs content or optional test.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Levels</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{levelsSorted.length}</p>
                <p className="text-xs text-gray-500">Organized learning path.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {levelsSorted.map((level) => {
                const levelLessons = lessonsByLevel.get(level) ?? [];
                const conflicts = orderConflictsByLevel.get(level);
                const needsReindex =
                  levelLessons.some((lesson) => lesson.orderIndex == null) ||
                  (conflicts && conflicts.size > 0);
                return (
                  <div key={`level-${level}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">Level {level}</p>
                        {conflicts && (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                            Order conflict
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">{levelLessons.length} lessons</span>
                        <span className="text-xs text-gray-400">Drag to reorder</span>
                        {needsReindex && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={bulkUpdateLessons.isPending && reindexingLevel === level}
                            onClick={() => handleReindexLevel(level)}
                          >
                            {bulkUpdateLessons.isPending && reindexingLevel === level
                              ? "Fixing..."
                              : "Fix order"}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {levelLessons.map((lesson) => {
                        const hasCourse = Boolean(lesson.courseId);
                        const hasContent = Boolean(lesson.content && lesson.content.trim());
                        const hasTest = Boolean(lesson.testSetId);
                        const missing: string[] = [];
                        if (!hasCourse) missing.push("Course");
                        if (!hasContent) missing.push("Content");
                        if (testRequiredForReady && !hasTest) missing.push("Test");
                        const isReady = missing.length === 0;
                        const isConflict =
                          conflicts && lesson.orderIndex != null && conflicts.has(lesson.orderIndex);
                        return (
                          <div
                            key={lesson.id}
                            onDragOver={(event) => handleLessonDragOver(event, lesson.id, level)}
                            onDragLeave={() => setHoveredLessonId(null)}
                            onDrop={(event) => handleLessonDrop(event, lesson.id, level)}
                            className={`rounded-lg border bg-gray-50 p-4 transition ${
                              hoveredLessonId === lesson.id && draggingLessonId !== lesson.id
                                ? "border-primary/40 bg-primary/5"
                                : "border-gray-200"
                            } ${
                              draggingLessonId === lesson.id ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <div
                                  draggable={!bulkUpdateLessons.isPending}
                                  onDragStart={(event) => handleLessonDragStart(event, lesson.id, level)}
                                  onDragEnd={handleLessonDragEnd}
                                  className={`mt-0.5 cursor-grab rounded-full border border-transparent p-1 text-gray-400 hover:text-gray-600 ${
                                    bulkUpdateLessons.isPending ? "cursor-not-allowed opacity-40" : ""
                                  }`}
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{lesson.title}</p>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                                  <span
                                    className={`rounded-full px-2 py-0.5 ${
                                      lesson.status === "published"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : lesson.status === "archived"
                                          ? "bg-slate-100 text-slate-600"
                                          : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {lesson.status === "published"
                                      ? "Published"
                                      : lesson.status === "archived"
                                        ? "Archived"
                                        : "Draft"}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 ${
                                      isReady
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {isReady ? "Ready" : "Missing setup"}
                                  </span>
                                  {missing.length > 0 && (
                                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                                      Missing: {missing.join(", ")}
                                    </span>
                                  )}
                                  {isConflict && (
                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                                      Order conflict
                                    </span>
                                  )}
                                </div>
                              </div>
                              </div>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                              <div>
                                <label className="text-xs font-medium text-gray-500">Level</label>
                                <Select
                                  value={String(lesson.level ?? 1)}
                                  onValueChange={(value) => {
                                    const nextLevel = parseInt(value, 10);
                                    if ((lesson.level ?? 1) === nextLevel) return;
                                    handleLessonUpdate({
                                      lesson,
                                      updates: { level: nextLevel },
                                      title: "Level updated",
                                    });
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5].map((lvl) => (
                                      <SelectItem key={lvl} value={String(lvl)}>
                                        Level {lvl}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Order</label>
                                <Input
                                  key={`order-${lesson.id}-${lesson.orderIndex ?? "none"}`}
                                  type="number"
                                  min={1}
                                  defaultValue={lesson.orderIndex ?? ""}
                                  className="mt-1"
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") event.currentTarget.blur();
                                  }}
                                  onBlur={(event) => {
                                    const raw = event.target.value.trim();
                                    const nextOrder = raw === "" ? null : parseInt(raw, 10);
                                    if (raw !== "" && (!Number.isFinite(nextOrder) || (nextOrder ?? 0) < 1)) {
                                      event.target.value = lesson.orderIndex ? String(lesson.orderIndex) : "";
                                      return;
                                    }
                                    if ((lesson.orderIndex ?? null) === nextOrder) return;
                                    handleLessonUpdate({
                                      lesson,
                                      updates: { orderIndex: nextOrder },
                                      title: "Order updated",
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500">Test</label>
                                <Select
                                  value={lesson.testSetId ? String(lesson.testSetId) : "none"}
                                  onValueChange={(value) => {
                                    const nextTestId = value === "none" ? null : value;
                                    if ((lesson.testSetId ?? null) === nextTestId) return;
                                    handleLessonUpdate({
                                      lesson,
                                      updates: { testSetId: nextTestId },
                                      title: "Test updated",
                                    });
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="No test" />
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
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={Boolean(selectedCourse)}
        onOpenChange={(open) => {
          if (!open) setSelectedCourse(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto scroll-ghost">
          <DialogHeader>
            <DialogTitle>Applications</DialogTitle>
            <DialogDescription>
              {selectedCourse ? `${selectedCourse.name} - ${selectedCourse.code}` : ""}
            </DialogDescription>
          </DialogHeader>
          {loadingApplications ? (
            <p className="text-sm text-gray-500">Loading applications...</p>
          ) : applications && applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{member.username}</p>
                    <p className="text-xs text-gray-500">
                      Applied {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={applicationStatusBadge(member.status)}>
                      {member.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={member.status === "approved"}
                      onClick={() =>
                        updateMemberStatusMutation.mutate({ id: member.id, status: "approved" })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600"
                      disabled={member.status === "rejected"}
                      onClick={() =>
                        updateMemberStatusMutation.mutate({ id: member.id, status: "rejected" })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No applications yet.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
