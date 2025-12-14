// convex/schema/audit.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const auditTables = {
  /**
   * Audit log for user management and permission changes.
   * Enhanced to track permission and department changes.
   */
  userAuditLog: defineTable({
    /**
     * The user who performed the action
     */
    performedBy: v.id("users"),
    
    /**
     * The user who was affected by the action (null for system-level actions)
     */
    targetUserId: v.optional(v.id("users")),
    
    /**
     * Department affected (if applicable)
     */
    targetDepartmentId: v.optional(v.id("departments")),
    
    /**
     * Type of action performed
     */
    action: v.union(
      v.literal("role_changed"),
      v.literal("status_changed"),
      v.literal("user_created"),
      v.literal("user_updated"),
      v.literal("user_deleted"),
      v.literal("permission_granted"),
      v.literal("permission_revoked"),
      v.literal("department_assigned"),
      v.literal("department_created"),
      v.literal("department_updated"),
      v.literal("department_deleted")
    ),
    
    /**
     * Previous values before the change (JSON string)
     */
    previousValues: v.optional(v.string()),
    
    /**
     * New values after the change (JSON string)
     */
    newValues: v.optional(v.string()),
    
    /**
     * Optional reason or notes for the action
     */
    notes: v.optional(v.string()),
    
    /**
     * Timestamp when the action was performed
     */
    timestamp: v.number(),
    
    /**
     * IP address from which the action was performed
     */
    ipAddress: v.optional(v.string()),
    
    /**
     * User agent string
     */
    userAgent: v.optional(v.string()),
  })
    .index("targetUserId", ["targetUserId"])
    .index("targetDepartmentId", ["targetDepartmentId"])
    .index("performedBy", ["performedBy"])
    .index("timestamp", ["timestamp"])
    .index("action", ["action"]),
};