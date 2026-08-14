import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "store" | "management" | "viewer";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export function useRole() {
  return useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ensure_profile", { _full_name: null });
      if (error) throw error;
      return (data as Role) ?? "viewer";
    },
    staleTime: 5 * 60 * 1000,
  });
}

export const canWrite = (role?: Role | null) => role === "admin" || role === "store";

export function useList<T = Record<string, unknown>>(
  key: unknown[],
  table: string,
  build?: (q: ReturnType<typeof supabase.from>) => unknown,
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const base = supabase.from(table) as never;
      const q = build ? build(base) : (supabase.from(table) as never as { select: (s: string) => unknown }).select("*");
      const { data, error } = (await q) as { data: T[] | null; error: { message: string } | null };
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export const RAW = supabase;
