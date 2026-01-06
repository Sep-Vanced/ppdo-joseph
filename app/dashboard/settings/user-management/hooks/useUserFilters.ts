// app/dashboard/settings/user-management/hooks/useUserFilters.ts

import { useMemo, useState } from "react";
import { getDisplayName } from "@/lib/utils";

export interface User {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nameExtension?: string;
  email?: string;
  role?: "super_admin" | "admin" | "inspector" | "user"; // ✅ UPDATED: Added inspector
  departmentId?: string;
  departmentName?: string;
  position?: string;
  employeeId?: string;
  status?: "active" | "inactive" | "suspended";
  lastLogin?: number;
  createdAt?: number;
  suspensionReason?: string;
}

export interface UserFilters {
  search: string;
  role: "all" | "super_admin" | "admin" | "inspector" | "user"; // ✅ UPDATED: Added inspector
  status: "all" | "active" | "inactive" | "suspended";
  departmentId?: string;
}

export function useUserFilters(users: User[] | undefined) {
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "all",
    status: "all",
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let filtered = [...users];

    // Filter by role
    if (filters.role !== "all") {
      filtered = filtered.filter((user) => user.role === filters.role);
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((user) => user.status === filters.status);
    }

    // Filter by department
    if (filters.departmentId) {
      filtered = filtered.filter(
        (user) => user.departmentId === filters.departmentId
      );
    }

    // Filter by search query - use getDisplayName for consistent name handling
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter((user) => {
        const displayName = getDisplayName(user);
        return (
          displayName.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.departmentName?.toLowerCase().includes(query) ||
          user.position?.toLowerCase().includes(query) ||
          user.employeeId?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [users, filters]);

  const updateFilter = <K extends keyof UserFilters>(
    key: K,
    value: UserFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      role: "all",
      status: "all",
      departmentId: undefined,
    });
  };

  return {
    filters,
    filteredUsers,
    updateFilter,
    resetFilters,
  };
}