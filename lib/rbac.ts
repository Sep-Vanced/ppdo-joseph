// lib/rbac.ts - Client-side RBAC helpers

import { User } from "../types/user.types";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  INSPECTOR: "inspector", // ✅ Already present
  USER: "user",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  inspector: "Inspector", // ✅ Already present
  user: "User",
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin: "destructive",
  admin: "default",
  inspector: "secondary", // ✅ Already present
  user: "secondary",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
};

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  user: 1,
  inspector: 2, // ✅ ADDED: Inspector between user and admin
  admin: 3,
  super_admin: 4,
};

export function canManageUsers(role?: string): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

export function canManageRole(
  currentUserRole?: string,
  targetRole?: string
): boolean {
  if (currentUserRole === ROLES.SUPER_ADMIN) return true;
  if (currentUserRole === ROLES.ADMIN) {
    return targetRole !== ROLES.SUPER_ADMIN;
  }
  return false;
}

export function canDeleteUser(currentUser?: any, targetUser?: any): boolean {
  if (!currentUser || !targetUser) return false;
  if (currentUser._id === targetUser._id) return false;

  if (currentUser.role === ROLES.SUPER_ADMIN) return true;
  if (currentUser.role === ROLES.ADMIN) {
    return targetUser.role !== ROLES.SUPER_ADMIN;
  }
  return false;
}

export function canEditUser(currentUser?: any, targetUser?: any): boolean {
  if (!currentUser || !targetUser) return false;
  if (currentUser._id === targetUser._id) return true; // Can edit self

  return canDeleteUser(currentUser, targetUser);
}

export function isInspector(role?: string): boolean {
  return role === ROLES.INSPECTOR;
}

export function canAccessDashboard(role?: string): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.USER;
}

export function canAccessInspector(role?: string): boolean {
  return role === ROLES.INSPECTOR;
}

/**
 * Check if role A can manage role B based on hierarchy
 * @param roleA - The role attempting the action
 * @param roleB - The target role
 * @returns true if roleA can manage roleB
 */
export function canManageRoleByHierarchy(
  roleA: "super_admin" | "admin" | "inspector" | "user",
  roleB: "super_admin" | "admin" | "inspector" | "user"
): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

/**
 * Get all roles that a user with the given role can assign
 * @param role - Current user's role
 * @returns Array of roles that can be assigned
 */
export function getAssignableRoles(
  role: "super_admin" | "admin" | "inspector" | "user"
): ("super_admin" | "admin" | "inspector" | "user")[] {
  const hierarchy = ROLE_HIERARCHY[role];
  
  return (Object.keys(ROLE_HIERARCHY) as Array<"super_admin" | "admin" | "inspector" | "user">)
    .filter(r => ROLE_HIERARCHY[r] < hierarchy);
}

/**
 * Role permissions matrix
 */
export const ROLE_PERMISSIONS = {
  super_admin: {
    users: {
      create: true,
      read: true,
      update: true,
      delete: true,
      manage_roles: true,
      manage_permissions: true,
    },
    departments: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    projects: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    budgets: {
      create: true,
      read: true,
      update: true,
      delete: true,
      approve: true,
    },
    reports: {
      view_all: true,
      export: true,
    },
  },
  admin: {
    users: {
      create: true,
      read: true, // Within department
      update: true, // Within department
      delete: false,
      manage_roles: false,
      manage_permissions: false,
    },
    departments: {
      create: false,
      read: true, // Own department only
      update: false,
      delete: false,
    },
    projects: {
      create: true,
      read: true,
      update: true,
      delete: false,
    },
    budgets: {
      create: true,
      read: true,
      update: true,
      delete: false,
      approve: true,
    },
    reports: {
      view_all: false, // Department only
      export: true,
    },
  },
  inspector: { // ✅ ADDED: Full inspector permissions
    users: {
      create: false,
      read: true, // Can view user info
      update: false,
      delete: false,
      manage_roles: false,
      manage_permissions: false,
    },
    departments: {
      create: false,
      read: true,
      update: false,
      delete: false,
    },
    projects: {
      create: false,
      read: true, // Can view all projects
      update: true, // Can update inspection status
      delete: false,
    },
    budgets: {
      create: false,
      read: true, // Can view budget data
      update: false,
      delete: false,
      approve: false,
    },
    reports: {
      view_all: true, // Can view all inspection reports
      export: true, // Can export reports
    },
  },
  user: {
    users: {
      create: false,
      read: false,
      update: false, // Can only update own profile
      delete: false,
      manage_roles: false,
      manage_permissions: false,
    },
    departments: {
      create: false,
      read: true, // Can view own department
      update: false,
      delete: false,
    },
    projects: {
      create: false,
      read: true, // Can view assigned projects
      update: false,
      delete: false,
    },
    budgets: {
      create: false,
      read: true, // Can view relevant budget data
      update: false,
      delete: false,
      approve: false,
    },
    reports: {
      view_all: false,
      export: false,
    },
  },
};

/**
 * Check if a role has a specific permission
 * @param role - User's role
 * @param resource - Resource type (e.g., 'users', 'projects')
 * @param action - Action type (e.g., 'create', 'read')
 * @returns true if role has permission
 */
export function hasPermission(
  role: "super_admin" | "admin" | "inspector" | "user",
  resource: keyof typeof ROLE_PERMISSIONS.super_admin,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  const resourcePermissions = permissions[resource] as Record<string, boolean>;
  return resourcePermissions?.[action] ?? false;
}