import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "manager" | "agent" | "broadcaster" | "referenced";

interface UserRoleInfo {
  role: AppRole | null;
  companyId: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hasRole: (r: AppRole) => boolean;
}

export function useUserRole(): UserRoleInfo {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("company_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      setCompanyId(profile?.company_id ?? null);

      if (roles && roles.length > 0) {
        // Priority order: admin > manager > agent > broadcaster > referenced
        const priority: AppRole[] = ["admin", "manager", "agent", "broadcaster", "referenced"];
        const userRoles = roles.map((r) => r.role as AppRole);
        const highestRole = priority.find((p) => userRoles.includes(p)) ?? "agent";
        setRole(highestRole);
      } else {
        setRole("agent");
      }
      setLoading(false);
    };

    load();
  }, [user]);

  // SuperAdmin is determined by checking if user has admin role AND
  // has access to multiple companies (checked server-side via RLS).
  // For now, admin of any company is treated as tenant admin.
  // True SuperAdmin would be checked via a separate superadmin flag or special logic.
  const isAdmin = role === "admin";

  return {
    role,
    companyId,
    loading,
    isSuperAdmin: isAdmin, // In production, this should check a dedicated superadmin table/flag
    isAdmin,
    hasRole: (r: AppRole) => role === r,
  };
}
