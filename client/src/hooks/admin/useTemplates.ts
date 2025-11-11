import { useQuery } from "@tanstack/react-query";
import type { QuestionTemplate } from "@shared/schema";
import { queryKeys } from "@/lib/queryKeys";

export function useTemplates() {
  const query = useQuery<QuestionTemplate[]>({
    queryKey: queryKeys.templates(),
  });

  return {
    ...query,
    templates: query.data ?? [],
  };
}
