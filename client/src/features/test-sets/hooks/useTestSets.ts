import { useQuery } from "@tanstack/react-query";
import type { TestSet } from "@shared/schema";
import { queryKeys } from "@/lib/queryKeys";

type TestSetFilters = {
  skill?: string;
  status?: string;
  search?: string;
};

export function useTestSets(filters?: TestSetFilters) {
  const query = useQuery<TestSet[]>({
    queryKey: queryKeys.testSets(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.skill) params.set("skill", filters.skill);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      const qs = params.toString();
      const url = qs ? `/api/test-sets?${qs}` : "/api/test-sets";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  return {
    ...query,
    testSets: query.data ?? [],
  };
}
