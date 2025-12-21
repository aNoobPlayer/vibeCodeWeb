import { useQuery } from "@tanstack/react-query";
import type { Lesson } from "@shared/schema";
import { queryKeys } from "@/lib/queryKeys";

type LessonFilters = {
  skill?: string;
  status?: string;
  search?: string;
  courseId?: string;
};

export function useLessons(filters?: LessonFilters) {
  const query = useQuery<Lesson[]>({
    queryKey: queryKeys.lessons(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.skill) params.set("skill", filters.skill);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.courseId) params.set("courseId", filters.courseId);
      const qs = params.toString();
      const url = qs ? `/api/lessons?${qs}` : "/api/lessons";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  return {
    ...query,
    lessons: query.data ?? [],
  };
}
