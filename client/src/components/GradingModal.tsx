import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export function GradingModal({ submission, onClose, onDone }: { submission: any; onClose: () => void; onDone: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/submissions/${submission.id}/answers`, { credentials: 'include' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancel) setItems(data.map((d: any) => ({ ...d, score: d.currentScore ?? '', comment: '' })));
      } catch (e) {
        console.error(e);
        alert('Failed to load answers');
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, [submission.id]);

  async function saveAll() {
    setSaving(true);
    try {
      for (const it of items) {
        const body = { submissionId: submission.id, questionId: it.questionId, manualScore: parseFloat(it.score || 0), comment: it.comment || '' };
        const res = await fetch('/api/admin/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
        if (!res.ok) throw new Error(await res.text());
      }
      alert('Saved grades');
    } catch (e) {
      console.error(e);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function completeSubmission() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}/complete`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      onDone();
    } catch (e) {
      console.error(e);
      alert('Failed to complete');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Chấm điểm Submission #{submission.id}</DialogTitle>
          <DialogDescription>Viết điểm cho từng câu Writing/Speaking</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-4">Đang tải...</div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-auto">
            {items.map((it, idx) => (
              <Card key={it.questionId} className="p-4 space-y-2">
                <div className="text-sm text-gray-500">#{idx + 1} · {it.skill} · {it.type}</div>
                {it.title && <div className="font-medium">{it.title}</div>}
                <div className="whitespace-pre-wrap text-gray-800">{it.stem}</div>
                <div className="bg-gray-50 p-3 rounded">{String(it.answerData)}</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span>Điểm:</span>
                    <Input className="h-8 w-24" value={it.score} onChange={(e)=>{
                      const v = e.currentTarget.value; setItems(prev => prev.map(p => p.questionId === it.questionId ? { ...p, score: v } : p));
                    }} />
                  </div>
                  <div className="flex-1">
                    <Textarea placeholder="Nhận xét" value={it.comment} onChange={(e)=>{
                      const v = e.currentTarget.value; setItems(prev => prev.map(p => p.questionId === it.questionId ? { ...p, comment: v } : p));
                    }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button variant="secondary" onClick={saveAll} disabled={saving}>Lưu điểm</Button>
          <Button onClick={completeSubmission} disabled={saving}>Hoàn tất</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

