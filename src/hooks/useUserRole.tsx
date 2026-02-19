import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Role vem do user object do auth
      setRole(user.role || 'user');
    } else {
      setRole(null);
    }
    setLoading(false);
  }, [user]);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isSuperAdmin: role === 'super_admin',
    isAgent: role === 'agent' || role === 'admin' || role === 'super_admin',
  };
}
