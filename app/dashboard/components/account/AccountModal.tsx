// app/dashboard/components/account/AccountModal.tsx

"use client";

import { useState } from "react";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { ProfileDetailsTab } from "./ProfileDetailsTab";

interface AccountModalProps {
  onClose: () => void;
}

export function AccountModal({ onClose }: AccountModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Account Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          <div className="h-4 w-32 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Account Settings
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "security"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Security
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "profile" && <ProfileDetailsTab user={user} />}
        {activeTab === "security" && (
          <div className="p-6">
            <p className="text-zinc-600 dark:text-zinc-400">
              Security settings coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}