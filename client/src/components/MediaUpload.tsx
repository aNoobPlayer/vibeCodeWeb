import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function MediaUploadButton({ onUploaded }: { onUploaded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/media/upload', { method: 'POST', credentials: 'include', body: form });
      if (!res.ok) throw new Error(await res.text());
      setOpen(false); setFile(null);
      onUploaded?.();
    } catch (e) {
      console.error(e);
      alert('Upload failed');
    } finally { setBusy(false); }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Tải media</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tải media</DialogTitle>
            <DialogDescription>Chọn ảnh hoặc audio để tải lên.</DialogDescription>
          </DialogHeader>
          <input type="file" onChange={(e)=> setFile(e.currentTarget.files?.[0] || null)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=> setOpen(false)}>Đóng</Button>
            <Button onClick={handleUpload} disabled={busy || !file}>{busy ? 'Đang tải...' : 'Tải lên'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

