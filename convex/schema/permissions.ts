// convex/schema/permissions.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const permissionTables = {
  /**
   * Permissions.
   * Defines granular permissions that can be assigned to roles.
   */
  permissions: defineTable({
    /**
     * Unique permission key (e.g., "users.create", "projects.delete", "budgets.approve")
     */
    key: v.string(),
    
    /**
     * Human-readable permission name
     */
    name: v.string(),
    
    /**
     * Description of what this permission allows
     */
    description: v.string(),
    
    /**
     * Category for grouping permissions (e.g., "users", "projects", "budgets", "reports")
     */
    category: v.string(),
    
    /**
     * Whether this permission is currently active
     */
    isActive: v.boolean(),
    
    /**
     * Timestamp when created
     */
    createdAt: v.number(),
    
    /**
     * Timestamp when last updated
     */
    updatedAt: v.number(),
  })
    .index("key", ["key"])
    .index("category", ["category"])
    .index("isActive", ["isActive"]),

  /**
   * Role Permissions.
   * Maps which permissions are assigned to each role.
   * This allows flexible permission management per role.
   */
  rolePermissions: defineTable({
    /**
     * Role this permission is assigned to
     */
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("inspector"),
      v.literal("user")
    ),
    
    /**
     * Permission ID being assigned
     */
    permissionId: v.id("permissions"),
    
    /**
     * Whether this permission is granted (true) or denied (false)
     * Allows for explicit denials if needed
     */
    isGranted: v.boolean(),
    
    /**
     * Timestamp when this permission was assigned
     */
    createdAt: v.number(),
    
    /**
     * User who assigned this permission
     */
    createdBy: v.id("users"),
  })
    .index("role", ["role"])
    .index("permissionId", ["permissionId"])
    .index("roleAndPermission", ["role", "permissionId"]),

  /**
   * User Permissions Override.
   * Allows granting or denying specific permissions to individual users,
   * overriding their role's default permissions.
   */
  userPermissions: defineTable({
    /**
     * User receiving the permission override
     */
    userId: v.id("users"),
    
    /**
     * Permission being granted or denied
     */
    permissionId: v.id("permissions"),
    
    /**
     * Whether this permission is granted (true) or denied (false)
     */
    isGranted: v.boolean(),
    
    /**
     * Optional reason for the override
     */
    reason: v.optional(v.string()),
    
    /**
     * Timestamp when this override was created
     */
    createdAt: v.number(),
    
    /**
     * User who created this override
     */
    createdBy: v.id("users"),
    
    /**
     * Optional expiration date for temporary permissions
     */
    expiresAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("permissionId", ["permissionId"])
    .index("userAndPermission", ["userId", "permissionId"])
    .index("expiresAt", ["expiresAt"]),
};