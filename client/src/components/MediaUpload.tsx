import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MediaUploadResult = {
  id?: string;
  url?: string;
  type?: string;
  filename?: string;
  size?: number;
};

type MediaUploadButtonProps = {
  onUploaded?: (payload?: MediaUploadResult | null) => void;
  accept?: string;
  endpoint?: string;
  buttonText?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
};

export function MediaUploadButton({
  onUploaded,
  accept = "image/*,audio/*,video/*",
  endpoint = "/api/admin/media/upload",
  buttonText = "Upload media",
  dialogTitle = "Upload media",
  dialogDescription = "Choose an image, audio clip, or video to upload.",
  buttonVariant = "secondary",
  buttonSize = "default",
}: MediaUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = next;
    setPreviewUrl(next);
    return () => {
      if (previewUrlRef.current === next) {
        URL.revokeObjectURL(next);
        previewUrlRef.current = null;
      }
    };
  }, [file]);

  const fileKind = useMemo(() => {
    if (!file) return "file";
    if (file.type.startsWith("image")) return "image";
    if (file.type.startsWith("audio")) return "audio";
    if (file.type.startsWith("video")) return "video";
    return "file";
  }, [file]);

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(endpoint, { method: "POST", credentials: "include", body: form });
      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || `Upload failed (${res.status})`);
      }
      const payload: MediaUploadResult = await res.json().catch(() => ({}));
      const nextUrl = typeof payload?.url === "string" ? payload.url : null;
      setUploadedUrl(nextUrl);
      setFile(null);
      onUploaded?.(nextUrl ? { ...payload, url: nextUrl } : null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
      >
        {buttonText}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setFile(null);
            setUploadedUrl(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="file"
              accept={accept}
              onChange={(e) => {
                setUploadedUrl(null);
                setError(null);
                setFile(e.currentTarget.files?.[0] || null);
              }}
            />
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            {file && (
              <Card className="p-3">
                <div className="text-sm font-semibold text-gray-800">{file.name}</div>
                <div className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</div>
                {previewUrl && fileKind === "image" && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                    <img src={previewUrl} alt={file.name} className="h-40 w-full object-cover" />
                  </div>
                )}
                {previewUrl && fileKind === "audio" && (
                  <audio className="mt-3 w-full" controls src={previewUrl}>
                    Your browser does not support the audio element.
                  </audio>
                )}
                {previewUrl && fileKind === "video" && (
                  <video className="mt-3 w-full rounded-lg" controls src={previewUrl}>
                    Your browser does not support the video element.
                  </video>
                )}
                {previewUrl && fileKind === "file" && (
                  <div className="mt-3 rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">
                    Preview not available for this file type.
                  </div>
                )}
              </Card>
            )}
            {uploadedUrl && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Uploaded: {uploadedUrl}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={handleUpload} disabled={busy || !file}>
              {busy ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
