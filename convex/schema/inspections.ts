// convex/schema/inspections.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const inspectionTables = {
  /**
   * Inspections.
   */
  inspections: defineTable({
    projectId: v.id("projects"),
    budgetItemId: v.optional(v.id("budgetItems")),
    programNumber: v.string(),
    title: v.string(),
    category: v.string(),
    inspectionDate: v.number(),
    remarks: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("in_progress"),
      v.literal("pending"),
      v.literal("cancelled")
    ),
    viewCount: v.number(),
    uploadSessionId: v.optional(v.id("uploadSessions")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
    metadata: v.optional(v.string()),
  })
    .index("projectId", ["projectId"])
    .index("budgetItemId", ["budgetItemId"])
    .index("status", ["status"])
    .index("category", ["category"])
    .index("inspectionDate", ["inspectionDate"])
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("programNumber", ["programNumber"])
    .index("projectAndStatus", ["projectId", "status"])
    .index("projectAndDate", ["projectId", "inspectionDate"])
    .index("categoryAndStatus", ["category", "status"]),
};