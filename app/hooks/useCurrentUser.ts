// app/hooks/useCurrentUser.ts

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCurrentUser() {
  const user = useQuery(api.auth.getCurrentUser);
  
  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: user !== null,
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
    isInspector: user?.role === "inspector",
    role: user?.role,
    departmentId: user?.departmentId,
  };
}