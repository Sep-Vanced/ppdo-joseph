// types/user.types.ts - TypeScript types

import { Id } from "@/convex/_generated/dataModel";

export interface User {
  _id: string;
  // NEW: Individual name components
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nameExtension?: string;
  // DEPRECATED: Full name (auto-generated)
  name?: string;
  email?: string;
  role?: "super_admin" | "admin" | "inspector" | "user"; // ✅ UPDATED: Added inspector
  departmentId?: Id<"departments">;
  departmentName?: string;
  position?: string;
  employeeId?: string;
  status?: "active" | "inactive" | "suspended";
  lastLogin?: number;
  createdAt?: number;
  updatedAt?: number;
  suspensionReason?: string;
  image?: string;
  imageStorageId?: string;
  isLocked?: boolean;
  lockReason?: string;
  lockedAt?: number;
  failedLoginAttempts?: number;
  lastFailedLogin?: number;
}

export interface UserFormData {
  // NEW: Individual name components (REQUIRED for create, optional for update)
  firstName: string;
  lastName: string;
  middleName?: string;
  nameExtension?: string;
  
  email: string;
  role: "super_admin" | "admin" | "inspector" | "user"; // ✅ UPDATED: Added inspector
  departmentId?: Id<"departments">;
  departmentName?: string;
  position?: string;
  employeeId?: string;
  status?: "active" | "inactive" | "suspended";
  suspensionReason?: string;
}

export interface UserFilters {
  search: string;
  role: "all" | "super_admin" | "admin" | "inspector" | "user"; // ✅ UPDATED: Added inspector
  status: "all" | "active" | "inactive" | "suspended";
  departmentId?: string;
}

// Hook-specific User interface (used in useUserFilters)
export interface UserForFiltering {
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

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  userCount?: number;
}

// Helper function to format full name from components
export function formatFullName(
  firstName?: string,
  middleName?: string,
  lastName?: string,
  nameExtension?: string
): string {
  const parts: string[] = [];
  
  if (firstName) parts.push(firstName);
  if (middleName) parts.push(middleName);
  if (lastName) parts.push(lastName);
  if (nameExtension) parts.push(nameExtension);
  
  return parts.join(" ");
}

// Helper function to get display name (with fallback)
export function getDisplayName(user: User): string {
  // Try full name first
  if (user.name) return user.name;
  
  // Generate from components
  if (user.firstName || user.lastName) {
    return formatFullName(user.firstName, user.middleName, user.lastName, user.nameExtension);
  }
  
  // Fallback to email
  return user.email || "Unknown User";
}

// Helper function to get role display name
export function getRoleDisplayName(role?: string): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "inspector":
      return "Inspector"; // ✅ ADDED
    case "user":
      return "User";
    default:
      return "Unknown";
  }
}

// Helper function to get role badge color
export function getRoleBadgeColor(role?: string): string {
  switch (role) {
    case "super_admin":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "admin":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "inspector":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"; // ✅ ADDED
    case "user":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

// Helper function to get status display name
export function getStatusDisplayName(status?: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "suspended":
      return "Suspended";
    default:
      return "Unknown";
  }
}

// Helper function to get status badge color
export function getStatusBadgeColor(status?: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "inactive":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    case "suspended":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}