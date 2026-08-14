/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Loosely typed client for generic ERP grids/reports. */
export const db = supabase as any;

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
      const { data, error } = await db.rpc("ensure_profile", {});
      if (error) throw error;
      return (data as Role) ?? "viewer";
    },
    staleTime: 5 * 60 * 1000,
  });
}

export const canWrite = (role?: Role | null) => role === "admin" || role === "store";

/** Generic list query: `useRows("jobbers", ["jobbers"], q => q.order("code"))` */
export function useRows<T = any>(
  table: string,
  key: unknown[],
  build?: (q: any) => any,
  select = "*",
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      let q = db.from(table).select(select);
      if (build) q = build(q);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (keys?: unknown[][]) => {
    if (!keys) return qc.invalidateQueries();
    keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  };
}
