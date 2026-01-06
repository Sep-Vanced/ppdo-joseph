// convex/lib/rbac.ts
// Helper functions for Role-Based Access Control

import { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import { DataModel } from "../_generated/dataModel";
import { Doc } from "../_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  permissionKey: string
): Promise<boolean> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  if (!user || !user.role) {
    return false;
  }

  // Super admin has all permissions
  if (user.role === "super_admin") {
    return true;
  }

  // Get permission
  const permission = await ctx.db
    .query("permissions")
    .withIndex("key", (q) => q.eq("key", permissionKey))
    .first();

  if (!permission || !permission.isActive) {
    return false;
  }

  // Check user-specific override first
  const userPermission = await ctx.db
    .query("userPermissions")
    .withIndex("userAndPermission", (q) => 
      q.eq("userId", userId as any).eq("permissionId", permission._id)
    )
    .first();

  if (userPermission) {
    // Check if permission has expired
    if (userPermission.expiresAt && userPermission.expiresAt < Date.now()) {
      return false;
    }
    return userPermission.isGranted;
  }

  // Check role-based permission
  const rolePermission = await ctx.db
    .query("rolePermissions")
    .withIndex("roleAndPermission", (q) => 
      q.eq("role", user.role!).eq("permissionId", permission._id)
    )
    .first();

  if (rolePermission) {
    return rolePermission.isGranted;
  }

  // No permission found
  return false;
}

/**
 * Require a specific permission or throw error
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  permissionKey: string
): Promise<void> {
  const allowed = await hasPermission(ctx, userId, permissionKey);
  if (!allowed) {
    throw new Error(`Permission denied: ${permissionKey} required`);
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  permissionKeys: string[]
): Promise<boolean> {
  for (const key of permissionKeys) {
    if (await hasPermission(ctx, userId, key)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  permissionKeys: string[]
): Promise<boolean> {
  for (const key of permissionKeys) {
    if (!(await hasPermission(ctx, userId, key))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<boolean> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  return user?.role === "super_admin";
}

/**
 * Check if user is admin or super admin
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<boolean> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  return user?.role === "super_admin" || user?.role === "admin";
}

/**
 * Check if user is inspector
 */
export async function isInspector(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<boolean> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  return user?.role === "inspector";
}

/**
 * Check if user belongs to a specific department
 */
export async function isInDepartment(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  departmentId: string
): Promise<boolean> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  return user?.departmentId === departmentId;
}

/**
 * Check if user is head of a department
 */
export async function isDepartmentHead(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  departmentId?: string
): Promise<boolean> {
  if (departmentId) {
    const department = await ctx.db.get(departmentId as any) as Doc<"departments"> | null;
    return department?.headUserId === userId;
  } else {
    // Check if user is head of any department
    const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
    if (!user?.departmentId) {
      return false;
    }
    const department = await ctx.db.get(user.departmentId) as Doc<"departments"> | null;
    return department?.headUserId === userId;
  }
}

/**
 * Get user's effective permissions (role + overrides)
 */
export async function getUserEffectivePermissions(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<string[]> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  if (!user || !user.role) {
    return [];
  }

  // Super admin has all permissions
  if (user.role === "super_admin") {
    const allPermissions = await ctx.db
      .query("permissions")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .collect();
    return allPermissions.map(p => p.key);
  }

  // Get role-based permissions
  const rolePermissions = await ctx.db
    .query("rolePermissions")
    .withIndex("role", (q) => q.eq("role", user.role!))
    .collect();

  // Get user-specific overrides
  const userPermissions = await ctx.db
    .query("userPermissions")
    .withIndex("userId", (q) => q.eq("userId", userId as any))
    .collect();

  // Filter out expired permissions
  const now = Date.now();
  const validUserPermissions = userPermissions.filter(
    up => !up.expiresAt || up.expiresAt > now
  );

  // Build permission map
  const permissionMap = new Map<string, boolean>();

  // Add role permissions
  for (const rp of rolePermissions) {
    const permission = await ctx.db.get(rp.permissionId);
    if (permission && permission.isActive) {
      permissionMap.set(permission.key, rp.isGranted);
    }
  }

  // Override with user-specific permissions
  for (const up of validUserPermissions) {
    const permission = await ctx.db.get(up.permissionId);
    if (permission && permission.isActive) {
      permissionMap.set(permission.key, up.isGranted);
    }
  }

  // Return only granted permissions
  return Array.from(permissionMap.entries())
    .filter(([_, granted]) => granted)
    .map(([key, _]) => key);
}

/**
 * Check if user can access a department's data
 * Rules:
 * - Super admin: all departments
 * - Admin: their own department only
 * - Inspector: their own department only
 * - User: their own department only
 */
export async function canAccessDepartment(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  departmentId: string
): Promise<boolean> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  if (!user) {
    return false;
  }

  // Super admin can access all departments
  if (user.role === "super_admin") {
    return true;
  }

  // Admin, inspector, and users can only access their own department
  return user.departmentId === departmentId;
}

/**
 * Get accessible department IDs for a user
 * Returns all department IDs the user can access
 */
export async function getAccessibleDepartments(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<string[]> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  if (!user) {
    return [];
  }

  // Super admin can access all departments
  if (user.role === "super_admin") {
    const allDepartments = await ctx.db
      .query("departments")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .collect();
    return allDepartments.map(d => d._id);
  }

  // Admin, inspector, and users can only access their own department
  if (user.departmentId) {
    return [user.departmentId];
  }

  return [];
}

/**
 * Require user to be admin or super admin
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<void> {
  const isAdminUser = await isAdmin(ctx, userId);
  if (!isAdminUser) {
    throw new Error("Administrator access required");
  }
}

/**
 * Require user to be super admin
 */
export async function requireSuperAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<void> {
  const isSuperAdminUser = await isSuperAdmin(ctx, userId);
  if (!isSuperAdminUser) {
    throw new Error("Super administrator access required");
  }
}