// app/components/layout/DashboardHeader.tsx

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { getDisplayName, getUserInitials } from "@/lib/utils";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { RoleBadge } from "./RoleBadge";

export function DashboardHeader() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = () => {
    // Implement sign out logic
    router.push("/");
  };

  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </header>
    );
  }

  // Get display name and initials using utility functions
  const displayName = user ? getDisplayName(user) : "User";
  const userInitials = user ? getUserInitials(user) : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo or Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {/* Role Badge */}
          {user?.role && <RoleBadge role={user.role as "super_admin" | "admin" | "inspector" | "user"} />}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image} alt={displayName} />
                  <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {displayName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user?.email}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}