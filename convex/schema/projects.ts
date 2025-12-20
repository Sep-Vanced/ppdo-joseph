// convex/schema/projects.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const projectTables = {
  /**
   * Projects.
   * Enhanced to match budgetItems structure with department relationship.
   */
  projects: defineTable({
    // ============================================================================
    // PROJECT IDENTIFICATION
    // ============================================================================
    /**
     * Project particulars/name
     * Note: Backend uses "particulars" to match budgetItems terminology
     */
    particulars: v.string(),
    
    /**
     * Implementing Office (Department name as string for display)
     */
    implementingOffice: v.string(),
    
    /**
     * Department ID reference (optional for filtering/grouping)
     */
    departmentId: v.optional(v.id("departments")),

    /**
     * 🆕 PARENT BUDGET ITEM (OPTIONAL)
     * Links this project to a specific budget item for aggregation.
     * When linked, this project's status contributes to parent's metrics.
     */
    budgetItemId: v.optional(v.id("budgetItems")),
    
    // ============================================================================
    // FINANCIAL DATA (matches budgetItems)
    // ============================================================================
    totalBudgetAllocated: v.number(),
    obligatedBudget: v.optional(v.number()),
    totalBudgetUtilized: v.number(),
    utilizationRate: v.number(),
    
    // ============================================================================
    // PROJECT METRICS (matches budgetItems structure)
    // ============================================================================
    projectCompleted: v.number(),
    projectDelayed: v.number(),
    projectsOnTrack: v.number(), // Often referred to as "projectsOngoing" in frontend
    
    // ============================================================================
    // ADDITIONAL PROJECT FIELDS
    // ============================================================================
    remarks: v.optional(v.string()),
    year: v.optional(v.number()),
    
    /**
     * Project status - determines how it's counted in parent budgetItem
     * STRICT 3 OPTIONS: completed, delayed, ongoing
     */
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("delayed"),
        v.literal("ongoing")
      )
    ),
    targetDateCompletion: v.optional(v.number()),
    
    /**
     * Project manager/lead
     */
    projectManagerId: v.optional(v.id("users")),
    
    // ============================================================================
    // PIN FUNCTIONALITY
    // ============================================================================
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()),
    pinnedBy: v.optional(v.id("users")),
    
    // [NEW] Trash System Fields
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
    
    // ============================================================================
    // SYSTEM FIELDS
    // ============================================================================
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  })
    .index("particulars", ["particulars"])
    .index("implementingOffice", ["implementingOffice"])
    .index("departmentId", ["departmentId"])
    // 🆕 CRITICAL INDEXES FOR AGGREGATION
    .index("isDeleted", ["isDeleted"])
    .index("budgetItemId", ["budgetItemId"]) 
    .index("budgetItemAndStatus", ["budgetItemId", "status"])
    // EXISTING INDEXES
    .index("status", ["status"])
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("projectManagerId", ["projectManagerId"])
    .index("isPinned", ["isPinned"])
    .index("pinnedAt", ["pinnedAt"])
    .index("year", ["year"])
    .index("departmentAndStatus", ["departmentId", "status"]),

  /**
   * Remarks.
   */
  remarks: defineTable({
    projectId: v.id("projects"),
    inspectionId: v.optional(v.id("inspections")),
    budgetItemId: v.optional(v.id("budgetItems")),
    content: v.string(),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
    tags: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    attachments: v.optional(v.string()),
  })
    .index("projectId", ["projectId"])
    .index("inspectionId", ["inspectionId"])
    .index("budgetItemId", ["budgetItemId"])
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("updatedAt", ["updatedAt"])
    .index("category", ["category"])
    .index("priority", ["priority"])
    .index("projectAndInspection", ["projectId", "inspectionId"])
    .index("projectAndCategory", ["projectId", "category"])
    .index("projectAndCreatedAt", ["projectId", "createdAt"])
    .index("inspectionAndCreatedAt", ["inspectionId", "createdAt"])
    .index("isPinned", ["isPinned"])
    .index("createdByAndProject", ["createdBy", "projectId"]),
};