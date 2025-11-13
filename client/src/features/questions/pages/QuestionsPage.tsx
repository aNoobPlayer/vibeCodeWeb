import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Question, TestSet } from "@shared/schema";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionImportButton } from "@/components/QuestionImportModal";
import { QuestionFormModal } from "@/components/QuestionFormModal";
import { useToast } from "@/hooks/use-toast";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { useTemplates } from "@/features/templates/hooks/useTemplates";
import { useTestSets } from "@/features/test-sets/hooks/useTestSets";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  Sparkles,
  Plus,
  ClipboardList,
  FolderPlus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

type QuestionsPageProps = {
  onShowTemplates: () => void;
};

export default function QuestionsPage({ onShowTemplates }: QuestionsPageProps) {
  const [filterSkill, setFilterSkill] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [assignTarget, setAssignTarget] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  const { questionsResponse, questions, isLoading } = useQuestions({
    skill: filterSkill || undefined,
    type: filterType || undefined,
    search: searchQuery || undefined,
  });
  const { templates } = useTemplates();
  const featuredTemplates = useMemo(() => templates.slice(0, 4), [templates]);

  const questionItems = useMemo(() => questions, [questions]);
  const deleteQuestionMutation = useMutation<void, Error, Question>({
    mutationFn: async (question) => {
      await apiRequest(`/api/questions/${question.id}`, "DELETE");
    },
    onSuccess: (_, question) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions() });
      toast({
        title: "Question deleted",
        description: `"${question.title || question.type}" has been removed from the bank.`,
      });
      setQuestionToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Question bank</h1>
        <p className="text-gray-600">Manage questions by skill and type</p>
      </div>

      {featuredTemplates.length > 0 && (
        <Card className="space-y-3 border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Template shortcuts</p>
              <p className="text-xs text-gray-600">
                Start from a proven prompt. Applying a template pre-fills content, options, and tags.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onShowTemplates}>
              <Sparkles className="w-4 h-4 mr-1" />
              Manage templates
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {featuredTemplates.map((template) => (
              <div
                key={`qb-template-${template.id}`}
                className="min-w-[220px] flex-1 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-sm font-semibold text-gray-900">{template.label}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {template.skills.map((skill) => (
                    <span key={`${template.id}-${skill}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            data-testid="button-add-question"
            className="gap-2"
            onClick={() => {
              setEditingQuestion(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add new question
          </Button>
          <Button variant="outline" asChild data-testid="button-download-question-template">
            <a href="/templates/question-template.csv" download="question-template.csv">
              Download Excel template
            </a>
          </Button>
          <QuestionImportButton
            onImported={() =>
              queryClient.invalidateQueries({ queryKey: queryKeys.questions() })
            }
          />
          <div className="flex gap-2 ml-auto">
            <Select
              value={filterSkill || "all"}
              onValueChange={(value) => setFilterSkill(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-40" data-testid="filter-question-skill">
                <SelectValue placeholder="All skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="GrammarVocabulary">Grammar &amp; Vocabulary</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterType || "all"}
              onValueChange={(value) => setFilterType(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-48" data-testid="filter-question-type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="mcq_single">MCQ (single answer)</SelectItem>
                <SelectItem value="mcq_multi">MCQ (multiple answers)</SelectItem>
                <SelectItem value="fill_blank">Fill in the blanks</SelectItem>
                <SelectItem value="writing_prompt">Writing prompt</SelectItem>
                <SelectItem value="speaking_prompt">Speaking prompt</SelectItem>
              </SelectContent>
            </Select>
            <Input
              data-testid="input-search-questions"
              placeholder="Tìm theo tiêu đề, nội dung, tags..."
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
                <TableHead>Question title</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-56">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    Đang tải danh sách câu hỏi...
                  </TableCell>
                </TableRow>
              ) : !questionItems || questionItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3" />
                    <p>No questions found</p>
                  </TableCell>
                </TableRow>
              ) : (
                questionItems.map((question, index) => (
                  <TableRow
                    key={question.id}
                    data-testid={`question-row-${question.id}`}
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {question.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          question.skill === "Reading"
                            ? "bg-blue-100 text-blue-700"
                            : question.skill === "Listening"
                              ? "bg-cyan-100 text-cyan-700"
                              : question.skill === "Speaking"
                                ? "bg-green-100 text-green-700"
                                : question.skill === "Writing"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-purple-100 text-purple-700"
                        }
                      >
                        {question.skill}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {question.type === "mcq_single"
                        ? "MCQ (1)"
                        : question.type === "mcq_multi"
                          ? "MCQ (multiple)"
                          : question.type === "fill_blank"
                            ? "Fill blanks"
                            : question.type === "writing_prompt"
                              ? "Writing prompt"
                              : "Speaking prompt"}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {question.points}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {question.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-question-${question.id}`}
                          onClick={() => {
                            setEditingQuestion(question);
                            setIsModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-view-question-${question.id}`}
                          onClick={() => setViewingQuestion(question)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-assign-question-${question.id}`}
                          onClick={() => setAssignTarget(question)}
                          title="Assign to test set"
                        >
                          <FolderPlus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-question-${question.id}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setQuestionToDelete(question)}
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
      <QuestionFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingQuestion(null);
          }
        }}
        question={editingQuestion ?? undefined}
      />
      <QuestionAssignModal
        question={assignTarget}
        onClose={() => setAssignTarget(null)}
      />
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{questionToDelete?.title || questionToDelete?.type}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => questionToDelete && deleteQuestionMutation.mutate(questionToDelete)}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={Boolean(viewingQuestion)}
        onOpenChange={(open) => {
          if (!open) setViewingQuestion(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingQuestion?.title ?? "Question preview"}</DialogTitle>
            <DialogDescription>
              {viewingQuestion
                ? `${viewingQuestion.skill} · ${viewingQuestion.type}`
                : "Question details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="whitespace-pre-wrap">{viewingQuestion?.content}</p>
            {viewingQuestion?.options && viewingQuestion?.options.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 mb-1">Options</p>
                <ul className="space-y-1">
                  {viewingQuestion.options.map((option, idx) => (
                    <li key={`${option}-${idx}`}>{String.fromCharCode(65 + idx)}. {option}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuestionAssignModal({ question, onClose }: { question: Question | null; onClose: () => void }) {
  const open = Boolean(question);
  const { toast } = useToast();
  const [section, setSection] = useState("Section A");
  const [selectedSetId, setSelectedSetId] = useState<string>("");

  const { testSets } = useTestSets();

  const { data: usedSets = [], isLoading: usageLoading } = useQuery<TestSet[]>({
    queryKey: ["question-sets", question?.id],
    enabled: open && Boolean(question?.id),
    queryFn: async () => {
      const res = await fetch(`/api/questions/${question?.id}/sets`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  useEffect(() => {
    if (open) {
      setSection("Section A");
      setSelectedSetId("");
    }
  }, [open, question?.id]);

  const recommendedSets = useMemo(() => {
    if (!testSets || !question) return [];
    return testSets.filter((set) => set.skill === question.skill);
  }, [testSets, question]);

  const otherSets = useMemo(() => {
    if (!testSets || !question) return [];
    return testSets.filter((set) => set.skill !== question.skill);
  }, [testSets, question]);

  const assignMutation = useMutation({
    mutationFn: async (setId: string) => {
      if (!question) throw new Error("No question selected");
      const parsedId = parseInt(question.id, 10);
      if (Number.isNaN(parsedId)) throw new Error("Question id is not numeric");
      const payload = {
        questionId: parsedId,
        section: section || "Section A",
        score: question.points ?? 1,
      };
      const res = await fetch(`/api/test-sets/${setId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      if (question) {
        queryClient.invalidateQueries({ queryKey: ["question-sets", question.id] });
      }
      toast({ title: "Question assigned", description: "Question added to the selected test set." });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign question",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleAssign = (setId: string) => {
    setSelectedSetId(setId);
    assignMutation.mutate(setId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Assign question to test set</DialogTitle>
          <DialogDescription>
            Link "{question?.title || question?.type}" directly to a set without leaving the question bank.
          </DialogDescription>
        </DialogHeader>

        {!question ? (
          <p className="text-sm text-gray-500">Select a question to continue.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{question.title || `Question ${question.id}`}</p>
              <p className="text-xs text-gray-500 mt-1">
                Skill: {question.skill} &bull; Type: {question.type} &bull; Points: {question.points}
              </p>
              <p className="mt-2 text-sm text-gray-700 line-clamp-2">{question.content}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Currently used in</p>
                {usageLoading ? (
                  <p className="text-xs text-gray-500">Loading...</p>
                ) : usedSets.length === 0 ? (
                  <p className="text-xs text-gray-500">Not linked to any test set yet.</p>
                ) : (
                  <div className="scroll-ghost max-h-40 overflow-y-auto space-y-2">
                    {usedSets.map((set) => (
                      <div key={`used-${set.id}`} className="rounded-lg border border-gray-200 px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{set.title}</p>
                        <p className="text-xs text-gray-500">
                          Skill: {set.skill} &bull; Status: {set.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Assign to set</p>
                <div className="space-y-3">
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select test set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>
                        Choose test set
                      </SelectItem>
                      {(testSets ?? []).map((set) => (
                        <SelectItem key={set.id} value={String(set.id)}>
                          {set.title} ({set.skill})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={section}
                    onChange={(event) => setSection(event.target.value)}
                    placeholder="Section label (e.g., Section A)"
                  />
                  <Button
                    onClick={() => selectedSetId && handleAssign(selectedSetId)}
                    disabled={!selectedSetId || assignMutation.isPending}
                  >
                    {assignMutation.isPending ? "Assigning..." : "Assign to selected set"}
                  </Button>
                </div>
              </div>
            </div>

            {recommendedSets.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Recommended sets (matching skill)</p>
                <div className="flex flex-wrap gap-2">
                  {recommendedSets.map((set) => (
                    <Button
                      key={`rec-${set.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssign(String(set.id))}
                      disabled={assignMutation.isPending}
                    >
                      {set.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {otherSets.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Other available sets</p>
                <div className="scroll-ghost max-h-48 overflow-y-auto space-y-2">
                  {otherSets.map((set) => (
                    <div
                      key={`other-${set.id}`}
                      className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{set.title}</p>
                        <p className="text-xs text-gray-500">Skill: {set.skill}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleAssign(String(set.id))}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
