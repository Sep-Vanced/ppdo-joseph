// app/dashboard/components/Header.tsx

"use client";

import { useState } from "react";
import { useSidebar } from "../contexts/SidebarContext";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { AccountModal } from "./account/AccountModal";
import { UserDropdown } from "./header/UserDropdown";
import { NotificationsDropdown } from "./header/NotificationsDropdown";
import { EmailDropdown } from "./header/EmailDropdown";
import { getDisplayName } from "@/lib/utils";

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ onSearchChange, searchQuery }: HeaderProps) {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const { isMinimized, toggleMinimize } = useSidebar();

  // ✅ Use your existing useCurrentUser hook - FULLY DYNAMIC with image support!
  const { user, isLoading } = useCurrentUser();
  
  // Extract user data with proper name handling
  const userName = user ? getDisplayName(user) : "User";

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <header className="sticky top-0 z-30 bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="hidden md:flex p-2 rounded-lg">
                <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // If no user data, show minimal header
  if (!user) {
    return (
      <header className="sticky top-0 z-30 bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={toggleMinimize}
                className="hidden md:flex p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
              >
                <svg
                  className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMinimized ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  )}
                </svg>
              </button>
              <div className="flex flex-col">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Welcome back
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-4">
            {/* Left section - Sidebar Toggle, Welcome and User Name */}
            <div className="flex items-center gap-4 flex-1">
              {/* Sidebar Toggle Button */}
              <button
                onClick={toggleMinimize}
                className="hidden md:flex p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
              >
                <svg
                  className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMinimized ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  )}
                </svg>
              </button>

              {/* Welcome Message */}
              <div className="flex flex-col">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Welcome back,
                </span>
                <span
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                  style={{ fontFamily: "var(--font-cinzel), serif" }}
                >
                  {userName}
                </span>
              </div>
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center gap-3">
              {/* Email Dropdown */}
              <EmailDropdown />

              {/* Notifications Dropdown */}
              <NotificationsDropdown />

              {/* User Dropdown with Dynamic Avatar */}
              <UserDropdown
                user={user}
                onOpenAccountModal={() => setShowAccountModal(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Account Modal - Portal style overlay */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl">
            <AccountModal onClose={() => setShowAccountModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}