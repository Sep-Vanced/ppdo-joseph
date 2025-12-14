// convex/schema/projects.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const projectTables = {
  /**
   * Projects.
   * Enhanced with department relationship.
   */
  projects: defineTable({
    projectName: v.string(),
    
    /**
     * Replaced implementingOffice string with department reference
     */
    departmentId: v.id("departments"),
    
    allocatedBudget: v.number(),
    revisedBudget: v.optional(v.number()),
    totalBudgetUtilized: v.number(),
    utilizationRate: v.number(),
    balance: v.number(),
    dateStarted: v.number(),
    completionDate: v.optional(v.number()),
    expectedCompletionDate: v.optional(v.number()),
    projectAccomplishment: v.number(),
    status: v.optional(
      v.union(
        v.literal("on_track"),
        v.literal("delayed"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("on_hold")
      )
    ),
    remarks: v.optional(v.string()),
    budgetItemId: v.optional(v.id("budgetItems")),
    
    /**
     * Project manager/lead
     */
    projectManagerId: v.optional(v.id("users")),
    
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  })
    .index("projectName", ["projectName"])
    .index("departmentId", ["departmentId"])
    .index("status", ["status"])
    .index("dateStarted", ["dateStarted"])
    .index("completionDate", ["completionDate"])
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("budgetItemId", ["budgetItemId"])
    .index("projectManagerId", ["projectManagerId"])
    .index("statusAndDepartment", ["status", "departmentId"])
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