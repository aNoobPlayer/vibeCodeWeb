import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export type AdminUserSummary = {
  id: string;
  username: string;
  role: "admin" | "student";
  isActive: boolean;
  createdAt?: string | null;
  lastLogin?: string | null;
};

export function useAdminUsers() {
  const query = useQuery<AdminUserSummary[]>({
    queryKey: queryKeys.adminUsers(),
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  return {
    ...query,
    users: query.data ?? [],
  };
}
