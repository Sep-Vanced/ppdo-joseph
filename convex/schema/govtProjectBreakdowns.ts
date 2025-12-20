// convex/schema/govtProjectBreakdowns.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const govtProjectBreakdownTables = {
  govtProjectBreakdowns: defineTable({
    // ============================================================================
    // MANDATORY FIELDS (Only these two are required)
    // ============================================================================
    projectName: v.string(), // e.g., "Construction of"
    implementingOffice: v.string(), // e.g., "TPH", "PEO", "CDH"

    // 🆕 PARENT PROJECT (OPTIONAL)
    // Links this breakdown to a specific project for aggregation.
    // When linked, this breakdown's status contributes to parent's metrics.
    projectId: v.optional(v.id("projects")),

    // ============================================================================
    // OPTIONAL FIELDS
    // ============================================================================

    // --- PROJECT TITLE ---
    projectTitle: v.optional(v.string()),

    // --- FINANCIAL DATA ---
    allocatedBudget: v.optional(v.number()),
    obligatedBudget: v.optional(v.number()),
    budgetUtilized: v.optional(v.number()),
    utilizationRate: v.optional(v.number()),
    balance: v.optional(v.number()),

    // --- DATE FIELDS ---
    dateStarted: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    completionDate: v.optional(v.number()),

    // --- PROGRESS ---
    projectAccomplishment: v.optional(v.number()),

    // --- STATUS (STRICT 3 OPTIONS) ---
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("delayed"),
        v.literal("ongoing")
      )
    ),

    // --- REMARKS ---
    remarks: v.optional(v.string()),

    // --- LOCATION DATA ---
    district: v.optional(v.string()),
    municipality: v.optional(v.string()),
    barangay: v.optional(v.string()),

    // --- METADATA ---
    reportDate: v.optional(v.number()),
    batchId: v.optional(v.string()),
    fundSource: v.optional(v.string()),

    // [NEW] Trash System Fields
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),

    // ============================================================================
    // SYSTEM FIELDS
    // ============================================================================
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id("users")),
  })
    .index("projectName", ["projectName"])
    .index("implementingOffice", ["implementingOffice"])
    .index("status", ["status"])
    .index("projectNameAndOffice", ["projectName", "implementingOffice"])
    .index("reportDate", ["reportDate"])
    .index("municipality", ["municipality"])
    // 🆕 CRITICAL INDEXES FOR AGGREGATION
    .index("isDeleted", ["isDeleted"])
    .index("projectId", ["projectId"])
    .index("projectIdAndStatus", ["projectId", "status"]),
};