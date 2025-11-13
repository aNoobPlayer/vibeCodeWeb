import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GradingModal } from "@/components/GradingModal";

export default function GradingPage() {
  const [filterSkill, setFilterSkill] = useState<string>("all");
  const { data: queue, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/submissions", filterSkill],
    queryFn: async () => {
      const skillParam = filterSkill === "all" ? "" : `&skill=${encodeURIComponent(filterSkill)}`;
      const url = `/api/admin/submissions?status=submitted${skillParam}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const [active, setActive] = useState<any | null>(null);

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grading</h1>
        <p className="text-gray-600">Submissions awaiting Writing/Speaking review</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-2 mb-4">
          <Select value={filterSkill} onValueChange={setFilterSkill}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Writing">Writing</SelectItem>
              <SelectItem value="Speaking">Speaking</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Set</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!queue || queue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No submissions require grading
                  </TableCell>
                </TableRow>
              ) : (
                queue.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.userId}</TableCell>
                    <TableCell>{row.setId}</TableCell>
                    <TableCell>{row.submitTime ? new Date(row.submitTime).toLocaleString("vi-VN") : "-"}</TableCell>
                    <TableCell>{row.items}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setActive(row)}>
                        Grade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {active && (
        <GradingModal
          submission={active}
          onClose={() => setActive(null)}
          onDone={() => {
            setActive(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
