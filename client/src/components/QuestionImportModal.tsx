import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function QuestionImportButton({ onImported }: { onImported?: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [format, setFormat] = useState<'json'|'csv'>('json');
  const [busy, setBusy] = useState(false);

  async function handleImport() {
    setBusy(true);
    try {
      let body: any = {};
      if (format === 'json') {
        let items: any;
        try { items = JSON.parse(text); } catch {
          alert('JSON không hợp lệ'); setBusy(false); return; }
        body = { items };
      } else {
        body = { csv: text };
      }
      const res = await fetch('/api/admin/questions/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      alert(`Đã nhập: ${data.imported}, lỗi: ${data.failed}`);
      setOpen(false); setText('');
      onImported?.();
    } catch (e) {
      console.error(e); alert('Nhập thất bại');
    } finally { setBusy(false); }
  }

  return (
    <>
      <Button variant="secondary" onClick={()=> setOpen(true)}>Nhập hàng loạt</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nhập câu hỏi hàng loạt</DialogTitle>
            <DialogDescription>Dán JSON (mảng các câu hỏi) hoặc CSV (cột: title,skill,type,content,options,correctAnswers,explanation,mediaUrl)</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="fmt" checked={format==='json'} onChange={()=> setFormat('json')} /> JSON</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="fmt" checked={format==='csv'} onChange={()=> setFormat('csv')} /> CSV</label>
          </div>
          <Textarea className="min-h-[240px]" placeholder={format==='json' ? '[{ "title": "...", "skill": "Reading", "type": "mcq_single", "content": "...", "options": ["A","B"], "correctAnswers": ["A"] }]' : 'title,skill,type,content,options,correctAnswers,explanation,mediaUrl\nTitle 1,Reading,mcq_single,Question text,A;B;C;D,A,,,\n'} value={text} onChange={(e)=> setText(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=> setOpen(false)}>Đóng</Button>
            <Button onClick={handleImport} disabled={busy || !text.trim()}>{busy ? 'Đang nhập...' : 'Nhập'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

