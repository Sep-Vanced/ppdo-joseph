// app/components/layout/RoleBadge.tsx

import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/rbac";

interface RoleBadgeProps {
  role?: "super_admin" | "admin" | "inspector" | "user";
}

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900";
      case "admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-200 dark:border-purple-900";
      case "inspector":
        return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-200 dark:border-orange-900";
      case "user":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-900";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getRoleColor(role)} font-medium text-xs px-2.5 py-0.5`}
    >
      {ROLE_LABELS[role] || role}
    </Badge>
  );
}