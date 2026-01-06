// app/dashboard/settings/user-management/components/UserRoleBadge.tsx

import { Badge } from "@/components/ui/badge";

interface UserRoleBadgeProps {
  role?: "super_admin" | "admin" | "inspector" | "user"; // ✅ UPDATED: Added inspector, removed viewer
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  if (!role) return <span className="text-sm text-zinc-500 dark:text-zinc-400">—</span>;

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "super_admin":
        return {
          label: "Super Admin",
          color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-200 dark:border-purple-900"
        };
      case "admin":
        return {
          label: "Admin",
          color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-900"
        };
      case "inspector":
        return {
          label: "Inspector", // ✅ ADDED
          color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-200 dark:border-orange-900"
        };
      case "user":
        return {
          label: "User",
          color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-900"
        };
      default:
        return {
          label: role,
          color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
        };
    }
  };

  const config = getRoleConfig(role);

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} font-medium text-xs px-2.5 py-1`}
    >
      {config.label}
    </Badge>
  );
}