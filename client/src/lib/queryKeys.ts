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
  tips: (filters?: MaybeFilters<{ skill: string; status: string; search: string }>) =>
    filters && Object.keys(filters).length ? ["/api/tips", filters] as const : ["/api/tips"] as const,
  media: (filters?: MaybeFilters<{ type: string; search: string }>) =>
    filters && Object.keys(filters).length ? ["/api/media", filters] as const : ["/api/media"] as const,
  adminUsers: () => ["/api/admin/users"] as const,
};

export type QueryKey = ReturnType<(typeof queryKeys)[keyof typeof queryKeys]>;
