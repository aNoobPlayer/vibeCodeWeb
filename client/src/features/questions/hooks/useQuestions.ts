import { useQuery } from "@tanstack/react-query";
import type { QuestionsResponse } from "@/types/api";
import { queryKeys } from "@/lib/queryKeys";

type QuestionFilters = {
  skill?: string;
  type?: string;
  search?: string;
  page?: number;
  size?: number;
};

export function useQuestions(filters?: QuestionFilters) {
  const query = useQuery<QuestionsResponse>({
    queryKey: queryKeys.questions(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.skill && filters.skill !== "all") params.set("skill", filters.skill);
      if (filters?.type && filters.type !== "all") params.set("type", filters.type);
      if (filters?.search) params.set("q", filters.search);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.size) params.set("size", String(filters.size));
      const qs = params.toString();
      const url = qs ? `/api/questions?${qs}` : "/api/questions";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  return {
    ...query,
    questionsResponse: query.data ?? null,
    questions: query.data?.items ?? [],
  };
}
