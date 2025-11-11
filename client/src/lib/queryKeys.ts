type MaybeFilters<T extends Record<string, unknown>> = {
  [K in keyof T]?: T[K] | undefined;
} | undefined;

export const queryKeys = {
  templates: () => ["/api/templates"] as const,
  testSets: (filters?: MaybeFilters<{ skill: string; status: string; search: string }>) =>
    filters && Object.keys(filters).length ? ["/api/test-sets", filters] as const : ["/api/test-sets"] as const,
  questions: (
    filters?: MaybeFilters<{ skill: string; type: string; search: string; page: number; size: number }>,
  ) => (filters && Object.keys(filters).length ? ["/api/questions", filters] as const : ["/api/questions"] as const),
};

export type QueryKey = ReturnType<(typeof queryKeys)[keyof typeof queryKeys]>;
