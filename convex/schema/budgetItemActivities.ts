// convex/schema/budgetItemActivities.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const budgetItemActivityTables = {
  /**
   * Activity Log for Budget Items
   * Tracks high-level budget allocations and changes
   */
  budgetItemActivities: defineTable({
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted")
    ),
    
    // Target Record
    budgetItemId: v.optional(v.id("budgetItems")),
    
    // Contextual Data
    particulars: v.string(), // Budget Name/Particulars
    departmentId: v.optional(v.id("departments")),
    year: v.optional(v.number()),

    // Change Tracking
    previousValues: v.optional(v.string()), 
    newValues: v.optional(v.string()),      
    changedFields: v.optional(v.string()),  
    
    changeSummary: v.optional(v.object({
      allocationChanged: v.optional(v.boolean()),
      utilizationChanged: v.optional(v.boolean()), // Usually auto-calculated, but good to track
      oldAllocation: v.optional(v.number()),
      newAllocation: v.optional(v.number()),
    })),

    // User Metadata
    performedBy: v.id("users"),
    performedByName: v.string(),
    performedByEmail: v.string(),
    performedByRole: v.string(),
    
    // Meta
    timestamp: v.number(),
    reason: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("budgetItemId", ["budgetItemId"])
    .index("performedBy", ["performedBy"])
    .index("timestamp", ["timestamp"])
    .index("action", ["action"]),
};