// app/dashboard/components/header/UserDropdown.tsx

"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { useAccentColor } from "../../contexts/AccentColorContext";
import SignOutButton from "@/app/components/SignOutButton";
import { getDisplayName, getUserInitials } from "@/lib/utils";

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nameExtension?: string;
  name?: string;
  email?: string;
  image?: string;
  imageStorageId?: string;
  role?: string;
}

interface UserDropdownProps {
  user: User;
  onOpenAccountModal: () => void;
}

export function UserDropdown({ user, onOpenAccountModal }: UserDropdownProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hexInputValue, setHexInputValue] = useState<string>("");
  const { accentColorValue, setAccentColor } = useAccentColor();

  // Extract user data using utility functions
  const userEmail = user.email || "";
  const userName = getDisplayName(user);
  const userRole = user.role || "user";
  const userImage = user.image;
  const userInitials = getUserInitials(user);

  // Helper function to format role for display
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Administrator";
      case "admin":
        return "Administrator";
      case "inspector":
        return "Inspector";
      case "user":
        return "User";
      default:
        return "User";
    }
  };

  // Sync hex input with accent color value
  useEffect(() => {
    setHexInputValue(accentColorValue.toUpperCase());
  }, [accentColorValue]);

  // Handle opening account modal
  const handleOpenAccountModal = () => {
    setShowUserMenu(false);
    onOpenAccountModal();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {/* Avatar - Dynamic Image or Initials */}
        {userImage ? (
          <img
            src={userImage}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover border-2 border-transparent"
            style={{ borderColor: accentColorValue }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: accentColorValue }}
          >
            <span className="text-white font-medium text-sm">
              {userInitials}
            </span>
          </div>
        )}

        <span className="hidden sm:block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {userEmail || userName}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform ${
            showUserMenu ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showUserMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-[#f8f8f8] dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-50">
            {/* User Info Section */}
            <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {userEmail || userName}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {getRoleDisplay(userRole)}
              </p>
            </div>

            {/* Manage Account Button */}
            <button
              onClick={handleOpenAccountModal}
              className="cursor-pointer w-full px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-3"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Manage Account
            </button>

            {/* Accent Color Picker */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColorValue}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 cursor-pointer transition-all hover:scale-105"
                    style={{
                      borderColor: accentColorValue,
                    }}
                    aria-label="Select accent color"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-mono text-zinc-600 dark:text-zinc-400"
                        style={{ color: accentColorValue }}
                      >
                        {accentColorValue.toUpperCase()}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={hexInputValue}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        if (/^#[0-9A-F]{0,6}$/i.test(value)) {
                          setHexInputValue(value);
                          if (
                            value.length === 7 &&
                            /^#[0-9A-F]{6}$/i.test(value)
                          ) {
                            setAccentColor(value);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.currentTarget.value;
                        if (/^#[0-9A-F]{6}$/i.test(value)) {
                          setAccentColor(value);
                        } else {
                          setHexInputValue(accentColorValue.toUpperCase());
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const value = e.currentTarget.value;
                          if (/^#[0-9A-F]{6}$/i.test(value)) {
                            setAccentColor(value);
                          } else {
                            setHexInputValue(accentColorValue.toUpperCase());
                          }
                        }
                      }}
                      placeholder="#000000"
                      className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors"
                      style={
                        {
                          "--tw-ring-color": accentColorValue,
                        } as React.CSSProperties
                      }
                      aria-label="Hex color code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Theme
                </p>
                <ThemeToggle />
              </div>
            </div>

            {/* Sign Out Button */}
            <SignOutButton />
          </div>
        </>
      )}
    </div>
  );
}