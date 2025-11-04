import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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

export default function TestRunner() {
  const [, params] = useRoute("/student/test/:setId/:submissionId?");
  const setId = params?.setId!;
  const [submissionId, setSubmissionId] = useState<string | null>(params?.submissionId || null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<MappedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const current = questions[index];

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        // Ensure submission exists
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
        // Load questions for this set
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
    return () => { cancelled = true; };
  }, [setId]);

  const total = questions.length;
  const progress = useMemo(() => (total > 0 ? Math.round(((index + 1) / total) * 100) : 0), [index, total]);

  async function saveAnswer(answer: any) {
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
    } catch (e) {
      console.error(e);
      alert("Failed to save answer");
    } finally {
      setSaving(false);
    }
  }

  async function submitAll() {
    if (!submissionId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/submit`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSubmitted(true);
      alert(`Submitted! Score: ${data.score}`);
    } catch (e) {
      console.error(e);
      alert("Failed to submit");
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Question {index + 1} / {total} · {progress}%</div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>Prev</Button>
            <Button variant="outline" onClick={() => setIndex(Math.min(total - 1, index + 1))} disabled={index >= total - 1}>Next</Button>
            <Button onClick={submitAll} disabled={saving || submitted}>{submitted ? "Submitted" : "Submit"}</Button>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          {current.question.title && (
            <div className="text-lg font-semibold">{current.question.title}</div>
          )}
          <div className="text-gray-800 whitespace-pre-wrap">{current.question.content}</div>

          <QuestionAnswer
            key={current.question.id}
            type={current.question.type}
            options={current.question.options}
            onSave={saveAnswer}
            saving={saving}
          />
          {current.question.mediaUrl && (
            <div className="pt-2">
              {/* naive media render */}
              {current.question.mediaUrl.match(/\.mp3|\.wav|\.ogg/i) ? (
                <audio controls src={current.question.mediaUrl} />
              ) : (
                <img src={current.question.mediaUrl} alt="media" className="max-h-64" />
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuestionAnswer({ type, options, onSave, saving }: { type: string; options: string[]; onSave: (ans: any) => Promise<void>; saving: boolean }) {
  const t = (type || '').toLowerCase();
  const [value, setValue] = useState<any>(t === 'mcq_multi' ? [] : '');

  useEffect(() => { setValue(t === 'mcq_multi' ? [] : ''); }, [t]);

  if (t === 'mcq_single') {
    return (
      <div className="space-y-2">
        {options?.map((opt, i) => (
          <label key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="mcq_single"
              className="accent-primary"
              checked={value === opt}
              onChange={() => setValue(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
        <div className="pt-2">
          <Button onClick={() => onSave(value)} disabled={saving || !value}>Save answer</Button>
        </div>
      </div>
    );
  }

  if (t === 'mcq_multi') {
    const toggle = (opt: string) => {
      setValue((prev: string[]) => prev.includes(opt) ? prev.filter((x: string) => x !== opt) : [...prev, opt]);
    };
    return (
      <div className="space-y-2">
        {options?.map((opt, i) => (
          <label key={i} className="flex items-center gap-2">
            <Checkbox checked={value.includes(opt)} onCheckedChange={() => toggle(opt)} />
            <span>{opt}</span>
          </label>
        ))}
        <div className="pt-2">
          <Button onClick={() => onSave(value)} disabled={saving || value.length === 0}>Save answer</Button>
        </div>
      </div>
    );
  }

  if (t === 'fill_blank') {
    return (
      <div className="space-y-2">
        <Input placeholder="Your answer" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button onClick={() => onSave(value)} disabled={saving || !value}>Save answer</Button>
      </div>
    );
  }

  // writing/speaking prompt
  return (
    <div className="space-y-2">
      <Textarea placeholder="Write your response here..." value={value} onChange={(e) => setValue(e.target.value)} />
      <Button onClick={() => onSave(value)} disabled={saving || !value}>Save answer</Button>
    </div>
  );
}
