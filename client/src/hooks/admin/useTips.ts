import { useQuery } from "@tanstack/react-query";
import type { Tip } from "@shared/schema";
import { queryKeys } from "@/lib/queryKeys";

type TipFilters = {
  skill?: string;
  status?: string;
  search?: string;
};

export function useTips(filters?: TipFilters) {
  const query = useQuery<Tip[]>({
    queryKey: queryKeys.tips(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.skill) params.set("skill", filters.skill);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      const qs = params.toString();
      const url = qs ? `/api/tips?${qs}` : "/api/tips";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  return {
    ...query,
    tips: query.data ?? [],
  };
}
