import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TestSet } from "@shared/schema";
import { Loader2, AlertTriangle } from "lucide-react";

type PreviewQuestion = {
  mapping: {
    questionId: number;
    section: string;
    order: number;
    score: number | null;
  };
  question: {
    id: string;
    title: string | null;
    skill: string;
    type: string;
    content: string;
    options: string[];
    correctAnswers: string[];
    explanation: string | null;
    mediaUrl: string | null;
    points: number;
    tags: string[];
  };
};

type TestSetPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testSet: TestSet | null;
};

export function TestSetPreviewModal({ open, onOpenChange, testSet }: TestSetPreviewModalProps) {
  const { data, isLoading, error } = useQuery<PreviewQuestion[]>({
    queryKey: ["preview-set", testSet?.id],
    enabled: open && Boolean(testSet?.id),
    queryFn: async () => {
      if (!testSet) return [];
      const res = await fetch(`/api/test-sets/${testSet.id}/questions`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const sortedQuestions = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => a.mapping.order - b.mapping.order);
  }, [data]);

  const [skillFilter, setSkillFilter] = useState<string>("all");

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    sortedQuestions.forEach((item) => set.add(item.question.skill));
    return Array.from(set).sort();
  }, [sortedQuestions]);

  const visibleQuestions = useMemo(() => {
    if (skillFilter === "all") return sortedQuestions;
    return sortedQuestions.filter((item) => item.question.skill === skillFilter);
  }, [sortedQuestions, skillFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden border-none bg-transparent p-0">
        <div className="grid h-[85vh] w-full overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[1.1fr_2fr]">
          <div className="flex flex-col bg-gradient-to-b from-primary/80 to-primary text-white p-6">
            <DialogHeader className="text-white">
              <DialogTitle className="text-2xl font-semibold">Preview test set</DialogTitle>
              <DialogDescription className="text-white/80">
                Admin-only view to verify sections, ordering, and scoring before publishing.
              </DialogDescription>
            </DialogHeader>
            {testSet ? (
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/70">Title</p>
                  <p className="text-lg font-semibold">{testSet.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/70">Skill</p>
                    <p className="font-semibold">{testSet.skill}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/70">Status</p>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {testSet.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/70">Questions</p>
                    <p className="font-semibold">{testSet.questionCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/70">Updated</p>
                    <p className="font-semibold">
                      {testSet.updatedAt ? new Date(testSet.updatedAt).toLocaleString() : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm leading-relaxed">
                  <p>
                    Use the right pane to review each question exactly as students will see it (minus scoring interaction).
                    This is helpful before activating a set or after making large edits.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-white/80">Select a test set to preview.</p>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col bg-white">
            <div className="border-b px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Question order</p>
                  <p className="text-xs text-gray-500">
                    Showing {visibleQuestions.length} of {sortedQuestions.length} linked question
                    {sortedQuestions.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print view
                </Button>
              </div>
              {skillOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSkillFilter("all")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      skillFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500"
                    }`}
                  >
                    All skills
                  </button>
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setSkillFilter(skill)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        skillFilter === skill ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="scroll-ghost flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {isLoading && (
                <div className="flex items-center justify-center py-20 text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading questions...
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Failed to load questions. {error instanceof Error ? error.message : ""}
                </div>
              )}
              {!isLoading && !error && sortedQuestions.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-12">No questions have been linked to this set.</div>
              )}

              {!isLoading && !error && sortedQuestions.length > 0 && visibleQuestions.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-12">
                  No questions match the selected skill filter.
                </div>
              )}

              {visibleQuestions.map((item, index) => (
                <div key={`${item.mapping.questionId}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">#{item.mapping.order}</Badge>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.question.title ?? `Question ${item.mapping.order}`}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{item.question.skill}</span>
                      <span>&bull;</span>
                      <span>{item.question.type}</span>
                      {item.mapping.score !== null && (
                        <>
                          <span>&bull;</span>
                          <span>{item.mapping.score} pts</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{item.question.content}</div>

                  {item.question.options && item.question.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Options</p>
                      {item.question.options.map((option, optIndex) => {
                        const isCorrect = item.question.correctAnswers?.includes(option);
                        return (
                          <div
                            key={`${item.question.id}-option-${optIndex}`}
                            className={`rounded-xl border px-3 py-2 text-sm ${
                              isCorrect ? "border-emerald-400 bg-emerald-50" : "border-gray-200"
                            }`}
                          >
                            <span className="font-semibold text-gray-500 mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                            {option}
                            {isCorrect && <span className="ml-2 text-xs text-emerald-600">(correct)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {item.question.correctAnswers && item.question.correctAnswers.length > 0 && item.question.options.length === 0 && (
                    <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">Answer(s): </span>
                      {item.question.correctAnswers.join(", ")}
                    </div>
                  )}

                  {item.question.explanation && (
                    <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <span className="font-semibold">Explanation:</span> {item.question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
