import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  PauseCircle,
  PlayCircle,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";

type MappedQuestion = {
  mapping: { questionId: number; section: string; order: number; score: number | null };
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

type AnswerResult = {
  isCorrect: boolean | null;
  score: number | null;
};

type NoticeTone = "success" | "warning" | "info" | "error";
type NoticePayload = { tone: NoticeTone; title: string; message: string };

const noticeToneClasses: Record<NoticeTone, string> = {
  success: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  error: "border-rose-200 bg-rose-50",
  info: "border-slate-200 bg-white",
};

const noticeTitleClasses: Record<NoticeTone, string> = {
  success: "text-emerald-900",
  warning: "text-amber-900",
  error: "text-rose-900",
  info: "text-slate-900",
};

const noticeIconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info,
} as const;

export default function TestRunner() {
  const [, params] = useRoute("/student/test/:setId/:submissionId?");
  const [, setLocation] = useLocation();
  const setId = params?.setId!;
  const [submissionId, setSubmissionId] = useState<string | null>(params?.submissionId || null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<MappedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>({});
  const [savedAnswerMap, setSavedAnswerMap] = useState<Record<string, any>>({});
  const [lastAnswerResult, setLastAnswerResult] = useState<
    (AnswerResult & { questionId: string; savedAt: number }) | null
  >(null);
  const current = questions[index];
  const normalizedType = (current?.question.type || "").toLowerCase();
  const [notice, setNotice] = useState<(NoticePayload & { id: number }) | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const handleReturnToDashboard = useCallback(() => {
    setLocation("/student");
  }, [setLocation]);
  const handleStartNewPractice = useCallback(() => {
    setLocation("/student?view=practice");
  }, [setLocation]);
  const handleKeepReviewing = useCallback(() => {
    setShowCompletionOverlay(false);
  }, []);
  const handleTogglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);
  const handleExitWithoutSubmit = useCallback(() => {
    setShowExitPrompt(false);
    setPaused(false);
    setLocation("/student");
  }, [setLocation]);
  const handleOpenExitPrompt = useCallback(() => {
    setPaused(false);
    setShowExitPrompt(true);
  }, []);

  const showNotice = useCallback((payload: NoticePayload) => {
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }
    const next = { ...payload, id: Date.now() };
    setNotice(next);
    noticeTimer.current = setTimeout(() => {
      setNotice((currentNotice) => (currentNotice?.id === next.id ? null : currentNotice));
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  const questionFocusTips = current
    ? [
        current.question.skill
          ? `Highlight your ${current.question.skill.toLowerCase()} skills with a concrete example.`
          : "Lead with your strongest idea first, then support it.",
        "Keep sentences in American English so scorers stay aligned.",
        "Save after each question to keep your streak safe.",
      ]
    : [];
  const answerChecklist = (() => {
    switch (normalizedType) {
      case "mcq_single":
        return ["Read every option completely once.", "Eliminate obvious mismatches.", "Lock in the best match, then save."];
      case "mcq_multi":
        return [
          "Expect more than one correct answer.",
          "Select every statement supported by the prompt.",
          "Review selections before saving.",
        ];
      case "fill_blank":
        return ["Match the sentence tense and tone.", "Use US spelling (color, organize).", "Reread to confirm the flow."];
      default:
        return ["Plan your response in one sentence.", "Back it up with a fact or example.", "Proofread quickly, then save."];
    }
  })();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        let subId = submissionId;
        if (!subId) {
          const res = await fetch("/api/submissions/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ setId }),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          subId = data.id;
          if (!cancelled) setSubmissionId(subId);
        }
        const qr = await fetch(`/api/test-sets/${setId}/questions`, { credentials: "include" });
        if (!qr.ok) throw new Error(await qr.text());
        const qs = await qr.json();
        if (!cancelled) setQuestions(qs);
      } catch (e) {
        console.error(e);
        alert("Failed to start test. Please retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [setId]);

  const total = questions.length;
  const progress = useMemo(() => (total > 0 ? Math.round(((index + 1) / total) * 100) : 0), [index, total]);
  const answeredCount = useMemo(() => Object.values(answeredMap).filter(Boolean).length, [answeredMap]);

  async function saveAnswer(answer: any): Promise<AnswerResult | undefined> {
    if (!submissionId || !current) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId: parseInt(current.question.id, 10), answer }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as AnswerResult;
      return data;
    } catch (e) {
      console.error(e);
      showNotice({
        tone: "error",
        title: "Save failed",
        message: e instanceof Error ? e.message : "Failed to save answer. Please try again.",
      });
    } finally {
      setSaving(false);
    }
    return undefined;
  }

  async function handleAnswerSubmit(answer: any, questionId: string) {
    const result = await saveAnswer(answer);
    if (result) {
      setAnsweredMap((prev) => ({
        ...prev,
        [questionId]: true,
      }));
      setSavedAnswerMap((prev) => ({ ...prev, [questionId]: answer }));
      setLastAnswerResult({
        ...result,
        questionId,
        savedAt: Date.now(),
      });
      const tone: NoticeTone = result.isCorrect === true ? "success" : result.isCorrect === false ? "warning" : "info";
      const message =
        result.isCorrect === null
          ? "Saved! Final scoring will appear after review."
          : result.isCorrect
          ? "Looking great—auto-scoring flagged this as correct."
          : "Saved successfully. Give it another look before submitting.";
      showNotice({
        tone,
        title: "Answer saved",
        message,
      });
    }
  }

  // Load saved answer for the current question when submissionId or index changes
  useEffect(() => {
    let cancelled = false;
    async function loadSaved() {
      if (!submissionId || !current) return;
      try {
        const res = await fetch(`/api/submissions/${submissionId}/answers/${current.question.id}`, { credentials: "include" });
        if (!res.ok) {
          // ignore not found
          if (res.status === 404) return;
          throw new Error(await res.text());
        }
        const data = await res.json();
        if (!cancelled) {
          setSavedAnswerMap((prev) => ({ ...prev, [current.question.id]: data.answerData }));
          if (data.isCorrect !== undefined && data.isCorrect !== null) {
            setAnsweredMap((prev) => ({ ...prev, [current.question.id]: true }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSaved();
    return () => {
      cancelled = true;
    };
  }, [submissionId, current?.question.id]);

  async function submitAll() {
    if (!submissionId) return;
    setShowExitPrompt(false);
    setPaused(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/submit`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSubmitted(true);
      setShowCompletionOverlay(true);
      showNotice({
        tone: "success",
        title: "Submission sent",
        message:
          typeof data?.score === "number"
            ? `Preliminary score recorded: ${data.score}`
            : "We'll email you when grading wraps up.",
      });
    } catch (e) {
      console.error(e);
      showNotice({
        tone: "error",
        title: "Submission failed",
        message: e instanceof Error ? e.message : "Please try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading test...</div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>No questions in this set.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9CCC65] via-[#66BB6A] to-[#1B5E20] py-10 px-4">
      {notice && (
        <div className="fixed inset-x-0 top-4 z-60 flex justify-center px-4">
          <div
            className={cn(
              "w-full max-w-xl rounded-3xl border px-5 py-4 shadow-2xl backdrop-blur flex items-start gap-3 transition duration-300",
              noticeToneClasses[notice.tone]
            )}
            role="status"
            aria-live="polite"
          >
            {(() => {
              const Icon = noticeIconMap[notice.tone];
              return (
                <Icon
                  className={cn("h-5 w-5 flex-shrink-0", noticeTitleClasses[notice.tone])}
                  aria-hidden="true"
                />
              );
            })()}
            <div className="flex-1">
              <p className={cn("text-sm font-semibold leading-tight", noticeTitleClasses[notice.tone])}>{notice.title}</p>
              <p className="text-xs text-slate-600 mt-1">{notice.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notification"
              className="rounded-full p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {paused && !submitted && (
        <div className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm px-4 py-10 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl space-y-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Practice paused</p>
            <h2 className="text-3xl font-semibold text-slate-900">Take a breath. Your spot is saved.</h2>
            <p className="text-sm text-slate-500">
              While paused you can’t change answers. Resume to keep working or head back to the dashboard.
            </p>
            <div className="space-y-3">
              <Button className="w-full" onClick={handleTogglePause}>
                <PlayCircle className="w-4 h-4 mr-2" />
                Resume practice
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setPaused(false);
                  setShowExitPrompt(true);
                }}
              >
                Exit or submit
              </Button>
            </div>
          </div>
        </div>
      )}
      {showExitPrompt && !submitted && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm px-4 py-10 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Leave practice</p>
              <h2 className="text-2xl font-semibold text-slate-900 mt-2">Ready to wrap up?</h2>
              <p className="text-sm text-slate-500">
                You can submit everything as-is or step away and finish later.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  setShowExitPrompt(false);
                  submitAll();
                }}
                disabled={saving}
              >
                Submit & exit
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleExitWithoutSubmit}>
                Exit without submitting
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setShowExitPrompt(false)}>
                Stay in this test
              </Button>
            </div>
          </div>
        </div>
      )}
      {submitted && showCompletionOverlay && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm px-4 py-10 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Test submitted</p>
              <h2 className="text-3xl font-semibold text-slate-900">Great work—you’re all done!</h2>
              <p className="text-sm text-slate-500">
                You answered {answeredCount} of {total || 1} questions and we’ve synced everything to your student dashboard.
                Choose what to do next.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-center">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Progress</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{progress}%</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Answered</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{answeredCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Remaining</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{Math.max((total || 0) - answeredCount, 0)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button className="w-full" onClick={handleReturnToDashboard}>
                Back to student dashboard
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleStartNewPractice}>
                Plan my next practice
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleKeepReviewing}>
                Keep reviewing answers
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white/10 backdrop-blur-3xl border border-white/25 rounded-3xl p-6 shadow-2xl flex flex-wrap gap-6 items-center justify-between">
          <div className="flex-1 min-w-[260px]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">Aptis practice</p>
            <h1 className="text-3xl font-semibold text-white mt-2">
              Question {index + 1} of {total || 1}
            </h1>
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-2 bg-white/20 [&>.indicator]:bg-white" />
              <div className="flex items-center justify-between text-xs font-medium text-white/80">
                <span>{index + 1} / {total || 1} questions</span>
                <span>{progress}% complete</span>
              </div>
            </div>
          </div>
          <div className="bg-white/95 text-gray-900 rounded-2xl border border-white/80 p-5 shadow-xl min-w-[220px] space-y-2">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Status</div>
            <div className="text-2xl font-bold">
              {submitted ? "Submitted" : "In progress"}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock3 className="w-4 h-4 text-primary" />
              <span>{current.question.skill} / {formatQuestionType(current.question.type)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={paused ? "secondary" : "ghost"}
              onClick={handleTogglePause}
              disabled={submitted}
              className="text-white border-white/50 hover:bg-white/10"
            >
              {paused ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Resume practice
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4" />
                  Pause practice
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={handleOpenExitPrompt}
              className="rounded-full border border-white/40 text-white/80 hover:text-white hover:bg-white/10 p-2 transition disabled:opacity-40"
              aria-label="Exit test"
              disabled={submitted && showCompletionOverlay}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]">
          <Card className="p-8 space-y-6 bg-white/95 backdrop-blur-xl rounded-3xl border border-white/70 shadow-2xl">
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100">
                Skill: {current.question.skill}
              </Badge>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-100">
                Type: {formatQuestionType(current.question.type)}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-100">
                Points: {current.mapping.score ?? current.question.points}
              </Badge>
            </div>

            {current.question.title && (
              <h2 className="text-2xl font-semibold text-gray-900">{current.question.title}</h2>
            )}
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
              {current.question.content}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Focus guidance</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
                  {questionFocusTips.map((tip, tipIndex) => (
                    <li key={`focus-tip-${current.question.id}-${tipIndex}`}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Answer checklist</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
                  {answerChecklist.map((tip, tipIndex) => (
                    <li key={`checklist-${current.question.id}-${tipIndex}`}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            {current.question.mediaUrl && (
              <div className="pt-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  {current.question.mediaUrl.match(/\.mp3|\.wav|\.ogg/i) ? (
                    <audio controls src={current.question.mediaUrl} className="w-full" />
                  ) : (
                    <img
                      src={current.question.mediaUrl}
                      alt="Question media"
                      className="max-h-72 w-full object-cover rounded-2xl"
                    />
                  )}
                </div>
              </div>
            )}

            <QuestionAnswer
              key={current.question.id}
              type={current.question.type}
              options={current.question.options}
              initialValue={savedAnswerMap[current.question.id]}
              onSave={(value) => handleAnswerSubmit(value, current.question.id)}
              saving={saving}
              disabled={submitted || paused}
            />

            <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-600">
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
                <p className="font-semibold text-gray-900">Save reminder</p>
                <p className="mt-1 text-xs text-gray-500">Tap “Save answer” after each response so the system keeps your place.</p>
                <p className="mt-2">Saved status updates instantly near the footer controls.</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="font-semibold text-gray-900">Need a hint?</p>
                <p className="mt-1">Look back at key phrases in the prompt. US scorers reward answers that reuse that same language.</p>
                <p className="mt-2 text-xs text-gray-500">Support: support@aptiskeys.com</p>
              </div>
            </div>

            {lastAnswerResult && lastAnswerResult.questionId === current.question.id && (
              <div
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                  lastAnswerResult.isCorrect === true
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : lastAnswerResult.isCorrect === false
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-blue-50 border-blue-100 text-blue-700",
                )}
              >
                {lastAnswerResult.isCorrect === null && "Answer saved! You'll see the result after grading."}
                {lastAnswerResult.isCorrect === true && "Nice! This answer looks correct based on auto-scoring."}
                {lastAnswerResult.isCorrect === false && "Saved. Review your choice before submitting the test."}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Save after choosing to keep your streak alive.</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIndex(Math.max(0, index - 1))}
                  disabled={index === 0 || paused}
                  className="bg-white text-gray-700 border border-gray-200 rounded-full px-5 shadow-sm hover:shadow-md disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIndex(Math.min(total - 1, index + 1))}
                  disabled={index >= total - 1 || paused}
                  className="rounded-full px-5 shadow-sm hover:shadow-md disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  type="button"
                  onClick={submitAll}
                  disabled={saving || submitted || paused}
                  className="rounded-full px-6 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg hover:shadow-xl disabled:opacity-60"
                >
                  <SendHorizontal className="w-4 h-4 mr-2" />
                  {submitted ? "Submitted" : "Submit answers"}
                </Button>
              </div>
            </div>
          </Card>

          <aside className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Question map</p>
              <div className="flex items-center justify-between mt-2">
                <h3 className="text-lg font-semibold text-gray-900">Stay on track</h3>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {answeredCount}/{total || 1} saved
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((question, idx) => {
                const isActive = idx === index;
                const isAnswered = answeredMap[question.question.id];
                return (
                  <button
                    key={question.question.id}
                    type="button"
                    onClick={() => setIndex(idx)}
                    disabled={paused}
                    className={cn(
                      "h-12 rounded-2xl border text-sm font-semibold transition-all disabled:opacity-50",
                      isActive
                        ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg border-transparent"
                        : isAnswered
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-500 hover:border-primary/50 hover:-translate-y-0.5",
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-sm text-gray-700">
              <p className="font-semibold">Need a breather?</p>
              <p className="text-xs text-gray-500 mt-1">
                Your answers are synced each time you hit &quot;Save answer&quot;.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function QuestionAnswer({
  type,
  options = [],
  onSave,
  initialValue,
  saving,
  disabled,
}: {
  type: string;
  options: string[];
  onSave: (ans: any) => Promise<void>;
  initialValue?: any;
  saving: boolean;
  disabled: boolean;
}) {
  const normalizedType = (type || "").toLowerCase();
  const [value, setValue] = useState<string | string[]>(() => {
    if (initialValue !== undefined && initialValue !== null) return initialValue;
    return normalizedType === "mcq_multi" ? [] : "";
  });

  useEffect(() => {
    // reset baseline when type changes
    if (initialValue !== undefined) {
      setValue(initialValue);
    } else {
      setValue(normalizedType === "mcq_multi" ? [] : "");
    }
  }, [normalizedType, initialValue]);

  if (normalizedType === "mcq_single") {
    const singleValue = typeof value === "string" ? value : "";
    return (
      <div className="space-y-3">
        {options.map((opt, idx) => {
          const selected = singleValue === opt;
          return (
            <button
              key={`${opt}-${idx}`}
              type="button"
              onClick={() => !disabled && setValue(opt)}
              disabled={disabled}
              className={cn(
                "w-full text-left border rounded-2xl p-4 transition-all bg-white",
                selected
                  ? "border-primary shadow-lg text-gray-900"
                  : "border-gray-200 hover:border-primary/50 hover:-translate-y-0.5",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 font-semibold flex items-center justify-center">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium text-gray-900">{opt}</span>
                </div>
                {selected && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
            </button>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-gray-500">Choose one option then save.</span>
          <Button
            type="button"
            onClick={() => onSave(singleValue)}
            disabled={saving || !singleValue || disabled}
            className="rounded-full bg-primary text-white px-5 shadow-lg hover:shadow-xl disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save answer"}
          </Button>
        </div>
      </div>
    );
  }

  if (normalizedType === "mcq_multi") {
    const multiValue = Array.isArray(value) ? value : [];
    const toggle = (opt: string) => {
      if (disabled) return;
      setValue((prev) => {
        const currentValue = Array.isArray(prev) ? prev : [];
        return currentValue.includes(opt)
          ? currentValue.filter((item) => item !== opt)
          : [...currentValue, opt];
      });
    };

    return (
      <div className="space-y-3">
        {options.map((opt, idx) => {
          const selected = multiValue.includes(opt);
          return (
            <button
              key={`${opt}-${idx}`}
              type="button"
              onClick={() => toggle(opt)}
              disabled={disabled}
              className={cn(
                "w-full text-left border rounded-2xl p-4 transition-all bg-white",
                selected
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-md"
                  : "border-gray-200 hover:border-primary/50 hover:-translate-y-0.5",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-9 h-9 rounded-2xl flex items-center justify-center border font-semibold",
                      selected
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-gray-50 text-gray-500 border-gray-200",
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium text-gray-900">{opt}</span>
                </div>
                {selected && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              </div>
            </button>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-gray-500">Select one or more options.</span>
          <Button
            type="button"
            onClick={() => onSave(multiValue)}
            disabled={saving || multiValue.length === 0 || disabled}
            className="rounded-full bg-primary text-white px-5 shadow-lg hover:shadow-xl disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save answer"}
          </Button>
        </div>
      </div>
    );
  }

  if (normalizedType === "fill_blank") {
    const textValue = typeof value === "string" ? value : "";
    return (
      <div className="space-y-3">
        <Input
          placeholder="Type your answer"
          value={textValue}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          className="h-12 rounded-2xl border border-gray-200"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => onSave(textValue)}
            disabled={saving || !textValue || disabled}
            className="rounded-full bg-primary text-white px-5 shadow-lg hover:shadow-xl disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save answer"}
          </Button>
        </div>
      </div>
    );
  }

  const textValue = typeof value === "string" ? value : "";
  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Write your response here..."
        value={textValue}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="min-h-[140px] rounded-3xl border border-gray-200"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => onSave(textValue)}
          disabled={saving || !textValue || disabled}
          className="rounded-full bg-primary text-white px-5 shadow-lg hover:shadow-xl disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save answer"}
        </Button>
      </div>
    </div>
  );
}

function formatQuestionType(type: string) {
  if (!type) return "Question";
  const cleaned = type.replace(/[_-]/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
