// convex/govtProjects.ts
// Government Project Breakdowns CRUD Operations with Complete Activity Logging

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logGovtProjectActivity, logBulkGovtProjectActivity } from "./lib/govtProjectActivityLogger";
import { Id } from "./_generated/dataModel";

// Reusable status validator to ensure consistency across all mutations
const statusValidator = v.union(
  v.literal("Completed"),
  v.literal("On-Going"),
  v.literal("On-Hold"),
  v.literal("Cancelled"),
  v.literal("Delayed")
);

/**
 * CREATE: Single project breakdown row
 * WITH ACTIVITY LOGGING
 */
export const createProjectBreakdown = mutation({
  args: {
    projectName: v.string(),
    implementingOffice: v.string(),
    municipality: v.optional(v.string()),
    barangay: v.optional(v.string()),
    district: v.optional(v.string()),
    allocatedBudget: v.optional(v.number()),
    obligatedBudget: v.optional(v.number()),
    budgetUtilized: v.optional(v.number()),
    balance: v.optional(v.number()),
    // FIX: Use specific union type to match schema, not generic string
    status: v.optional(statusValidator),
    dateStarted: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    completionDate: v.optional(v.number()),
    remarks: v.optional(v.string()),
    reason: v.optional(v.string()), // Optional reason for creation
    projectTitle: v.optional(v.string()), // Added missing field from schema
    utilizationRate: v.optional(v.number()), // Added missing field from schema
    projectAccomplishment: v.optional(v.number()), // Added missing field from schema
    reportDate: v.optional(v.number()), // Added missing field from schema
    batchId: v.optional(v.string()), // Added missing field from schema
    fundSource: v.optional(v.string()), // Added missing field from schema
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const { reason, ...breakdownData } = args;

    // Create the breakdown
    const breakdownId = await ctx.db.insert("govtProjectBreakdowns", {
      ...breakdownData,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
    });

    // Get the created breakdown for logging
    const createdBreakdown = await ctx.db.get(breakdownId);

    // LOG ACTIVITY
    await logGovtProjectActivity(ctx, userId, {
      action: "created",
      breakdownId: breakdownId,
      breakdown: createdBreakdown,
      newValues: createdBreakdown,
      source: "web_ui",
      reason: reason,
    });

    return { breakdownId };
  },
});

/**
 * UPDATE: Single project breakdown row
 * WITH ACTIVITY LOGGING
 */
export const updateProjectBreakdown = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
    municipality: v.optional(v.string()),
    barangay: v.optional(v.string()),
    district: v.optional(v.string()),
    allocatedBudget: v.optional(v.number()),
    obligatedBudget: v.optional(v.number()),
    budgetUtilized: v.optional(v.number()),
    balance: v.optional(v.number()),
    // FIX: Use specific union type to match schema
    status: v.optional(statusValidator),
    dateStarted: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    completionDate: v.optional(v.number()),
    remarks: v.optional(v.string()),
    reason: v.optional(v.string()), // Optional reason for update
    projectTitle: v.optional(v.string()),
    utilizationRate: v.optional(v.number()),
    projectAccomplishment: v.optional(v.number()),
    reportDate: v.optional(v.number()),
    fundSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { breakdownId, reason, ...updates } = args;

    // GET PREVIOUS VALUES BEFORE UPDATE
    const previousBreakdown = await ctx.db.get(breakdownId);
    if (!previousBreakdown) {
      throw new Error("Breakdown not found");
    }

    // Perform the update
    await ctx.db.patch(breakdownId, {
      ...updates,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    // GET NEW VALUES AFTER UPDATE
    const updatedBreakdown = await ctx.db.get(breakdownId);

    // LOG ACTIVITY
    await logGovtProjectActivity(ctx, userId, {
      action: "updated",
      breakdownId: breakdownId,
      breakdown: updatedBreakdown,
      previousValues: previousBreakdown,
      newValues: updatedBreakdown,
      source: "web_ui",
      reason: reason,
    });

    return { success: true, breakdownId };
  },
});

/**
 * DELETE: Single project breakdown row
 * WITH ACTIVITY LOGGING
 */
export const deleteProjectBreakdown = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    reason: v.optional(v.string()), // Optional reason for deletion
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // GET VALUES BEFORE DELETION
    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) {
      throw new Error("Breakdown not found");
    }

    // Perform the deletion
    await ctx.db.delete(args.breakdownId);

    // LOG ACTIVITY (breakdown ID will reference deleted record)
    await logGovtProjectActivity(ctx, userId, {
      action: "deleted",
      breakdownId: args.breakdownId,
      previousValues: breakdown,
      source: "web_ui",
      reason: args.reason,
    });

    return { success: true };
  },
});

/**
 * BULK CREATE: Multiple project breakdowns (Excel import)
 * WITH ACTIVITY LOGGING
 */
export const bulkCreateBreakdowns = mutation({
  args: {
    breakdowns: v.array(v.object({
      projectName: v.string(),
      implementingOffice: v.string(),
      municipality: v.optional(v.string()),
      barangay: v.optional(v.string()),
      district: v.optional(v.string()),
      allocatedBudget: v.optional(v.number()),
      obligatedBudget: v.optional(v.number()),
      budgetUtilized: v.optional(v.number()),
      balance: v.optional(v.number()),
      // FIX: Use specific union type to match schema
      status: v.optional(statusValidator),
      dateStarted: v.optional(v.number()),
      targetDate: v.optional(v.number()),
      completionDate: v.optional(v.number()),
      remarks: v.optional(v.string()),
      projectTitle: v.optional(v.string()),
      utilizationRate: v.optional(v.number()),
      projectAccomplishment: v.optional(v.number()),
      reportDate: v.optional(v.number()),
      batchId: v.optional(v.string()),
      fundSource: v.optional(v.string()),
    })),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    // FIX: Explicitly type the array with Id<"govtProjectBreakdowns">
    const insertedRecords: Array<{ 
      breakdownId: Id<"govtProjectBreakdowns">; 
      breakdown: any 
    }> = [];

    // Insert all breakdowns
    for (const breakdown of args.breakdowns) {
      const breakdownId = await ctx.db.insert("govtProjectBreakdowns", {
        ...breakdown,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      });

      const createdBreakdown = await ctx.db.get(breakdownId);
      insertedRecords.push({ 
        breakdownId, 
        breakdown: createdBreakdown 
      });
    }

    // LOG BULK ACTIVITY
    const batchId = await logBulkGovtProjectActivity(
      ctx,
      userId,
      "bulk_created",
      insertedRecords.map(r => ({
        breakdownId: r.breakdownId,
        breakdown: r.breakdown,
        newValues: r.breakdown,
      })),
      {
        source: "bulk_import",
        reason: args.reason || "Excel import",
      }
    );

    return { 
      count: insertedRecords.length, 
      ids: insertedRecords.map(r => r.breakdownId),
      batchId 
    };
  },
});

/**
 * BULK UPDATE: Multiple project breakdowns
 * WITH ACTIVITY LOGGING
 */
export const bulkUpdateBreakdowns = mutation({
  args: {
    updates: v.array(v.object({
      breakdownId: v.id("govtProjectBreakdowns"),
      projectName: v.optional(v.string()),
      implementingOffice: v.optional(v.string()),
      municipality: v.optional(v.string()),
      barangay: v.optional(v.string()),
      district: v.optional(v.string()),
      allocatedBudget: v.optional(v.number()),
      obligatedBudget: v.optional(v.number()),
      budgetUtilized: v.optional(v.number()),
      balance: v.optional(v.number()),
      // FIX: Use specific union type to match schema
      status: v.optional(statusValidator),
      dateStarted: v.optional(v.number()),
      targetDate: v.optional(v.number()),
      completionDate: v.optional(v.number()),
      remarks: v.optional(v.string()),
      projectTitle: v.optional(v.string()),
      utilizationRate: v.optional(v.number()),
      projectAccomplishment: v.optional(v.number()),
      reportDate: v.optional(v.number()),
      fundSource: v.optional(v.string()),
    })),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    // FIX: Explicitly type the array with Id<"govtProjectBreakdowns">
    const updatedRecords: Array<{
      breakdownId: Id<"govtProjectBreakdowns">;
      breakdown: any;
      previousValues: any;
      newValues: any;
    }> = [];

    // Update all breakdowns
    for (const update of args.updates) {
      const { breakdownId, ...updateData } = update;

      // Get previous values
      const previousBreakdown = await ctx.db.get(breakdownId);
      if (!previousBreakdown) {
        console.warn(`Breakdown ${breakdownId} not found, skipping`);
        continue;
      }

      // Perform update
      await ctx.db.patch(breakdownId, {
        ...updateData,
        updatedAt: now,
        updatedBy: userId,
      });

      // Get new values
      const updatedBreakdown = await ctx.db.get(breakdownId);

      updatedRecords.push({
        breakdownId,
        breakdown: updatedBreakdown,
        previousValues: previousBreakdown,
        newValues: updatedBreakdown,
      });
    }

    // LOG BULK ACTIVITY
    const batchId = await logBulkGovtProjectActivity(
      ctx,
      userId,
      "bulk_updated",
      updatedRecords.map(r => ({
        breakdownId: r.breakdownId,
        breakdown: r.breakdown,
        previousValues: r.previousValues,
        newValues: r.newValues,
      })),
      {
        source: "bulk_import",
        reason: args.reason || "Bulk update",
      }
    );

    return { 
      count: updatedRecords.length, 
      ids: updatedRecords.map(r => r.breakdownId),
      batchId 
    };
  },
});

/**
 * BULK DELETE: Multiple project breakdowns
 * WITH ACTIVITY LOGGING
 */
export const bulkDeleteBreakdowns = mutation({
  args: {
    breakdownIds: v.array(v.id("govtProjectBreakdowns")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // FIX: Explicitly type the array with Id<"govtProjectBreakdowns">
    const deletedRecords: Array<{
      breakdownId: Id<"govtProjectBreakdowns">;
      previousValues: any;
    }> = [];

    // Delete all breakdowns
    for (const breakdownId of args.breakdownIds) {
      // Get values before deletion
      const breakdown = await ctx.db.get(breakdownId);
      if (!breakdown) {
        console.warn(`Breakdown ${breakdownId} not found, skipping`);
        continue;
      }

      // Perform deletion
      await ctx.db.delete(breakdownId);

      deletedRecords.push({
        breakdownId,
        previousValues: breakdown,
      });
    }

    // LOG BULK ACTIVITY
    const batchId = await logBulkGovtProjectActivity(
      ctx,
      userId,
      "bulk_deleted",
      deletedRecords.map(r => ({
        breakdownId: r.breakdownId,
        previousValues: r.previousValues,
      })),
      {
        source: "web_ui",
        reason: args.reason || "Bulk deletion",
      }
    );

    return { 
      count: deletedRecords.length, 
      ids: deletedRecords.map(r => r.breakdownId),
      batchId 
    };
  },
});

/**
 * READ: Get a single project breakdown by ID
 * Optionally log as "viewed" activity
 */
export const getProjectBreakdown = query({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    
    return breakdown;
  },
});

/**
 * READ: Get all project breakdowns with optional filtering
 */
export const getProjectBreakdowns = query({
  args: {
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
    municipality: v.optional(v.string()),
    status: v.optional(v.string()), // Here string is fine as it's just for filtering, not inserting
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .collect();

    // Apply filters
    if (args.projectName) {
      breakdowns = breakdowns.filter(b => 
        b.projectName.toLowerCase().includes(args.projectName!.toLowerCase())
      );
    }

    if (args.implementingOffice) {
      breakdowns = breakdowns.filter(b => 
        b.implementingOffice.toLowerCase().includes(args.implementingOffice!.toLowerCase())
      );
    }

    if (args.municipality) {
      breakdowns = breakdowns.filter(b => 
        b.municipality?.toLowerCase().includes(args.municipality!.toLowerCase())
      );
    }

    if (args.status) {
      breakdowns = breakdowns.filter(b => b.status === args.status);
    }

    // Apply limit
    if (args.limit) {
      breakdowns = breakdowns.slice(0, args.limit);
    }

    return breakdowns;
  },
});

/**
 * LOG VIEW: Manually log a "viewed" activity
 * Use this for tracking when users view specific breakdowns
 */
export const logBreakdownView = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) {
      throw new Error("Breakdown not found");
    }

    // LOG VIEW ACTIVITY
    await logGovtProjectActivity(ctx, userId, {
      action: "viewed",
      breakdownId: args.breakdownId,
      breakdown: breakdown,
      source: "web_ui",
    });

    return { success: true };
  },
});

/**
 * LOG EXPORT: Log when breakdowns are exported
 */
export const logBreakdownExport = mutation({
  args: {
    breakdownIds: v.array(v.id("govtProjectBreakdowns")),
    exportFormat: v.optional(v.string()), // "excel", "pdf", "csv"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all breakdowns being exported
    const breakdowns = await Promise.all(
      args.breakdownIds.map(id => ctx.db.get(id))
    );

    // Log export activity for each breakdown
    const validBreakdowns = breakdowns.filter(b => b !== null);
    
    for (let i = 0; i < validBreakdowns.length; i++) {
      const breakdown = validBreakdowns[i];
      if (breakdown) {
        await logGovtProjectActivity(ctx, userId, {
          action: "exported",
          breakdownId: args.breakdownIds[i],
          breakdown: breakdown,
          source: "web_ui",
          reason: args.exportFormat ? `Exported as ${args.exportFormat}` : undefined,
        });
      }
    }

    return { success: true, count: validBreakdowns.length };
  },
});