// convex/schema/budgets.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const budgetTables = {
  /**
   * Budget Items.
   * Now linked to departments for better organization.
   */
  budgetItems: defineTable({
    particulars: v.string(),
    totalBudgetAllocated: v.number(),
    
    /**
     * Obligated budget amount (optional)
     * Represents the committed/obligated portion of the allocated budget
     */
    obligatedBudget: v.optional(v.number()),
    
    totalBudgetUtilized: v.number(),
    utilizationRate: v.number(),
    projectCompleted: v.number(),
    projectDelayed: v.number(),
    projectsOnTrack: v.number(),
    
    /**
     * Year for this budget item (optional)
     */
    year: v.optional(v.number()),
    
    /**
     * Status of the budget item (optional)
     * STRICT 3 OPTIONS: completed, delayed, ongoing
     */
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("delayed"),
        v.literal("ongoing")
      )
    ),
    
    /**
     * Whether this budget item is pinned
     */
    isPinned: v.optional(v.boolean()),
    
    /**
     * Timestamp when pinned
     */
    pinnedAt: v.optional(v.number()),
    
    /**
     * User who pinned this item
     */
    pinnedBy: v.optional(v.id("users")),
    
    /**
     * Department responsible for this budget item
     */
    departmentId: v.optional(v.id("departments")),
    
    /**
     * Fiscal year for this budget (e.g., 2024, 2025)
     */
    fiscalYear: v.optional(v.number()),
    
    // [NEW] Trash System Fields
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
    
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("updatedAt", ["updatedAt"])
    .index("particulars", ["particulars"])
    .index("departmentId", ["departmentId"])
    .index("fiscalYear", ["fiscalYear"])
    .index("departmentAndYear", ["departmentId", "fiscalYear"])
    .index("year", ["year"])
    .index("status", ["status"])
    .index("yearAndStatus", ["year", "status"])
    .index("isPinned", ["isPinned"])
    .index("pinnedAt", ["pinnedAt"])
    .index("isDeleted", ["isDeleted"]),

  /**
   * Obligations.
   */
  obligations: defineTable({
    projectId: v.id("projects"),
    amount: v.number(),
    name: v.string(),
    email: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("projectId", ["projectId"])
    .index("type", ["type"])
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("projectAndType", ["projectId", "type"]),
};