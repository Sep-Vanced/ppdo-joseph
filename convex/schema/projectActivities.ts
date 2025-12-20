// convex/schema/projectActivities.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const projectActivityTables = {
  /**
   * Activity Log for Projects
   * Tracks creation, updates, and deletion of main projects
   */
  projectActivities: defineTable({
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
      v.literal("restored")
    ),
    
    // Target Record
    projectId: v.optional(v.id("projects")),
    
    // Contextual Data (Snapshot)
    particulars: v.string(), // Project Name
    implementingOffice: v.string(),
    budgetItemId: v.optional(v.id("budgetItems")),

    // Change Tracking
    previousValues: v.optional(v.string()), // JSON
    newValues: v.optional(v.string()),      // JSON
    changedFields: v.optional(v.string()),  // JSON array
    
    changeSummary: v.optional(v.object({
      budgetChanged: v.optional(v.boolean()),
      statusChanged: v.optional(v.boolean()),
      scheduleChanged: v.optional(v.boolean()),
      managerChanged: v.optional(v.boolean()),
      oldBudget: v.optional(v.number()),
      newBudget: v.optional(v.number()),
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
    .index("projectId", ["projectId"])
    .index("performedBy", ["performedBy"])
    .index("timestamp", ["timestamp"])
    .index("action", ["action"]),
};