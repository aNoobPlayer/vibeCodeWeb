import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MediaUploadButton } from "@/components/MediaUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTestSets } from "@/features/test-sets/hooks/useTestSets";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { insertLessonSchema, type Course, type Lesson } from "@shared/schema";
import type { z } from "zod";

const formSchema = insertLessonSchema.extend({
  title: insertLessonSchema.shape.title.min(2, "Title must be at least 2 characters"),
  content: insertLessonSchema.shape.content.min(10, "Content must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

interface LessonFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson?: Lesson | null;
}

export function LessonFormModal({ open, onOpenChange, lesson }: LessonFormModalProps) {
  const { toast } = useToast();
  const isEdit = Boolean(lesson);
  const { testSets } = useTestSets();
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });
  const parseList = (value: string) =>
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  const joinList = (items?: string[] | null) => (items ?? []).join("\n");
  const testSetMap = useMemo(
    () => new Map(testSets.map((set) => [String(set.id), set.title])),
    [testSets],
  );
  const courseMap = useMemo(
    () => new Map(courses.map((course) => [String(course.id), course.name])),
    [courses],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: lesson?.title ?? "",
      description: lesson?.description ?? "",
      skill: lesson?.skill ?? "General",
      status: lesson?.status ?? "draft",
      outcomes: lesson?.outcomes ?? [],
      keyPoints: lesson?.keyPoints ?? [],
      practicePrompts: lesson?.practicePrompts ?? [],
      testSetId: lesson?.testSetId ?? "",
      courseId: lesson?.courseId ?? "",
      level: lesson?.level ?? 1,
      content: lesson?.content ?? "",
      durationMinutes: lesson?.durationMinutes ?? null,
      orderIndex: lesson?.orderIndex ?? null,
      coverImageUrl: lesson?.coverImageUrl ?? "",
      youtubeUrl: lesson?.youtubeUrl ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: lesson?.title ?? "",
        description: lesson?.description ?? "",
        skill: lesson?.skill ?? "General",
        status: lesson?.status ?? "draft",
        outcomes: lesson?.outcomes ?? [],
        keyPoints: lesson?.keyPoints ?? [],
        practicePrompts: lesson?.practicePrompts ?? [],
        testSetId: lesson?.testSetId ?? "",
        courseId: lesson?.courseId ?? "",
        level: lesson?.level ?? 1,
        content: lesson?.content ?? "",
        durationMinutes: lesson?.durationMinutes ?? null,
        orderIndex: lesson?.orderIndex ?? null,
        coverImageUrl: lesson?.coverImageUrl ?? "",
        youtubeUrl: lesson?.youtubeUrl ?? "",
      });
    }
  }, [lesson, open, form]);

  const mutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const url = isEdit ? `/api/lessons/${lesson?.id}` : "/api/lessons";
      const method = isEdit ? "PATCH" : "POST";
      const res = await apiRequest(url, method, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: isEdit ? "Lesson updated" : "Lesson created",
        description: isEdit ? "The lesson has been updated." : "New lesson created successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Unable to save lesson",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const payload: FormData = {
      ...data,
      description: data.description?.trim() ? data.description.trim() : null,
      coverImageUrl: data.coverImageUrl?.trim() ? data.coverImageUrl.trim() : null,
      youtubeUrl: data.youtubeUrl?.trim() ? data.youtubeUrl.trim() : null,
      testSetId: data.testSetId ? data.testSetId : null,
      courseId: data.courseId ? data.courseId : null,
    };
    mutation.mutate(payload);
  };

  const previewTitle = form.watch("title");
  const previewDescription = form.watch("description");
  const previewSkill = form.watch("skill");
  const previewStatus = form.watch("status");
  const previewOutcomes = form.watch("outcomes") ?? [];
  const previewKeyPoints = form.watch("keyPoints") ?? [];
  const previewPracticePrompts = form.watch("practicePrompts") ?? [];
  const previewDuration = form.watch("durationMinutes");
  const previewCoverImage = form.watch("coverImageUrl");
  const previewVideoUrl = form.watch("youtubeUrl");
  const previewContent = form.watch("content");
  const previewTestSetId = form.watch("testSetId");
  const previewCourseId = form.watch("courseId");
  const previewLevel = form.watch("level");
  const previewTestSetLabel = previewTestSetId
    ? testSetMap.get(String(previewTestSetId)) ?? null
    : null;
  const previewCourseLabel = previewCourseId
    ? courseMap.get(String(previewCourseId)) ?? null
    : null;
  const previewVideoEmbed = getYouTubeEmbedUrl(previewVideoUrl ?? null);
  const previewVideoFile =
    previewVideoUrl && previewVideoUrl.trim() && !previewVideoEmbed ? previewVideoUrl.trim() : null;
  const testRequiredForReady = false;
  const previewHasCourse = Boolean(previewCourseId);
  const previewHasContent = Boolean(previewContent && previewContent.trim());
  const previewHasTest = Boolean(previewTestSetId);
  const previewMissing: string[] = [];
  if (!previewHasCourse) previewMissing.push("Course");
  if (!previewHasContent) previewMissing.push("Content");
  if (testRequiredForReady && !previewHasTest) previewMissing.push("Test");
  const previewIsReady = previewMissing.length === 0;
  const previewReadinessLabel = previewIsReady ? "Ready" : "Missing setup";
  const previewReadinessClass = previewIsReady
    ? "bg-emerald-100 text-emerald-700"
    : "bg-amber-100 text-amber-700";
  const previewLifecycleLabel =
    previewStatus === "published"
      ? "Live"
      : previewStatus === "archived"
        ? "Archived"
        : "Preview mode";
  const previewLifecycleClass =
    previewStatus === "published"
      ? "bg-emerald-50 text-emerald-700"
      : previewStatus === "archived"
        ? "bg-slate-100 text-slate-600"
        : "bg-indigo-50 text-indigo-700";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-6xl w-[96vw] max-h-[90vh] overflow-y-auto scroll-ghost">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lesson" : "Create lesson"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the lesson details below." : "Build a new lesson for learners."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Delivery readiness</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${previewReadinessClass}`}>
                      {previewReadinessLabel}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${previewLifecycleClass}`}>
                      {previewLifecycleLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {previewIsReady
                      ? "Lesson setup is complete."
                      : `Missing: ${previewMissing.join(", ")}`}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                <span
                  className={`rounded-full px-2 py-1 ${
                    previewHasCourse
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  Course: {previewHasCourse ? "Assigned" : "Missing"}
                </span>
                <span
                  className={`rounded-full px-2 py-1 ${
                    previewHasContent
                      ? "bg-blue-50 text-blue-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  Content: {previewHasContent ? "Has content" : "Missing"}
                </span>
                <span
                  className={`rounded-full px-2 py-1 ${
                    previewHasTest
                      ? "bg-indigo-50 text-indigo-700"
                      : testRequiredForReady
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  Test: {previewHasTest ? "Attached" : testRequiredForReady ? "Missing" : "Optional"}
                </span>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lesson basics</CardTitle>
                    <CardDescription>High level details shown in listings and previews.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Reading strategies" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Short summary for the lesson."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>Shown on the lesson card and intro.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skill"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Skill</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select skill" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Reading">Reading</SelectItem>
                          <SelectItem value="Listening">Listening</SelectItem>
                          <SelectItem value="Speaking">Speaking</SelectItem>
                          <SelectItem value="Writing">Writing</SelectItem>
                          <SelectItem value="GrammarVocabulary">Grammar &amp; Vocabulary</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Learning design</CardTitle>
                    <CardDescription>Define what students should gain from this lesson.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="outcomes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Learning objectives</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="One objective per line."
                              value={joinList(field.value)}
                              onChange={(event) => field.onChange(parseList(event.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Use action verbs to describe outcomes.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                <FormField
                  control={form.control}
                  name="keyPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key takeaways</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="One takeaway per line."
                          value={joinList(field.value)}
                          onChange={(event) => field.onChange(parseList(event.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Short reminders students should remember.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="practicePrompts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practice prompts</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="One practice task per line."
                          value={joinList(field.value)}
                          onChange={(event) => field.onChange(parseList(event.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Give students clear actions to try after the lesson.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Delivery and publishing</CardTitle>
                    <CardDescription>Assign the lesson and control student access.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Course</FormLabel>
                          <Select
                            value={field.value ? String(field.value) : "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Assign to a course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={String(course.id)}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Required for delivery readiness.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Controls when students can see the lesson.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select
                            value={String(field.value ?? 1)}
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((lvl) => (
                                <SelectItem key={lvl} value={String(lvl)}>
                                  Level {lvl}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Controls progression requirements.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="orderIndex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              value={field.value ?? ""}
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value ? parseInt(event.target.value, 10) : null,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>Controls the sequence in the lesson list.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="20"
                              value={field.value ?? ""}
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value ? parseInt(event.target.value, 10) : null,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testSetId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Attached test set</FormLabel>
                          <Select
                            value={field.value ? String(field.value) : "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Optional test after lesson" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No test</SelectItem>
                              {testSets.map((set) => (
                                <SelectItem key={set.id} value={String(set.id)}>
                                  {set.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {testRequiredForReady
                              ? "Required for delivery readiness."
                              : "Optional assessment after the lesson."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Media</CardTitle>
                    <CardDescription>Add supporting visuals for students.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="coverImageUrl"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Cover image</FormLabel>
                          <FormControl>
                            <Input type="hidden" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <div className="flex flex-wrap items-center gap-2">
                            <MediaUploadButton
                              accept="image/*"
                              buttonText="Upload cover image"
                              dialogTitle="Upload cover image"
                              dialogDescription="Choose a cover image for the lesson."
                              onUploaded={(payload) => {
                                if (payload?.url) {
                                  field.onChange(payload.url);
                                }
                              }}
                            />
                            {field.value ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => field.onChange("")}
                              >
                                Clear
                              </Button>
                            ) : null}
                          </div>
                          <FormDescription>Used as the hero image on the lesson card.</FormDescription>
                          {field.value ? (
                            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                              <img
                                src={field.value}
                                alt="Cover preview"
                                className="h-40 w-full object-cover"
                              />
                            </div>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="youtubeUrl"
                      render={({ field }) => {
                        const embedUrl = getYouTubeEmbedUrl(field.value ?? null);
                        const videoUrl =
                          field.value && !embedUrl && field.value.trim() ? field.value.trim() : null;
                        return (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Lesson video</FormLabel>
                            <FormControl>
                              <Input type="hidden" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <div className="flex flex-wrap items-center gap-2">
                              <MediaUploadButton
                                accept="video/*"
                                buttonText="Upload lesson video"
                                dialogTitle="Upload lesson video"
                                dialogDescription="Choose a video file to embed in the lesson."
                                onUploaded={(payload) => {
                                  if (payload?.url) {
                                    field.onChange(payload.url);
                                  }
                                }}
                              />
                              {field.value ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => field.onChange("")}
                                >
                                  Clear
                                </Button>
                              ) : null}
                            </div>
                            <FormDescription>Optional video to enrich the lesson.</FormDescription>
                            {embedUrl ? (
                              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                <div className="relative w-full pt-[56.25%]">
                                  <iframe
                                    src={embedUrl}
                                    title="Lesson video preview"
                                    className="absolute inset-0 h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            ) : videoUrl ? (
                              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                <video className="w-full" controls src={videoUrl}>
                                  Your browser does not support the video element.
                                </video>
                              </div>
                            ) : null}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lesson content</CardTitle>
                    <CardDescription>Write the lesson body that students will study.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesson content</FormLabel>
                          <FormControl>
                            <Textarea rows={12} placeholder="Lesson content for students..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Use short sections, examples, and step by step guidance.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:sticky lg:top-6">
                <LessonLivePreview
                  title={previewTitle}
                  description={previewDescription}
                  skill={previewSkill}
                  status={previewStatus}
                  outcomes={previewOutcomes}
                  keyPoints={previewKeyPoints}
                  practicePrompts={previewPracticePrompts}
                  durationMinutes={previewDuration}
                  coverImageUrl={previewCoverImage}
                  youtubeEmbedUrl={previewVideoEmbed}
                  videoUrl={previewVideoFile}
                  content={previewContent}
                  testSetLabel={previewTestSetLabel}
                  courseLabel={previewCourseLabel}
                  level={previewLevel}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Create lesson"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type LessonPreviewProps = {
  title?: string | null;
  description?: string | null;
  skill?: string | null;
  status?: string | null;
  outcomes?: string[] | null;
  keyPoints?: string[] | null;
  practicePrompts?: string[] | null;
  durationMinutes?: number | null;
  coverImageUrl?: string | null;
  youtubeEmbedUrl?: string | null;
  videoUrl?: string | null;
  content?: string | null;
  testSetLabel?: string | null;
  courseLabel?: string | null;
  level?: number | null;
};

function LessonLivePreview({
  title,
  description,
  skill,
  status,
  outcomes,
  keyPoints,
  practicePrompts,
  durationMinutes,
  coverImageUrl,
  youtubeEmbedUrl,
  videoUrl,
  content,
  testSetLabel,
  courseLabel,
  level,
}: LessonPreviewProps) {
  const safeOutcomes = (outcomes ?? []).filter((item) => item && item.trim());
  const safeKeyPoints = (keyPoints ?? []).filter((item) => item && item.trim());
  const safePractice = (practicePrompts ?? []).filter((item) => item && item.trim());
  const contentBlocks = (content ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const statusLabel =
    status === "published" ? "Live" : status === "archived" ? "Archived" : "Preview mode";
  const statusClass =
    status === "published"
      ? "bg-emerald-100 text-emerald-700"
      : status === "archived"
        ? "bg-slate-100 text-slate-600"
        : "bg-indigo-100 text-indigo-700";

  return (
    <div className="rounded-2xl border border-emerald-100/60 bg-white p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Student preview</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {title?.trim() || "Untitled lesson"}
          </p>
          <p className="mt-1 text-xs text-gray-500">{description?.trim() || "No summary yet."}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="rounded-full bg-gray-100 px-2 py-1">{skill || "Skill"}</span>
        <span className="rounded-full bg-gray-100 px-2 py-1">Level {level ?? 1}</span>
        <span className="rounded-full bg-gray-100 px-2 py-1">
          {durationMinutes ? `${durationMinutes} min` : "Self-paced"}
        </span>
        {courseLabel && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
            Course: {courseLabel}
          </span>
        )}
        {testSetLabel && (
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
            Test: {testSetLabel}
          </span>
        )}
      </div>

      {youtubeEmbedUrl ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <div className="relative w-full pt-[56.25%]">
            <iframe
              src={youtubeEmbedUrl}
              title={`${title || "Lesson"} video preview`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : videoUrl ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <video className="w-full" controls src={videoUrl}>
            Your browser does not support the video element.
          </video>
        </div>
      ) : coverImageUrl?.trim() ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <img src={coverImageUrl} alt="Lesson cover" className="h-32 w-full object-cover" />
        </div>
      ) : null}

      {(safeOutcomes.length > 0 || safeKeyPoints.length > 0 || safePractice.length > 0) && (
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          {safeOutcomes.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Objectives</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {safeOutcomes.map((item, index) => (
                  <li key={`preview-outcome-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {safeKeyPoints.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Key points</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {safeKeyPoints.map((item, index) => (
                  <li key={`preview-key-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {safePractice.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Practice</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {safePractice.map((item, index) => (
                  <li key={`preview-practice-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">Lesson body</p>
        <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1 text-sm text-gray-700 scroll-ghost">
          {contentBlocks.length > 0 ? (
            contentBlocks.map((paragraph, index) => (
              <p key={`preview-paragraph-${index}`}>{paragraph}</p>
            ))
          ) : (
            <p className="text-gray-400">Start writing the lesson content to preview it here.</p>
          )}
        </div>
      </div>

      {testSetLabel && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Checkpoint</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{testSetLabel}</p>
          <p className="text-xs text-gray-500">
            {status === "published"
              ? "Available to students after the lesson."
              : "Will be available once the lesson is published."}
          </p>
        </div>
      )}
    </div>
  );
}
