import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { TestSet } from "@shared/schema";
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
import { SetCompositionModal } from "@/components/SetCompositionModal";
import { TestSetFormModal } from "@/components/TestSetFormModal";
import { TestSetPreviewModal } from "@/components/TestSetPreviewModal";
import { useToast } from "@/hooks/use-toast";
import { useTestSets } from "@/features/test-sets/hooks/useTestSets";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { Plus, Eye, Pencil, ClipboardList, Trash2, FolderOpen, Loader2 } from "lucide-react";

export default function TestSetsPage() {
  const { toast } = useToast();
  const [filterSkill, setFilterSkill] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [composeSet, setComposeSet] = useState<TestSet | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<TestSet | null>(null);
  const [setToDelete, setSetToDelete] = useState<TestSet | null>(null);
  const [previewSet, setPreviewSet] = useState<TestSet | null>(null);

  const { testSets } = useTestSets();

  const filteredSets = useMemo(() => {
    if (!testSets) return [];
    return testSets.filter((set) => {
      if (filterSkill && set.skill !== filterSkill) return false;
      if (filterStatus && set.status !== filterStatus) return false;
      if (searchQuery && !set.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [testSets, filterSkill, filterStatus, searchQuery]);
  const deleteSetMutation = useMutation<void, Error, TestSet>({
    mutationFn: async (set) => {
      await apiRequest(`/api/test-sets/${set.id}`, "DELETE");
    },
    onSuccess: (_, set) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSets() });
      toast({
        title: "Test set deleted",
        description: `"${set.title}" has been removed.`,
      });
      setSetToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test set",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage test sets</h1>
        <p className="text-gray-600">Create, edit and publish exam sets</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
           <Button
            data-testid="button-add-set"
            className="gap-2"
            onClick={() => {
              setEditingSet(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add test set
          </Button>
          <div className="flex gap-2 ml-auto">
            <Select
              value={filterSkill || "all"}
              onValueChange={(value) => setFilterSkill(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-40" data-testid="filter-skill">
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
              value={filterStatus || "all"}
              onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-40" data-testid="filter-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Input
              data-testid="input-search-sets"
              placeholder="Search test sets..."
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
                <TableHead>Test set name</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="w-52">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredSets || filteredSets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <FolderOpen className="w-10 h-10 mx-auto mb-3" />
                    <p>No test sets found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSets.map((set, index) => (
                  <TableRow key={set.id} data-testid={`set-row-${set.id}`} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{set.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          set.skill === "Reading"
                            ? "bg-blue-100 text-blue-700"
                            : set.skill === "Listening"
                              ? "bg-cyan-100 text-cyan-700"
                              : set.skill === "Speaking"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                        }
                      >
                        {set.skill}
                      </Badge>
                    </TableCell>
                    <TableCell>{set.questionCount}</TableCell>
                    <TableCell>
                      <Badge variant={set.status === "published" ? "default" : "secondary"}>
                        {set.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(set.updatedAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-preview-${set.id}`}
                          onClick={() => setPreviewSet(set)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${set.id}`}
                          onClick={() => {
                            setEditingSet(set);
                            setIsFormOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setComposeSet(set)}
                          data-testid={`button-manage-questions-${set.id}`}
                        >
                          <ClipboardList className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-${set.id}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setSetToDelete(set)}
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
      {composeSet && (
        <SetCompositionModal setItem={composeSet} onClose={() => setComposeSet(null)} />
      )}
      <TestSetFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingSet(null);
          }
        }}
        testSet={editingSet ?? undefined}
      />
      <TestSetPreviewModal
        open={Boolean(previewSet)}
        onOpenChange={(open) => {
          if (!open) setPreviewSet(null);
        }}
        testSet={previewSet}
      />
      <AlertDialog open={!!setToDelete} onOpenChange={(open) => !open && setSetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{setToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => setToDelete && deleteSetMutation.mutate(setToDelete)}
              disabled={deleteSetMutation.isPending}
            >
              {deleteSetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
