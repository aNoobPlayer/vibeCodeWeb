import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  onImported?: () => void;
};

export function QuestionExcelImportButton({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setMessage(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/questions/import-excel", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setMessage(`Imported ${result.imported} questions. Failed: ${result.failed}`);
      onImported?.();
      setFile(null);
    } catch (error: any) {
      setMessage(error?.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Import Excel
      </Button>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setFile(null);
          setMessage(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import questions from Excel</DialogTitle>
            <DialogDescription>
              Upload an .xlsx or .xls file with columns: title, skill, type, content, options, correctAnswers, explanation, mediaUrl, points, tags.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Excel file</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
            {message && <p className="text-sm text-gray-600">{message}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || busy}>
                {busy ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
