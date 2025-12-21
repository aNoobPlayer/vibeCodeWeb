import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import type { Course } from "@shared/schema";

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
  const [formState, setFormState] = useState({
    name: "",
    code: "",
    description: "",
    status: "open",
  });

  const { data: courses, isLoading } = useQuery<AdminCourse[]>({
    queryKey: ["/api/admin/courses"],
  });

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
      };
      return apiRequest("/api/admin/courses", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Course created", description: "Students can now apply to this course." });
      setFormState({ name: "", code: "", description: "", status: "open" });
    },
    onError: (error: any) => {
      toast({
        title: "Unable to create course",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/admin/courses/${id}`, "PATCH", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
    },
  });

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
          <div className="grid gap-4 md:grid-cols-3">
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
                <TableHead>Pending</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                    Loading courses...
                  </TableCell>
                </TableRow>
              ) : sortedCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-400">
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
                          updateStatusMutation.mutate({ id: course.id, status: value })
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
                      <Button variant="outline" size="sm" onClick={() => setSelectedCourse(course)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
