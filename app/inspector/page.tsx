// app/inspector/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { getDisplayName } from "@/types/user.types";

const InspectorPage = () => {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Inspector Dashboard
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Welcome back, {getDisplayName(currentUser)}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Your Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Full Name</p>
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {getDisplayName(currentUser)}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Email</p>
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {currentUser.email || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Role</p>
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Inspector
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Status</p>
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                {currentUser.status || "active"}
              </p>
            </div>
            {currentUser.position && (
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Position</p>
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  {currentUser.position}
                </p>
              </div>
            )}
            {currentUser.employeeId && (
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Employee ID</p>
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  {currentUser.employeeId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder for Inspector Features */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Inspector Features Coming Soon
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              This page will contain inspector-specific tools and functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectorPage;