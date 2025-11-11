import { useEffect, useMemo } from "react";
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

const formSchema = insertQuestionSchema.extend({
  title: insertQuestionSchema.shape.title.min(1, "Title is required"),
  content: insertQuestionSchema.shape.content.min(1, "Question content is required"),
});

type FormData = z.infer<typeof formSchema>;

type QuestionTemplate = {
  id: string;
  label: string;
  description: string;
  types: Question["type"][];
  content: string;
  correctAnswers?: string[];
  options?: string[];
};

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: "fill-single-gap",
    label: "Single sentence gap-fill",
    description: "Learners supply one word to complete the sentence.",
    types: ["fill_blank"],
    content:
      `Complete the sentence with ONE word.\n\n` +
      `"Studying online has completely ___ the way students access information."`,
    correctAnswers: ["changed"],
  },
  {
    id: "fill-paragraph",
    label: "Short paragraph with two blanks",
    description: "Two blanks focusing on vocabulary and grammar.",
    types: ["fill_blank"],
    content:
      `Fill in the TWO blanks with the correct words.\n\n` +
      `"During the interview, Minh stayed ___ even when the questions became ___."`,
    correctAnswers: ["calm", "difficult"],
  },
  {
    id: "writing-email",
    label: "Writing - informal email",
    description: "Prompt for a friendly email (120-150 words).",
    types: ["writing_prompt"],
    content:
      `You recently spent a weekend at your friend's house in Da Nang.\n` +
      `Write an email to thank them. Include:\n` +
      `- what you enjoyed most\n` +
      `- something funny that happened\n` +
      `- an invitation for them to visit you soon\n\n` +
      `Write 120-150 words.`,
  },
  {
    id: "writing-opinion",
    label: "Writing - opinion essay",
    description: "Structured opinion piece with reasons and examples.",
    types: ["writing_prompt"],
    content:
      `Many people believe that teenagers should have a part-time job while studying.\n` +
      `Do you agree or disagree?\n\n` +
      `Write an essay explaining your opinion. Include:\n` +
      `- at least two reasons for your view\n` +
      `- examples or experiences to support each reason\n` +
      `- a short conclusion with a recommendation\n\n` +
      `Write 180-220 words.`,
  },
];

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

  const templateOptions = useMemo(
    () => QUESTION_TEMPLATES.filter((template) => template.types.includes(questionType as Question["type"])),
    [questionType],
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Question" : "Create New Question"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the question details below" : "Fill in the details to create a new question"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input data-testid="input-question-title" placeholder="e.g., Question 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <FormItem>
                    <FormLabel>Attach Media</FormLabel>
                    <FormControl>
                      <select
                        data-testid="select-question-media"
                        className="w-full h-10 border rounded px-3"
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
                        <option value="">-- Select media to attach --</option>
                        {mediaList?.map((m) => (
                          <option key={m.id} value={m.id}>{m.filename || m.name || m.url}</option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
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
            </div>

            {templateOptions.length > 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Need a quick template?</p>
                    <p className="text-sm text-gray-500">Start from a proven pattern and customize the wording.</p>
                  </div>
                  <span className="text-xs font-medium text-primary uppercase">Templates</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {templateOptions.map((template) => (
                    <div key={template.id} className="rounded-lg border bg-white p-3 shadow-sm space-y-2">
                      <p className="font-medium text-sm text-gray-900">{template.label}</p>
                      <p className="text-xs text-gray-500">{template.description}</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyTemplate(template)}>
                        Use this template
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="input-question-content"
                      placeholder="Enter the question content here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isChoiceQuestion && (
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Answer options</p>
                    <p className="text-sm text-gray-500">
                      {questionType === "mcq_single"
                        ? "Select one correct option."
                        : "Select all options that should be correct."}
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
                      <div key={`${index}-${option}`} className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={isCorrect ? "default" : "outline"}
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => markCorrect(index)}
                        >
                          {isCorrect ? "Correct" : "Mark correct"}
                        </Button>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeOption(index)}
                          aria-label="Remove option"
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isFillBlankQuestion && (
              <div className="rounded-xl border p-4 space-y-3 bg-amber-50/60">
                <div>
                  <p className="font-semibold text-gray-900">Expected answers</p>
                  <p className="text-sm text-gray-500">
                    List the correct words in the order the blanks appear. Use "___" inside the content to indicate a gap.
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
                      placeholder="Explain why this is the correct answer..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
