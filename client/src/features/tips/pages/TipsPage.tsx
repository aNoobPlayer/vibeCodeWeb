import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Tip } from "@shared/schema";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { TipFormModal } from "@/components/TipFormModal";
import { useToast } from "@/hooks/use-toast";
import { useTips } from "@/features/tips/hooks/useTips";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { Lightbulb, Plus, Pencil, Eye, Trash2 } from "lucide-react";

export default function TipsPage() {
  const [filterSkill, setFilterSkill] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTipFormOpen, setIsTipFormOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [viewTip, setViewTip] = useState<Tip | null>(null);
  const [tipToDelete, setTipToDelete] = useState<Tip | null>(null);
  const { toast } = useToast();

  const { tips } = useTips({
    skill: filterSkill !== "all" ? filterSkill : undefined,
    search: searchQuery || undefined,
  });

  const filteredTips = useMemo(() => {
    if (!tips) return [];
    return tips.filter((tip) => {
      if (filterSkill !== "all" && tip.skill !== filterSkill) return false;
      if (searchQuery && !tip.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tips, filterSkill, searchQuery]);

  const deleteTip = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/tips/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tips() });
      toast({ title: "Tip deleted", description: "The tip has been removed." });
      setTipToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Unable to delete tip",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (tipToDelete?.id) {
      deleteTip.mutate(tipToDelete.id);
    }
  };

  const badgeClassForSkill = (skill: string) => {
    switch (skill) {
      case "Reading":
        return "bg-blue-100 text-blue-700";
      case "Listening":
        return "bg-cyan-100 text-cyan-700";
      case "Speaking":
        return "bg-green-100 text-green-700";
      case "Writing":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Study tips & guides</h1>
        <p className="text-gray-600">Create learning resources for students</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            data-testid="button-add-tip"
            className="gap-2"
            onClick={() => {
              setEditingTip(null);
              setIsTipFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add new tip
          </Button>
          <div className="flex gap-2 ml-auto">
            <Select value={filterSkill} onValueChange={setFilterSkill}>
              <SelectTrigger className="w-40" data-testid="filter-tip-skill">
                <SelectValue placeholder="All skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="GrammarVocabulary">Grammar &amp; Vocabulary</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
            <Input
              data-testid="input-search-tips"
              placeholder="Search tips..."
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
                <TableHead>Title</TableHead>
                <TableHead>Applicable skill</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    <Lightbulb className="w-10 h-10 mx-auto mb-3" />
                    <p>No tips found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTips.map((tip, index) => (
                  <TableRow key={tip.id} data-testid={`tip-row-${tip.id}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{tip.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={badgeClassForSkill(tip.skill)}>
                        {tip.skill}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tip.status === "published" ? "default" : "secondary"}>
                        {tip.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(tip.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-tip-${tip.id}`}
                          onClick={() => {
                            setEditingTip(tip);
                            setIsTipFormOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-view-tip-${tip.id}`}
                          onClick={() => setViewTip(tip)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-tip-${tip.id}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setTipToDelete(tip)}
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

      <TipFormModal
        open={isTipFormOpen}
        tip={editingTip}
        onOpenChange={(open) => {
          setIsTipFormOpen(open);
          if (!open) {
            setEditingTip(null);
          }
        }}
      />

      <Dialog
        open={Boolean(viewTip)}
        onOpenChange={(open) => {
          if (!open) setViewTip(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewTip?.title}</DialogTitle>
            <DialogDescription>
              {viewTip ? `${viewTip.skill} · ${viewTip.priority ?? "medium"} priority` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              {viewTip && new Date(viewTip.createdAt).toLocaleString("vi-VN")}
            </div>
            <p className="whitespace-pre-wrap text-gray-800">{viewTip?.content}</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(tipToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteTip.isPending) setTipToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tip</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected tip will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTip.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteTip.isPending}
            >
              {deleteTip.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
