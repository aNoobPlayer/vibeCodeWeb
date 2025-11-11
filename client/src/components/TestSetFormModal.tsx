import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertTestSetSchema, type Question, type TestSet } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuestionsResponse } from "@/types/api";
import type { z } from "zod";

const formSchema = insertTestSetSchema.extend({
  title: insertTestSetSchema.shape.title.min(1, "Title is required"),
});

type FormData = z.infer<typeof formSchema>;

type SetQuestionMapping = {
  mapping: { questionId: number; section: string; order: number; score: number | null };
  question: Question;
};

interface TestSetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testSet?: TestSet;
}

export function TestSetFormModal({ open, onOpenChange, testSet }: TestSetFormModalProps) {
  const { toast } = useToast();
  const isEdit = !!testSet;
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [initialQuestionIds, setInitialQuestionIds] = useState<number[]>([]);
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionReady, setSelectionReady] = useState(!isEdit);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: testSet?.title || "",
      description: testSet?.description || "",
      skill: testSet?.skill || "Reading",
      questionCount: testSet?.questionCount || 0,
      status: testSet?.status || "draft",
      difficulty: testSet?.difficulty || "medium",
      timeLimit: testSet?.timeLimit || 60,
    },
  });

  const { data: questionBankData, isLoading: isQuestionBankLoading } = useQuery<QuestionsResponse>({
    queryKey: ["/api/questions"],
  });
  const questionBank = questionBankData?.items ?? [];

  const { data: mappingData } = useQuery<SetQuestionMapping[]>({
    queryKey: ["/api/test-sets", testSet?.id, "questions"],
    enabled: Boolean(open && testSet?.id),
  });

  // Reset form when testSet prop changes or dialog closes
  useEffect(() => {
    if (open) {
      form.reset({
        title: testSet?.title || "",
        description: testSet?.description || "",
        skill: testSet?.skill || "Reading",
        questionCount: testSet?.questionCount || 0,
        status: testSet?.status || "draft",
        difficulty: testSet?.difficulty || "medium",
        timeLimit: testSet?.timeLimit || 60,
      });
    }
  }, [testSet, open, form]);

  useEffect(() => {
    if (!open) {
      setSelectedQuestionIds([]);
      setInitialQuestionIds([]);
      setSkillFilter("all");
      setSearchQuery("");
      setSelectionReady(!isEdit);
      return;
    }

    if (testSet) {
      setSelectionReady(false);
      setSelectedQuestionIds([]);
      setInitialQuestionIds([]);
    } else {
      setSelectionReady(true);
      setSelectedQuestionIds([]);
      setInitialQuestionIds([]);
    }
  }, [open, testSet, isEdit]);

  useEffect(() => {
    if (!open || !testSet || !mappingData || selectionReady) return;
    const ids = mappingData.map((m) => m.mapping.questionId);
    setSelectedQuestionIds(ids);
    setInitialQuestionIds(ids);
    setSelectionReady(true);
  }, [open, testSet, mappingData, selectionReady]);

  useEffect(() => {
    if (!selectionReady) return;
    form.setValue("questionCount", selectedQuestionIds.length);
  }, [selectedQuestionIds, form, selectionReady]);

  const filteredBank = useMemo(() => {
    if (!questionBank || questionBank.length === 0) return [];
    return questionBank.filter((question) => {
      const matchesSkill = skillFilter === "all" || question.skill === skillFilter;
      const text = `${question.title ?? ""} ${question.content ?? ""}`.toLowerCase();
      const matchesSearch = searchQuery ? text.includes(searchQuery.toLowerCase()) : true;
      return matchesSkill && matchesSearch;
    });
  }, [questionBank, skillFilter, searchQuery]);

  const toggleQuestionSelection = (questionId: number, shouldSelect: boolean) => {
    setSelectedQuestionIds((prev) => {
      if (shouldSelect) {
        if (prev.includes(questionId)) return prev;
        return [...prev, questionId];
      }
      return prev.filter((id) => id !== questionId);
    });
  };

  const syncQuestionsWithSet = async (setId: string) => {
    if (!selectionReady) return;
    const numericSetId = Number.parseInt(setId, 10);
    if (Number.isNaN(numericSetId)) return;

    const toAdd = selectedQuestionIds.filter((id) => !initialQuestionIds.includes(id));
    const toRemove = initialQuestionIds.filter((id) => !selectedQuestionIds.includes(id));

    for (const questionId of toAdd) {
      await apiRequest(`/api/test-sets/${numericSetId}/questions`, "POST", {
        questionId,
        section: form.getValues("skill") || "General",
      });
    }

    for (const questionId of toRemove) {
      await apiRequest(`/api/test-sets/${numericSetId}/questions/${questionId}`, "DELETE");
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = selectionReady ? { ...data, questionCount: selectedQuestionIds.length } : data;
      const res = isEdit
        ? await apiRequest(`/api/test-sets/${testSet.id}`, "PATCH", payload)
        : await apiRequest("/api/test-sets", "POST", payload);
      const savedSet: TestSet = await res.json();
      await syncQuestionsWithSet(savedSet.id);
      return savedSet;
    },
    onSuccess: (savedSet) => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-sets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-sets", savedSet.id, "questions"] });
      setInitialQuestionIds(selectedQuestionIds);
      toast({
        title: isEdit ? "Test set updated" : "Test set created",
        description: `The test set has been ${isEdit ? "updated" : "created"} successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save test set",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const isQuestionSelectorBusy = !selectionReady || isQuestionBankLoading;
  const selectionLoadingLabel = !selectionReady ? "Loading current selection..." : "Loading question bank...";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Test Set" : "Create New Test Set"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the test set details below" : "Fill in the details to create a new test set"}
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
                    <Input data-testid="input-testset-title" placeholder="e.g., APTIS Reading Test 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="input-testset-description"
                      placeholder="Brief description of this test set"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="skill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-testset-skill">
                          <SelectValue placeholder="Select skill" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Reading">Reading</SelectItem>
                        <SelectItem value="Listening">Listening</SelectItem>
                        <SelectItem value="Speaking">Speaking</SelectItem>
                        <SelectItem value="Writing">Writing</SelectItem>
                        <SelectItem value="GrammarVocabulary">Grammar &amp; Vocabulary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select value={field.value || "medium"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-testset-difficulty">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Card className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <FormLabel className="text-base">Question bank</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Pick the questions you want bundled into this set. You can still fine-tune ordering later via
                    “Manage questions”.
                  </p>
                </div>
                <Badge variant="secondary">
                  {selectionReady ? `${selectedQuestionIds.length} selected` : "Loading..."}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  value={skillFilter}
                  onValueChange={setSkillFilter}
                  disabled={isQuestionSelectorBusy}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All skills</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                    <SelectItem value="Listening">Listening</SelectItem>
                    <SelectItem value="Speaking">Speaking</SelectItem>
                    <SelectItem value="Writing">Writing</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title or content"
                  className="min-w-[220px] flex-1"
                  disabled={isQuestionSelectorBusy}
                />

                <Input
                  readOnly
                  value={selectionReady ? selectedQuestionIds.length : form.getValues("questionCount") ?? 0}
                  className="w-40 bg-muted/60 text-center font-semibold"
                  aria-label="Questions selected"
                />
              </div>

              <div className="rounded-lg border max-h-72 overflow-hidden">
                <div className="max-h-72 overflow-auto">
                  {isQuestionSelectorBusy ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {selectionLoadingLabel}
                    </div>
                  ) : filteredBank.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                      No questions match your filters.
                    </div>
                  ) : (
                    filteredBank.map((question) => {
                      const numericId = Number.parseInt(question.id, 10);
                      if (Number.isNaN(numericId)) {
                        return null;
                      }
                      const checked = selectedQuestionIds.includes(numericId);
                      return (
                        <label
                          key={question.id}
                          className="flex items-center justify-between gap-3 border-b px-3 py-3 text-sm last:border-b-0"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{question.title || `Question ${question.type}`}</div>
                            <div className="text-xs text-muted-foreground">
                              {question.skill} · {question.type}
                            </div>
                          </div>
                          <Checkbox
                            checked={checked}
                            disabled={mutation.isPending}
                            onCheckedChange={(value) => toggleQuestionSelection(numericId, value === true)}
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                For per-section scoring or ordering, save first and open the “Manage questions” dialog from the test set
                table.
              </p>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-testset-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-testset-timelimit"
                        type="number"
                        placeholder="60"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value ? parseInt(event.target.value, 10) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEdit ? "Update Test Set" : "Create Test Set"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
