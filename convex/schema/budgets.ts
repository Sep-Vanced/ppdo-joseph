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
    totalBudgetUtilized: v.number(),
    utilizationRate: v.number(),
    projectCompleted: v.number(),
    projectDelayed: v.number(),
    projectsOnTrack: v.number(),
    
    /**
     * Department responsible for this budget item
     */
    departmentId: v.optional(v.id("departments")),
    
    /**
     * Fiscal year for this budget (e.g., 2024, 2025)
     */
    fiscalYear: v.optional(v.number()),
    
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
    .index("departmentAndYear", ["departmentId", "fiscalYear"]),

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