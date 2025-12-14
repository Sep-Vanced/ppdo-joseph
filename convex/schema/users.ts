// convex/schema/users.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userTables = {
  /**
   * Users.
   * Enhanced with RBAC, department relationship, and account status tracking.
   */
  users: defineTable({
    // Basic user information
    name: v.optional(v.string()),
    
    /**
     * Username for login or display (optional, separate from full name)
     * Can be used for @mentions, unique identifiers, etc.
     */
    user_name: v.optional(v.string()),
    
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    
    /**
     * User role for RBAC.
     * - super_admin: Full system access, manage all users, departments, and system settings
     * - admin: Department-level admin, can manage users and resources within their department
     * - user: Standard user access, can manage own resources
     * @default "user"
     */
    role: v.optional(
      v.union(
        v.literal("super_admin"),
        v.literal("admin"),
        v.literal("user")
      )
    ),
    
    /**
     * Department this user belongs to
     */
    departmentId: v.optional(v.id("departments")),
    
    /**
     * Job title or position
     */
    position: v.optional(v.string()),
    
    /**
     * Employee ID or staff number
     */
    employeeId: v.optional(v.string()),
    
    /**
     * Account status.
     * - active: Normal account, can sign in and use the system
     * - inactive: Account disabled, cannot sign in (e.g., user requested deactivation)
     * - suspended: Account suspended by admin, cannot sign in (e.g., policy violation)
     * @default "active"
     */
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("suspended")
      )
    ),
    
    /**
     * Last successful login timestamp
     */
    lastLogin: v.optional(v.number()),
    
    /**
     * Timestamp when the user was created
     */
    createdAt: v.optional(v.number()),
    
    /**
     * Timestamp when the user record was last updated
     */
    updatedAt: v.optional(v.number()),
    
    /**
     * Reason for suspension (only relevant when status is "suspended")
     */
    suspensionReason: v.optional(v.string()),
    
    /**
     * ID of the administrator who suspended the account
     */
    suspendedBy: v.optional(v.id("users")),
    
    /**
     * Timestamp when the suspension was applied
     */
    suspendedAt: v.optional(v.number()),
    
    /**
     * User preferences (stored as JSON string)
     * Can include theme, language, notification settings, etc.
     */
    preferences: v.optional(v.string()),
    
    /**
     * Security preferences (JSON string)
     * { 
     *   twoFactorEnabled, 
     *   loginNotifications, 
     *   trustedDevicesOnly,
     *   requireLocationVerification 
     * }
     */
    securityPreferences: v.optional(v.string()),
    
    /**
     * Account locked due to security reasons
     */
    isLocked: v.optional(v.boolean()),
    
    /**
     * Lock reason
     */
    lockReason: v.optional(v.string()),
    
    /**
     * Locked timestamp
     */
    lockedAt: v.optional(v.number()),
    
    /**
     * Failed login attempt count (reset on success)
     */
    failedLoginAttempts: v.optional(v.number()),
    
    /**
     * Last failed login timestamp
     */
    lastFailedLogin: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("role", ["role"])
    .index("status", ["status"])
    .index("departmentId", ["departmentId"])
    .index("employeeId", ["employeeId"])
    .index("user_name", ["user_name"])
    .index("roleAndStatus", ["role", "status"])
    .index("departmentAndRole", ["departmentId", "role"])
    .index("lastLogin", ["lastLogin"])
    .index("createdAt", ["createdAt"])
    .index("isLocked", ["isLocked"]),
};