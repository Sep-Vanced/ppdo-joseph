// convex/permissions.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Check if current user has a specific permission
 */
export const checkPermission = query({
  args: {
    permissionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { hasPermission: false, reason: "Not authenticated" };
    }

    const user = await ctx.db.get(userId);
    if (!user || !user.role) {
      return { hasPermission: false, reason: "User role not set" };
    }

    // Super admin has all permissions
    if (user.role === "super_admin") {
      return { hasPermission: true };
    }

    // Check for user-specific permission override first
    const permission = await ctx.db
      .query("permissions")
      .withIndex("key", (q) => q.eq("key", args.permissionKey))
      .first();

    if (!permission) {
      return { hasPermission: false, reason: "Permission not found" };
    }

    // Check user-specific override
    const userPermission = await ctx.db
      .query("userPermissions")
      .withIndex("userAndPermission", (q) => 
        q.eq("userId", userId).eq("permissionId", permission._id)
      )
      .first();

    if (userPermission) {
      // Check if permission has expired
      if (userPermission.expiresAt && userPermission.expiresAt < Date.now()) {
        return { hasPermission: false, reason: "Permission expired" };
      }
      return { hasPermission: userPermission.isGranted };
    }

    // Check role-based permission
    const rolePermission = await ctx.db
      .query("rolePermissions")
      .withIndex("roleAndPermission", (q) => 
        q.eq("role", user.role!).eq("permissionId", permission._id)
      )
      .first();

    if (rolePermission) {
      return { hasPermission: rolePermission.isGranted };
    }

    // No permission found, default to false
    return { hasPermission: false, reason: "Permission not granted" };
  },
});

/**
 * Get all permissions for current user
 */
export const getUserPermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
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
      .withIndex("userId", (q) => q.eq("userId", userId))
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
  },
});

/**
 * List all permissions (super_admin or admin only)
 */
export const list = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    let permissions;
    
    if (args.category !== undefined) {
      permissions = await ctx.db
        .query("permissions")
        .withIndex("category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      permissions = await ctx.db
        .query("permissions")
        .collect();
    }

    return permissions;
  },
});

/**
 * Create a new permission (super_admin only)
 */
export const create = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Not authorized - super_admin access required");
    }

    // Check if permission key already exists
    const existing = await ctx.db
      .query("permissions")
      .withIndex("key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      throw new Error("Permission key already exists");
    }

    const now = Date.now();
    
    const permissionId = await ctx.db.insert("permissions", {
      key: args.key,
      name: args.name,
      description: args.description,
      category: args.category,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });

    return permissionId;
  },
});

/**
 * Update a permission (super_admin only)
 */
export const update = mutation({
  args: {
    id: v.id("permissions"),
    key: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Not authorized - super_admin access required");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Permission not found");
    }

    // Check if key is being changed and conflicts
    if (args.key !== existing.key) {
      const conflicting = await ctx.db
        .query("permissions")
        .withIndex("key", (q) => q.eq("key", args.key))
        .first();

      if (conflicting && conflicting._id !== args.id) {
        throw new Error("Permission key already exists");
      }
    }

    const now = Date.now();
    
    await ctx.db.patch(args.id, {
      key: args.key,
      name: args.name,
      description: args.description,
      category: args.category,
      isActive: args.isActive,
      updatedAt: now,
    });

    return args.id;
  },
});

/**
 * Assign permission to role (super_admin only)
 */
export const assignToRole = mutation({
  args: {
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("inspector"),
      v.literal("user")
    ),
    permissionId: v.id("permissions"),
    isGranted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Not authorized - super_admin access required");
    }

    // Verify permission exists
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error("Permission not found");
    }

    // Check if assignment already exists
    const existing = await ctx.db
      .query("rolePermissions")
      .withIndex("roleAndPermission", (q) => 
        q.eq("role", args.role).eq("permissionId", args.permissionId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        isGranted: args.isGranted,
      });
      return existing._id;
    } else {
      // Create new
      const assignmentId = await ctx.db.insert("rolePermissions", {
        role: args.role,
        permissionId: args.permissionId,
        isGranted: args.isGranted,
        createdAt: now,
        createdBy: userId,
      });
      return assignmentId;
    }
  },
});

/**
 * Remove permission from role (super_admin only)
 */
export const removeFromRole = mutation({
  args: {
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("inspector"),
      v.literal("user")
    ),
    permissionId: v.id("permissions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Not authorized - super_admin access required");
    }

    const existing = await ctx.db
      .query("rolePermissions")
      .withIndex("roleAndPermission", (q) => 
        q.eq("role", args.role).eq("permissionId", args.permissionId)
      )
      .first();

    if (!existing) {
      throw new Error("Permission assignment not found");
    }

    await ctx.db.delete(existing._id);
    return existing._id;
  },
});

/**
 * Grant permission to specific user (super_admin or admin only)
 */
export const grantToUser = mutation({
  args: {
    userId: v.id("users"),
    permissionId: v.id("permissions"),
    isGranted: v.boolean(),
    reason: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (currentUserId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Verify permission exists
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error("Permission not found");
    }

    // Check if override already exists
    const existing = await ctx.db
      .query("userPermissions")
      .withIndex("userAndPermission", (q) => 
        q.eq("userId", args.userId).eq("permissionId", args.permissionId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        isGranted: args.isGranted,
        reason: args.reason,
        expiresAt: args.expiresAt,
      });

      // Log the action
      await ctx.db.insert("userAuditLog", {
        performedBy: currentUserId,
        targetUserId: args.userId,
        action: args.isGranted ? "permission_granted" : "permission_revoked",
        newValues: JSON.stringify({ 
          permission: permission.key,
          reason: args.reason,
          expiresAt: args.expiresAt 
        }),
        timestamp: now,
      });

      return existing._id;
    } else {
      // Create new
      const overrideId = await ctx.db.insert("userPermissions", {
        userId: args.userId,
        permissionId: args.permissionId,
        isGranted: args.isGranted,
        reason: args.reason,
        expiresAt: args.expiresAt,
        createdAt: now,
        createdBy: currentUserId,
      });

      // Log the action
      await ctx.db.insert("userAuditLog", {
        performedBy: currentUserId,
        targetUserId: args.userId,
        action: args.isGranted ? "permission_granted" : "permission_revoked",
        newValues: JSON.stringify({ 
          permission: permission.key,
          reason: args.reason,
          expiresAt: args.expiresAt 
        }),
        timestamp: now,
      });

      return overrideId;
    }
  },
});

/**
 * Remove user permission override (super_admin or admin only)
 */
export const removeFromUser = mutation({
  args: {
    userId: v.id("users"),
    permissionId: v.id("permissions"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (currentUserId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    const existing = await ctx.db
      .query("userPermissions")
      .withIndex("userAndPermission", (q) => 
        q.eq("userId", args.userId).eq("permissionId", args.permissionId)
      )
      .first();

    if (!existing) {
      throw new Error("Permission override not found");
    }

    await ctx.db.delete(existing._id);

    // Log the action
    const permission = await ctx.db.get(args.permissionId);
    const now = Date.now();
    
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: args.userId,
      action: "permission_revoked",
      previousValues: JSON.stringify({ 
        permission: permission?.key 
      }),
      timestamp: now,
    });

    return existing._id;
  },
});

/**
 * Get permissions for a specific role
 */
export const getRolePermissions = query({
  args: {
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("inspector"),
      v.literal("user")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    const rolePermissions = await ctx.db
      .query("rolePermissions")
      .withIndex("role", (q) => q.eq("role", args.role))
      .collect();

    // Enrich with permission details
    const enriched = await Promise.all(
      rolePermissions.map(async (rp) => {
        const permission = await ctx.db.get(rp.permissionId);
        return {
          ...rp,
          permissionKey: permission?.key,
          permissionName: permission?.name,
          permissionCategory: permission?.category,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get user-specific permission overrides
 */
export const getUserPermissionOverrides = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (currentUserId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    const userPermissions = await ctx.db
      .query("userPermissions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrich with permission details
    const now = Date.now();
    const enriched = await Promise.all(
      userPermissions.map(async (up) => {
        const permission = await ctx.db.get(up.permissionId);
        const isExpired = up.expiresAt && up.expiresAt < now;
        
        return {
          ...up,
          permissionKey: permission?.key,
          permissionName: permission?.name,
          permissionCategory: permission?.category,
          isExpired,
        };
      })
    );

    return enriched;
  },
});