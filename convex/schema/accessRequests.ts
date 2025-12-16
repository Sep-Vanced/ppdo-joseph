// convex/schema/accessRequests.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const accessRequestTables = {
  /**
   * Access Requests.
   * Tracks user requests for accessing restricted pages/features.
   */
  accessRequests: defineTable({
    /**
     * User requesting access
     */
    userId: v.id("users"),
    
    /**
     * User's full name (snapshot)
     */
    userName: v.string(),
    
    /**
     * User's email (snapshot)
     */
    userEmail: v.string(),
    
    /**
     * User's department name (snapshot)
     */
    departmentName: v.string(),
    
    /**
     * User's department ID (reference)
     */
    departmentId: v.optional(v.id("departments")),
    
    /**
     * Page or feature being requested
     */
    pageRequested: v.string(),
    
    /**
     * Type of access requested
     */
    accessType: v.string(),
    
    /**
     * Reason for requesting access
     */
    reason: v.string(),
    
    /**
     * Request status
     */
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    
    /**
     * Admin who reviewed the request
     */
    reviewedBy: v.optional(v.id("users")),
    
    /**
     * Timestamp when reviewed
     */
    reviewedAt: v.optional(v.number()),
    
    /**
     * Admin notes on the decision
     */
    adminNotes: v.optional(v.string()),
    
    /**
     * Timestamp when created
     */
    createdAt: v.number(),
    
    /**
     * Timestamp when last updated
     */
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("createdAt", ["createdAt"])
    .index("reviewedBy", ["reviewedBy"])
    .index("userAndStatus", ["userId", "status"]),
};