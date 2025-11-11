import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertQuestionSchema, type Question } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { z } from "zod";
import { Sparkles } from "lucide-react";
import { useQuestionTemplates } from "@/stores/questionTemplatesStore";
import type { QuestionTemplate } from "@/types/questionTemplate";

const formSchema = insertQuestionSchema.extend({
  title: insertQuestionSchema.shape.title.min(1, "Title is required"),
  content: insertQuestionSchema.shape.content.min(1, "Question content is required"),
});

type FormData = z.infer<typeof formSchema>;

const QUICK_TAG_SUGGESTIONS = ["Email", "Travel", "Technology", "Campus life", "B1 level", "Audio prompt"];

interface QuestionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question;
}

export function QuestionFormModal({ open, onOpenChange, question }: QuestionFormModalProps) {
  const { toast } = useToast();
  const isEdit = !!question;

  const { data: mediaList } = useQuery<any[]>({
    queryKey: ["/api/media"],
    enabled: isEdit,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: question?.title || "",
      skill: question?.skill || "Reading",
      type: question?.type || "mcq_single",
      content: question?.content || "",
      points: question?.points || 1,
      options: question?.options || [],
      correctAnswers: question?.correctAnswers || [],
      explanation: question?.explanation || "",
      mediaUrl: question?.mediaUrl || "",
      tags: question?.tags || [],
    },
  });
  const questionType = form.watch("type");
  const options = form.watch("options") || [];
  const correctAnswers = form.watch("correctAnswers") || [];
  const titleValue = form.watch("title");
  const contentValue = form.watch("content");
  const skillValue = form.watch("skill");
  const tagsValue = form.watch("tags") || [];
  const pointsValue = form.watch("points");
  const mediaUrlValue = form.watch("mediaUrl");
  const [tagInputValue, setTagInputValue] = useState("");
  const contentCharCount = contentValue?.length ?? 0;
  const activeTags = Array.isArray(tagsValue)
    ? tagsValue.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : [];

  const sanitizeTag = (value: string) => value.replace(/\s+/g, " ").trim();
  const getCurrentTags = () => {
    const value = form.getValues("tags");
    return Array.isArray(value)
      ? value.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
      : [];
  };

  const addTagValue = (value: string) => {
    const cleaned = sanitizeTag(value);
    if (!cleaned) return;
    const existing = getCurrentTags();
    if (existing.includes(cleaned)) {
      toast({
        title: "Tag already added",
        description: "Each tag only needs to appear once.",
      });
      setTagInputValue("");
      return;
    }
    form.setValue("tags", [...existing, cleaned], { shouldDirty: true });
    setTagInputValue("");
  };

  const removeTagValue = (tag: string) => {
    const existing = getCurrentTags();
    form.setValue(
      "tags",
      existing.filter((t) => t !== tag),
      { shouldDirty: true },
    );
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "," || event.key === ";") {
      event.preventDefault();
      addTagValue(tagInputValue);
    }
  };

  const handleQuickTagClick = (tag: string) => addTagValue(tag);
  const clearTags = () => {
    if (getCurrentTags().length === 0) return;
    form.setValue("tags", [], { shouldDirty: true });
  };

  const { templates } = useQuestionTemplates();

  const needsMultipleChoice = questionType === "mcq_single" || questionType === "mcq_multi";
  const needsFillAnswers = questionType === "fill_blank";
  const answerReady = needsMultipleChoice
    ? options.filter(Boolean).length >= 2 && correctAnswers.some(Boolean)
    : needsFillAnswers
      ? correctAnswers.some(Boolean)
      : Boolean(contentValue);
  const readinessSteps = [
    {
      label: "Prompt",
      ready: Boolean(titleValue && contentValue),
      hint: "Add a title and describe the scenario",
    },
    {
      label: "Answers",
      ready: answerReady,
      hint: needsMultipleChoice
        ? "List options and mark the correct ones"
        : needsFillAnswers
          ? "Provide expected blank answers"
          : "Long-form prompts are ready once the task feels clear",
    },
    {
      label: "Meta",
      ready: Boolean(skillValue && pointsValue),
      hint: "Skill, type, and score keep the bank organized",
    },
  ];

  const previewState = {
    title: titleValue,
    content: contentValue,
    skill: skillValue,
    type: questionType,
    options,
    correctAnswers,
    tags: tagsValue,
    points: pointsValue,
    mediaUrl: mediaUrlValue,
  };

  const templateOptions = useMemo(
    () => templates.filter((template) => template.types.includes(questionType as Question["type"])),
    [questionType, templates],
  );

  const isChoiceQuestion = questionType === "mcq_single" || questionType === "mcq_multi";
  const isFillBlankQuestion = questionType === "fill_blank";

  // Reset form when question prop changes or dialog closes
  useEffect(() => {
    if (open) {
      form.reset({
        title: question?.title || "",
        skill: question?.skill || "Reading",
        type: question?.type || "mcq_single",
        content: question?.content || "",
        points: question?.points || 1,
        options: question?.options || [],
        correctAnswers: question?.correctAnswers || [],
        explanation: question?.explanation || "",
        mediaUrl: question?.mediaUrl || "",
        tags: question?.tags || [],
      });
    }
  }, [question, open, form]);

  useEffect(() => {
    if (isChoiceQuestion) {
      const current = form.getValues("options") || [];
      if (current.length >= 2) return;
      const padded = [...current];
      while (padded.length < 2) {
        padded.push("");
      }
      form.setValue("options", padded);
    }
  }, [form, isChoiceQuestion]);

  useEffect(() => {
    if (isFillBlankQuestion && correctAnswers.length === 0) {
      form.setValue("correctAnswers", [""], { shouldDirty: true });
    }
  }, [correctAnswers.length, form, isFillBlankQuestion]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) {
        return apiRequest(`/api/questions/${question.id}`, "PATCH", data);
      }
      return apiRequest("/api/questions", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: isEdit ? "Question updated" : "Question created",
        description: `The question has been ${isEdit ? "updated" : "created"} successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save question",
        variant: "destructive",
      });
    },
  });

  const applyTemplate = (template: QuestionTemplate) => {
    form.setValue("content", template.content, { shouldDirty: true });
    if (template.correctAnswers) {
      form.setValue("correctAnswers", template.correctAnswers, { shouldDirty: true });
    }
    if (template.options) {
      form.setValue("options", template.options, { shouldDirty: true });
    }
    toast({
      title: "Template applied",
      description: "Feel free to tweak the content to match your needs.",
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    const previous = updated[index];
    updated[index] = value;
    form.setValue("options", updated, { shouldDirty: true });
    if (previous && correctAnswers.includes(previous)) {
      const nextCorrect = correctAnswers.map((answer) => (answer === previous ? value : answer));
      form.setValue("correctAnswers", nextCorrect, { shouldDirty: true });
    }
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: "Need at least two options",
        description: "Multiple-choice questions require a minimum of two answer choices.",
        variant: "destructive",
      });
      return;
    }
    const updated = options.filter((_, idx) => idx !== index);
    const updatedCorrect = correctAnswers.filter((answer) => answer !== options[index]);
    form.setValue("options", updated, { shouldDirty: true });
    form.setValue("correctAnswers", updatedCorrect, { shouldDirty: true });
  };

  const addOption = () => {
    form.setValue("options", [...options, ""], { shouldDirty: true });
  };

  const markCorrect = (index: number) => {
    const rawValue = options[index] ?? "";
    if (!rawValue.trim()) {
      toast({
        title: "Add option text first",
        description: "Please enter the option text before marking it as correct.",
        variant: "destructive",
      });
      return;
    }
    if (questionType === "mcq_single") {
      form.setValue("correctAnswers", [rawValue], { shouldDirty: true });
    } else if (questionType === "mcq_multi") {
      const exists = correctAnswers.includes(rawValue);
      const updated = exists ? correctAnswers.filter((answer) => answer !== rawValue) : [...correctAnswers, rawValue];
      form.setValue("correctAnswers", updated, { shouldDirty: true });
    }
  };

  const addCorrectAnswer = () => {
    form.setValue("correctAnswers", [...correctAnswers, ""], { shouldDirty: true });
  };

  const handleCorrectAnswerChange = (index: number, value: string) => {
    const updated = [...correctAnswers];
    updated[index] = value;
    form.setValue("correctAnswers", updated, { shouldDirty: true });
  };

  const removeCorrectAnswer = (index: number) => {
    if (correctAnswers.length <= 1) {
      form.setValue("correctAnswers", [""], { shouldDirty: true });
      return;
    }
    form.setValue(
      "correctAnswers",
      correctAnswers.filter((_, idx) => idx !== index),
      { shouldDirty: true },
    );
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[90vh] overflow-hidden border-none bg-transparent p-0">
        <div className="grid h-[85vh] w-full overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[1.85fr_1fr]">
          <div className="flex min-h-0 flex-col">
            <div className="relative overflow-hidden px-8 py-6 text-white">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-indigo-600" />
              <div className="relative">
                <DialogHeader className="space-y-2 text-left text-white">
                  <DialogTitle className="text-2xl font-semibold tracking-tight">
                    {isEdit ? "Refine question" : "Craft a new question"}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-sm max-w-2xl">
                    {isEdit
                      ? "Polish the prompt, scoring, or media. Updates go live everywhere instantly."
                      : "Design a standout assessment item with guided steps, smart templates, and a live preview."}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                    {templateOptions.length} template{templateOptions.length === 1 ? "" : "s"} ready
                  </div>
                  <div className="rounded-full bg-white/15 px-3 py-1">
                    Type: <span className="ml-1 capitalize">{questionType}</span>
                  </div>
                  <div className="rounded-full bg-white/15 px-3 py-1">
                    Skill: <span className="ml-1">{skillValue}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex-1 min-h-0">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white via-white/80 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent" />
              <div className="h-full scroll-ghost overflow-y-auto pr-2">
                <div className="space-y-6 px-8 py-6 pb-40">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    <SectionCard
                      title="1. Prompt & context"
                      subtitle="Give the learner clarity about what they should read, listen to, or produce."
                      badge="Required"
                    >
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title *</FormLabel>
                                <FormControl>
                                  <Input data-testid="input-question-title" placeholder="e.g., Team meeting follow-up" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                            control={form.control}
                            name="skill"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Skill *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-question-skill">
                                      <SelectValue placeholder="Select skill" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Reading">Reading</SelectItem>
                                    <SelectItem value="Listening">Listening</SelectItem>
                                    <SelectItem value="Speaking">Speaking</SelectItem>
                                    <SelectItem value="Writing">Writing</SelectItem>
                                    <SelectItem value="GrammarVocabulary">Grammar & Vocabulary</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-question-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mcq_single">Multiple Choice (Single)</SelectItem>
                                  <SelectItem value="mcq_multi">Multiple Choice (Multi)</SelectItem>
                                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                                  <SelectItem value="writing_prompt">Writing Prompt</SelectItem>
                                  <SelectItem value="speaking_prompt">Speaking Prompt</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="md:col-span-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-600">
                          <p className="font-semibold text-gray-800">Tips for this type</p>
                          <p className="mt-1">
                            {questionType === "mcq_multi"
                              ? 'Use clear instructions like "Choose TWO answers" and provide at least 4 distractors.'
                              : questionType === "fill_blank"
                                ? "Show blanks with ___ inside the prompt and keep accepted answers short (1-3 words)."
                                : questionType === "writing_prompt"
                                  ? "List bullet points so learners know what to cover and include the word limit."
                                  : questionType === "speaking_prompt"
                                    ? "Give a scenario plus 2-3 guiding questions to inspire responses."
                                    : "State the question stem in student-friendly language and avoid ambiguity."}
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between gap-3">
                              <FormLabel>Prompt body *</FormLabel>
                              <span className="text-xs text-gray-400">{contentCharCount} characters</span>
                            </div>
                            <FormControl>
                              <Textarea
                                data-testid="input-question-content"
                                placeholder="Introduce the scenario, then list what the learner must do..."
                                className="min-h-[140px]"
                                {...field}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Use paragraphs or bullet points. Markdown-style lists are supported.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </SectionCard>

                    <SectionCard
                      title="2. Answer logic & guidance"
                      subtitle="Leverage templates, then lock in the correct answers or expected response."
                      badge="Guided"
                    >
                      {templateOptions.length > 0 && (
                        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">Need inspiration?</p>
                              <p className="text-sm text-gray-600">
                                Apply a template to auto-fill the prompt, answers, and explanation. You can still tweak everything.
                              </p>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Templates</span>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {templateOptions.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => applyTemplate(template)}
                                className="rounded-2xl border border-white bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                              >
                                <p className="text-sm font-semibold text-gray-900">{template.label}</p>
                                <p className="text-xs text-gray-500">{template.description}</p>
                                <p className="mt-2 text-xs font-medium text-primary">Use template</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {isChoiceQuestion && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">Answer options</p>
                              <p className="text-sm text-gray-500">
                                {questionType === "mcq_single"
                                  ? "Select exactly one correct option."
                                  : "Choose every option that should score points."}
                              </p>
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={addOption}>
                              Add option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {options.map((option, index) => {
                              const isCorrect = correctAnswers.includes(option);
                              return (
                                <div key={`${index}-${option}`} className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3 md:flex-row md:items-center">
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant={isCorrect ? "default" : "outline"}
                                      size="sm"
                                      className="whitespace-nowrap"
                                      onClick={() => markCorrect(index)}
                                    >
                                      {isCorrect ? "Correct" : "Mark correct"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive"
                                      onClick={() => removeOption(index)}
                                      aria-label="Remove option"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                  <Input
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isFillBlankQuestion && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                          <div>
                            <p className="font-semibold text-gray-900">Expected answers</p>
                            <p className="text-sm text-gray-600">
                              List the answers in the order the blanks appear. You can include synonyms to accept multiple responses.
                            </p>
                          </div>
                          <div className="space-y-2">
                            {correctAnswers.map((answer, index) => (
                              <div key={`${index}-${answer}`} className="flex items-center gap-2">
                                <Input
                                  value={answer}
                                  onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                                  placeholder={`Answer for blank ${index + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCorrectAnswer(index)}
                                  aria-label="Remove answer"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={addCorrectAnswer}>
                            Add another acceptable answer
                          </Button>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="explanation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Explanation</FormLabel>
                            <FormControl>
                              <Textarea
                                data-testid="input-question-explanation"
                                placeholder="Explain why this answer is correct or give a model response (optional)."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Students can review this feedback after submitting.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </SectionCard>

                    <SectionCard
                      title="3. Meta & publishing details"
                      subtitle="Control scoring, tagging, and media so future filtering stays effortless."
                      badge="Optional"
                    >
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="points"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points</FormLabel>
                              <FormControl>
                                <Input
                                  data-testid="input-question-points"
                                  type="number"
                                  placeholder="1"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="mediaUrl"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Media URL</FormLabel>
                              <FormControl>
                                <Input
                                  data-testid="input-question-media-url"
                                  placeholder="https://cdn.example.com/audio/airport.mp3"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Link an audio clip or reference image. Students will access it directly.</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {isEdit && mediaList && mediaList.length > 0 && (
                        <div className="rounded-2xl border border-dashed border-gray-300 p-4">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Attach existing media asset</p>
                          <select
                            data-testid="select-question-media"
                            className="w-full rounded-xl border px-3 py-2 text-sm"
                            defaultValue=""
                            onChange={async (e)=> {
                              const mediaId = e.currentTarget.value;
                              if (!mediaId) return;
                              try {
                                const res = await fetch(`/api/admin/questions/${question?.id}/media`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ mediaId }),
                                });
                                if (!res.ok) throw new Error(await res.text());
                                toast({ title: "Media attached", description: "Linked to question." });
                              } catch (e: any) {
                                toast({ title: "Error", description: e.message || "Failed to attach", variant: "destructive" });
                              }
                            }}
                          >
                            <option value="">Select media</option>
                            {mediaList.map((media) => (
                              <option key={media.id} value={media.id}>
                                {media.filename}
                              </option>
                            ))}
                          </select>
                          <p className="mt-2 text-xs text-gray-500">Selecting an asset will overwrite the media link above.</p>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="tags"
                        render={() => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                              <div className="flex flex-wrap gap-2">
                                {activeTags.length > 0 ? (
                                  activeTags.map((tag) => (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => removeTagValue(tag)}
                                      className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
                                    >
                                      #{tag}
                                      <span className="text-xs text-gray-400">x</span>
                                    </button>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-500">No tags yet</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Input
                                  value={tagInputValue}
                                  onChange={(e) => setTagInputValue(e.target.value)}
                                  onKeyDown={handleTagKeyDown}
                                  placeholder="Add a tag and press Enter"
                                  className="flex-1"
                                />
                                <Button type="button" variant="outline" onClick={() => addTagValue(tagInputValue)}>
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {QUICK_TAG_SUGGESTIONS.map((tag) => (
                                  <Button
                                    key={tag}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="border border-dashed border-gray-300 text-gray-600"
                                    onClick={() => handleQuickTagClick(tag)}
                                  >
                                    {tag}
                                  </Button>
                                ))}
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Tags help filter the bank and surface related tips.</span>
                                <button type="button" className="underline" onClick={clearTags}>
                                  Clear all
                                </button>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </SectionCard>

                    <div className="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 px-5 py-4 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {isEdit ? "Happy with the tweaks?" : "Ready to publish this question?"}
                        </p>
                        <p className="text-xs text-gray-500">Changes are saved once you press the button.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onOpenChange(false)}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-submit" disabled={mutation.isPending}>
                          {mutation.isPending ? "Saving..." : isEdit ? "Update Question" : "Create Question"}
                        </Button>
                      </div>
                    </div>
                  </form>
                  </Form>
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full min-h-0 flex-col gap-5 bg-slate-950 p-6 text-white">
            <div className="relative flex-1 min-h-0">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
              <div className="scroll-ghost h-full space-y-5 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-slate-900/40">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Builder status</p>
                  <div className="mt-4 space-y-3">
                    {readinessSteps.map((step, index) => (
                      <div key={step.label} className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            step.ready ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{step.label}</p>
                          <p className="text-xs text-slate-400">{step.ready ? "Looks great" : step.hint}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <QuestionLivePreview question={previewState} />

                <div className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-primary/10 p-4 text-sm text-slate-100 shadow-inner shadow-primary/20">
                  Need inspiration?{" "}
                  <span className="font-semibold">
                    {templateOptions.length} matching template{templateOptions.length === 1 ? "" : "s"}
                  </span>{" "}
                  can prefill this form. Pick one on the left or tweak manually to craft something truly unique.
                </div>

                <div className="text-xs text-slate-500">
                  Tip: pair this question with media or tags so the student test runner can surface context-rich hints.
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuestionLivePreview({ question }: { question: Partial<FormData> }) {
  const {
    title,
    content,
    skill,
    type,
    options = [],
    correctAnswers = [],
    tags = [],
    points,
  } = question;

  const visibleOptions = (options || []).filter((option): option is string => Boolean(option && option.trim()));
  const paragraphs = (content || "").split("\n").map((p) => p.trim()).filter(Boolean);
  const tagList = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const safeCorrectAnswers = Array.isArray(correctAnswers) ? correctAnswers.filter(Boolean) : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live preview</p>
          <p className="text-lg font-semibold text-white">{title || "Untitled question"}</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p className="rounded-full border border-white/10 px-3 py-1 text-white/80">{skill || "Select skill"}</p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-slate-500">{type || "Type"}</p>
        </div>
      </div>

      <div className="mt-4 max-h-40 space-y-2 scroll-ghost overflow-y-auto pr-1 text-sm text-slate-200">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, idx) => <p key={`${paragraph}-${idx}`}>{paragraph}</p>)
        ) : (
          <p className="text-slate-500">
            As you describe the prompt, students will see a polished version of it here.
          </p>
        )}
      </div>

      {visibleOptions.length > 0 && (
        <div className="mt-5 space-y-2">
          {visibleOptions.map((option, idx) => {
            const isCorrect = safeCorrectAnswers.includes(option);
            return (
              <div
                key={`${option}-${idx}`}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                  isCorrect ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 bg-white/5"
                }`}
              >
                <span className="text-xs font-semibold text-slate-300">{String.fromCharCode(65 + idx)}.</span>
                <p className="text-slate-100">{option}</p>
              </div>
            );
          })}
        </div>
      )}

      {safeCorrectAnswers.length > 0 && visibleOptions.length === 0 && (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
          Expected answer: {safeCorrectAnswers.join(", ")}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
        {tagList.length > 0 ? (
          tagList.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-white/80">
              #{tag}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-white/5 px-2 py-1">No tags yet</span>
        )}
        {typeof points === "number" && (
          <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-amber-200">
            {points} pts
          </span>
        )}
      </div>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
};

function SectionCard({ title, subtitle, badge, children }: SectionCardProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm shadow-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {badge && (
          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
