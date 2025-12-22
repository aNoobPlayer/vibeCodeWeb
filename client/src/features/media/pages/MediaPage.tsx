import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaUploadButton } from "@/components/MediaUpload";
import { useMediaLibrary } from "@/features/media/hooks/useMediaLibrary";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { Volume2, Image, FileAudio, Eye, Trash2 } from "lucide-react";

export default function MediaPage() {
  const { mediaFiles } = useMediaLibrary();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleUploaded = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.media() });
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this media file?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok && res.status !== 204) {
        const message = await res.text().catch(() => "");
        throw new Error(message || `Delete failed (${res.status})`);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.media() });
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Media library</h1>
        <p className="text-gray-600">Manage audio and images for questions</p>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <MediaUploadButton onUploaded={handleUploaded} />
          <div className="flex gap-2">
            <Button variant="outline" data-testid="filter-audio" size="sm">
              <Volume2 className="w-4 h-4 mr-2" />
              Audio
            </Button>
            <Button variant="outline" data-testid="filter-image" size="sm">
              <Image className="w-4 h-4 mr-2" />
              Images
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Files are stored under the configured upload base and recorded in SQL when <code>DATABASE_URL</code> is
          configured on the server.
        </p>

        {!mediaFiles || mediaFiles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileAudio className="w-14 h-14 mx-auto mb-4" />
            <p className="text-lg mb-2">No media uploaded</p>
            <p className="text-sm">Upload audio or images to attach to questions</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4" data-testid="media-grid">
            {mediaFiles.map((media) => (
              <Card
                key={media.id}
                data-testid={`media-item-${media.id}`}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-3">
                  {media.type === "audio" ? (
                    <Volume2 className="w-10 h-10 text-gray-400" />
                  ) : (
                    <Image className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate" title={media.filename}>
                  {media.filename}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(media.uploadedAt).toLocaleDateString("vi-VN")}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    data-testid={`button-view-media-${media.id}`}
                    onClick={() => window.open(media.url, "_blank", "noopener,noreferrer")}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-media-${media.id}`}
                    onClick={() => handleDelete(media.id)}
                    disabled={deletingId === media.id}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
