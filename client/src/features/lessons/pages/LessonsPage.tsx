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
import { useLessons } from "@/features/lessons/hooks/useLessons";
import { useTestSets } from "@/features/test-sets/hooks/useTestSets";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { BookOpen, Plus, Pencil, Eye, Trash2 } from "lucide-react";

export default function LessonsPage() {
  const [filterSkill, setFilterSkill] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [viewLesson, setViewLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const { toast } = useToast();
  const { testSets } = useTestSets();
  const viewLessonVideo = getYouTubeEmbedUrl(viewLesson?.youtubeUrl ?? null);

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
      if (searchQuery && !lesson.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [lessons, filterSkill, filterStatus, filterCourse, searchQuery]);

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
            <Input
              data-testid="input-search-lessons"
              placeholder="Search lessons..."
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
                <TableHead>Course</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-3" />
                    <p>No lessons found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLessons.map((lesson, index) => (
                  <TableRow key={lesson.id} data-testid={`lesson-row-${lesson.id}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{lesson.title}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {lesson.courseId ? courseMap.get(String(lesson.courseId)) ?? "Unknown" : "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={badgeClassForSkill(lesson.skill)}>
                        {lesson.skill}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {lesson.testSetId ? testSetMap.get(String(lesson.testSetId)) ?? "Unknown" : "None"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lesson.status === "published" ? "default" : "secondary"}>
                        {lesson.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {lesson.durationMinutes ? `${lesson.durationMinutes} min` : "Self-paced"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(lesson.updatedAt ?? lesson.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                ))
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
            {viewLesson?.testSetId && (
              <p className="text-sm text-gray-500">
                Test set: {testSetMap.get(String(viewLesson.testSetId)) ?? "Unknown"}
              </p>
            )}
            {viewLesson?.description && (
              <p className="text-sm text-gray-500">{viewLesson.description}</p>
            )}
            {viewLessonVideo && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <div className="relative w-full pt-[56.25%]">
                  <iframe
                    src={viewLessonVideo}
                    title={`${viewLesson?.title ?? "Lesson"} video`}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
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
