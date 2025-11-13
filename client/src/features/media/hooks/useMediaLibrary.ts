import { useQuery } from "@tanstack/react-query";
import type { Media } from "@shared/schema";
import { queryKeys } from "@/lib/queryKeys";

type MediaFilters = {
  type?: string;
  search?: string;
};

export function useMediaLibrary(filters?: MediaFilters) {
  const query = useQuery<Media[]>({
    queryKey: queryKeys.media(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.search) params.set("search", filters.search);
      const qs = params.toString();
      const url = qs ? `/api/media?${qs}` : "/api/media";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  return {
    ...query,
    mediaFiles: query.data ?? [],
  };
}
