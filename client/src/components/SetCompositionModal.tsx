import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Trash2 } from "lucide-react";
import type { TestSet, Question } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export function SetCompositionModal({ setItem, onClose }: { setItem: TestSet; onClose: () => void }) {
  const [sectionFilter, setSectionFilter] = useState<string>("");
  const setId = setItem.id;

  const { data: mapping } = useQuery<{ mapping: { questionId: number; section: string; order: number; score: number | null }, question: Question }[]>({
    queryKey: ["/api/test-sets", setId, "questions"],
    queryFn: async () => {
      const res = await fetch(`/api/test-sets/${setId}/questions`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const { data: bank } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { questionId: number }) => {
      const res = await fetch(`/api/test-sets/${setId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId: payload.questionId, section: setItem.skill || "General" }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-sets", setId, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-sets"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const res = await fetch(`/api/test-sets/${setId}/questions/${questionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-sets", setId, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/test-sets"] });
    },
  });

  const patchMutation = useMutation({
    mutationFn: async ({ questionId, data }: { questionId: number, data: any }) => {
      const res = await fetch(`/api/test-sets/${setId}/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-sets", setId, "questions"] });
    },
  });

  function move(questionId: number, dir: -1 | 1) {
    if (!mapping) return;
    const idx = mapping.findIndex(m => m.mapping.questionId === questionId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= mapping.length) return;
    const a = mapping[idx];
    const b = mapping[target];
    patchMutation.mutate({ questionId: a.mapping.questionId, data: { order: b.mapping.order } });
    patchMutation.mutate({ questionId: b.mapping.questionId, data: { order: a.mapping.order } });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Quản lý câu hỏi trong bộ đề</DialogTitle>
          <DialogDescription>Thêm, xoá, sắp xếp và chỉnh điểm cho bộ đề: {setItem.title}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Ngân hàng câu hỏi</div>
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Lọc theo kĩ năng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="Reading">Reading</SelectItem>
                  <SelectItem value="Listening">Listening</SelectItem>
                  <SelectItem value="Speaking">Speaking</SelectItem>
                  <SelectItem value="Writing">Writing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-80 overflow-auto divide-y">
              {bank?.filter(q => !sectionFilter || q.skill === sectionFilter)?.map(q => (
                <div key={q.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{q.title || q.type}</div>
                    <div className="text-xs text-gray-500">{q.skill} · {q.type}</div>
                  </div>
                  <Button size="sm" onClick={() => addMutation.mutate({ questionId: parseInt(q.id, 10) })}>Thêm</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="font-semibold">Câu hỏi trong bộ đề</div>
            <div className="max-h-80 overflow-auto divide-y">
              {!mapping || mapping.length === 0 ? (
                <div className="text-sm text-gray-500 p-4">Chưa có câu hỏi.</div>
              ) : (
                mapping.map((m) => (
                  <div key={m.mapping.questionId} className="py-2 flex items-center gap-3">
                    <div className="w-8 text-center text-sm text-gray-500">{m.mapping.order}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{m.question.title || m.question.type}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Select defaultValue={m.mapping.section} onValueChange={(v)=> patchMutation.mutate({ questionId: m.mapping.questionId, data: { section: v } })}>
                          <SelectTrigger className="h-7 w-36"><SelectValue placeholder="Section" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Reading">Reading</SelectItem>
                            <SelectItem value="Listening">Listening</SelectItem>
                            <SelectItem value="Speaking">Speaking</SelectItem>
                            <SelectItem value="Writing">Writing</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                          <span>Điểm:</span>
                          <Input className="h-7 w-20" defaultValue={m.mapping.score ?? ''} onBlur={(e)=>{
                            const v = e.currentTarget.value ? parseFloat(e.currentTarget.value) : null;
                            patchMutation.mutate({ questionId: m.mapping.questionId, data: { score: v } });
                          }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={()=> move(m.mapping.questionId, -1)}><ChevronDown className="rotate-90 w-4 h-4"/></Button>
                      <Button variant="ghost" size="sm" onClick={()=> move(m.mapping.questionId, 1)}><ChevronDown className="-rotate-90 w-4 h-4"/></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={()=> removeMutation.mutate(m.mapping.questionId)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

