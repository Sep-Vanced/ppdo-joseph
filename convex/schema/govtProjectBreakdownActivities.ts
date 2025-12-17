// convex/schema/govtProjectBreakdownActivities.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const govtProjectBreakdownActivityTables = {
  /**
   * Activity Log for Government Project Breakdowns
   * Tracks ALL CRUD operations with detailed context
   */
  govtProjectBreakdownActivities: defineTable({
    /**
     * Action Type - What operation was performed
     */
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
      v.literal("bulk_created"),
      v.literal("bulk_updated"),
      v.literal("bulk_deleted"),
      v.literal("viewed"),           // Optional: Track views
      v.literal("exported"),          // Optional: Track exports
      v.literal("imported")           // Optional: Track imports
    ),
    
    /**
     * Target Record ID (null for bulk operations or if record was deleted)
     */
    breakdownId: v.optional(v.id("govtProjectBreakdowns")),
    
    /**
     * Batch ID for bulk operations
     * Links multiple activities together (e.g., bulk import)
     */
    batchId: v.optional(v.string()),
    
    // ============================================================================
    // CONTEXTUAL DATA (Snapshot at time of action)
    // ============================================================================
    
    /**
     * Project Name (snapshot)
     * Preserved even if breakdown is deleted
     */
    projectName: v.string(),
    
    /**
     * Implementing Office (snapshot)
     */
    implementingOffice: v.string(),
    
    /**
     * Additional context for searchability
     */
    municipality: v.optional(v.string()),
    barangay: v.optional(v.string()),
    district: v.optional(v.string()),
    
    // ============================================================================
    // CHANGE TRACKING
    // ============================================================================
    
    /**
     * Previous Values (JSON string)
     * For updates: stores the old values
     * For deletes: stores the complete record before deletion
     * For creates: null
     */
    previousValues: v.optional(v.string()),
    
    /**
     * New Values (JSON string)
     * For creates: stores the complete new record
     * For updates: stores only the changed fields
     * For deletes: null
     */
    newValues: v.optional(v.string()),
    
    /**
     * Changed Fields (JSON array of field names)
     * Quick reference for what changed in updates
     * Example: ["allocatedBudget", "status", "remarks"]
     */
    changedFields: v.optional(v.string()),
    
    /**
     * Field-specific change summary for important fields
     * Makes it easy to track budget/status changes
     */
    changeSummary: v.optional(v.object({
      budgetChanged: v.optional(v.boolean()),
      statusChanged: v.optional(v.boolean()),
      dateChanged: v.optional(v.boolean()),
      locationChanged: v.optional(v.boolean()),
      oldStatus: v.optional(v.string()),
      newStatus: v.optional(v.string()),
      oldBudget: v.optional(v.number()),
      newBudget: v.optional(v.number()),
    })),
    
    // ============================================================================
    // USER & METADATA
    // ============================================================================
    
    /**
     * User who performed the action
     */
    performedBy: v.id("users"),
    
    /**
     * User's name (snapshot)
     */
    performedByName: v.string(),
    
    /**
     * User's email (snapshot)
     */
    performedByEmail: v.string(),
    
    /**
     * User's role at time of action (snapshot)
     */
    performedByRole: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("user")
    ),
    
    /**
     * User's department (snapshot)
     */
    performedByDepartmentId: v.optional(v.id("departments")),
    performedByDepartmentName: v.optional(v.string()),
    
    /**
     * Optional reason/notes for the action
     * Useful for auditing: "Correcting data entry error", "Updated per site visit"
     */
    reason: v.optional(v.string()),
    
    /**
     * Timestamp when action occurred
     */
    timestamp: v.number(),
    
    // ============================================================================
    // TECHNICAL METADATA
    // ============================================================================
    
    /**
     * IP Address of the user (for security auditing)
     */
    ipAddress: v.optional(v.string()),
    
    /**
     * User Agent (browser/device info)
     */
    userAgent: v.optional(v.string()),
    
    /**
     * Source of the action
     * Helps distinguish between manual edits vs bulk imports vs API calls
     */
    source: v.optional(v.union(
      v.literal("web_ui"),
      v.literal("bulk_import"),
      v.literal("api"),
      v.literal("system"),
      v.literal("migration")
    )),
    
    /**
     * Session ID for correlating multiple actions
     */
    sessionId: v.optional(v.string()),
    
    // ============================================================================
    // FLAGS & CATEGORIZATION
    // ============================================================================
    
    /**
     * Whether this is a sensitive/important change
     * Auto-flagged for: large budget changes, status changes to completed/cancelled
     */
    isFlagged: v.optional(v.boolean()),
    
    /**
     * Flag reason (why it was flagged)
     */
    flagReason: v.optional(v.string()),
    
    /**
     * Whether this activity has been reviewed by admin
     */
    isReviewed: v.optional(v.boolean()),
    
    /**
     * Admin who reviewed (if applicable)
     */
    reviewedBy: v.optional(v.id("users")),
    
    /**
     * Review timestamp
     */
    reviewedAt: v.optional(v.number()),
    
    /**
     * Review notes
     */
    reviewNotes: v.optional(v.string()),
    
    // ============================================================================
    // AGGREGATION IMPACT TRACKING
    // ============================================================================
    
    /**
     * Whether this action triggered aggregation recalculation
     */
    triggeredAggregationUpdate: v.optional(v.boolean()),
    
    /**
     * IDs of aggregations that were affected
     */
    affectedAggregationIds: v.optional(v.string()), // JSON array of IDs
  })
    // Core indexes for performance
    .index("breakdownId", ["breakdownId"])
    .index("performedBy", ["performedBy"])
    .index("timestamp", ["timestamp"])
    .index("action", ["action"])
    .index("batchId", ["batchId"])
    
    // Composite indexes for common queries
    .index("projectAndOffice", ["projectName", "implementingOffice"])
    .index("userAndTimestamp", ["performedBy", "timestamp"])
    .index("actionAndTimestamp", ["action", "timestamp"])
    .index("breakdownAndTimestamp", ["breakdownId", "timestamp"])
    
    // Filtering indexes
    .index("isFlagged", ["isFlagged"])
    .index("isReviewed", ["isReviewed"])
    .index("source", ["source"])
    
    // Location-based indexes
    .index("municipality", ["municipality"])
    .index("district", ["district"])
    
    // Advanced composite indexes
    .index("projectOfficeTimestamp", ["projectName", "implementingOffice", "timestamp"])
    .index("flaggedAndNotReviewed", ["isFlagged", "isReviewed", "timestamp"]),
};