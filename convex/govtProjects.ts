// convex/govtProjects.ts
// Government Project Breakdowns CRUD Operations with Complete Activity Logging
// 🆕 NOW WITH AUTO-AGGREGATION TO PARENT PROJECTS

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logGovtProjectActivity, logBulkGovtProjectActivity } from "./lib/govtProjectActivityLogger";
import { recalculateProjectMetrics } from "./lib/projectAggregation"; // 🆕 IMPORT
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
 * WITH ACTIVITY LOGGING + AUTO-AGGREGATION
 */
export const createProjectBreakdown = mutation({
  args: {
    projectName: v.string(),
    implementingOffice: v.string(),
    projectId: v.optional(v.id("projects")), // 🆕 LINK TO PARENT PROJECT
    municipality: v.optional(v.string()),
    barangay: v.optional(v.string()),
    district: v.optional(v.string()),
    allocatedBudget: v.optional(v.number()),
    obligatedBudget: v.optional(v.number()),
    budgetUtilized: v.optional(v.number()),
    balance: v.optional(v.number()),
    status: v.optional(statusValidator),
    dateStarted: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    completionDate: v.optional(v.number()),
    remarks: v.optional(v.string()),
    reason: v.optional(v.string()),
    projectTitle: v.optional(v.string()),
    utilizationRate: v.optional(v.number()),
    projectAccomplishment: v.optional(v.number()),
    reportDate: v.optional(v.number()),
    batchId: v.optional(v.string()),
    fundSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const { reason, ...breakdownData } = args;

    // 🆕 Verify project exists if provided
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("Parent project not found");
      }
    }

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

    // 🎯 TRIGGER: Recalculate parent project metrics if linked
    if (args.projectId) {
      await recalculateProjectMetrics(ctx, args.projectId, userId);
    }

    return { breakdownId };
  },
});

/**
 * UPDATE: Single project breakdown row
 * WITH ACTIVITY LOGGING + AUTO-AGGREGATION
 */
export const updateProjectBreakdown = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
    projectId: v.optional(v.id("projects")), // 🆕 CAN CHANGE PARENT
    municipality: v.optional(v.string()),
    barangay: v.optional(v.string()),
    district: v.optional(v.string()),
    allocatedBudget: v.optional(v.number()),
    obligatedBudget: v.optional(v.number()),
    budgetUtilized: v.optional(v.number()),
    balance: v.optional(v.number()),
    status: v.optional(statusValidator),
    dateStarted: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    completionDate: v.optional(v.number()),
    remarks: v.optional(v.string()),
    reason: v.optional(v.string()),
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

    // 🆕 Verify new project exists if provided
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("Parent project not found");
      }
    }

    // Store old projectId to recalculate if it changed
    const oldProjectId = previousBreakdown.projectId;

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

    // 🎯 TRIGGER: Recalculate metrics for affected projects
    const projectsToRecalculate = new Set<Id<"projects">>();

    // Add old parent if it exists and is different from new parent
    if (oldProjectId && oldProjectId !== args.projectId) {
      projectsToRecalculate.add(oldProjectId);
    }

    // Add new parent if it exists
    if (args.projectId) {
      projectsToRecalculate.add(args.projectId);
    }

    // Recalculate all affected projects
    for (const projectId of projectsToRecalculate) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { success: true, breakdownId };
  },
});

/**
 * DELETE: Single project breakdown row
 * WITH ACTIVITY LOGGING + AUTO-AGGREGATION
 */
export const deleteProjectBreakdown = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // GET VALUES BEFORE DELETION
    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) {
      throw new Error("Breakdown not found");
    }

    // Store projectId before deletion
    const projectId = breakdown.projectId;

    // Perform the deletion
    await ctx.db.delete(args.breakdownId);

    // LOG ACTIVITY
    await logGovtProjectActivity(ctx, userId, {
      action: "deleted",
      breakdownId: args.breakdownId,
      previousValues: breakdown,
      source: "web_ui",
      reason: args.reason,
    });

    // 🎯 TRIGGER: Recalculate parent project metrics if it was linked
    if (projectId) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { success: true };
  },
});

/**
 * BULK CREATE: Multiple project breakdowns (Excel import)
 * WITH ACTIVITY LOGGING + AUTO-AGGREGATION
 */
export const bulkCreateBreakdowns = mutation({
  args: {
    breakdowns: v.array(v.object({
      projectName: v.string(),
      implementingOffice: v.string(),
      projectId: v.optional(v.id("projects")), // 🆕 BULK LINK
      municipality: v.optional(v.string()),
      barangay: v.optional(v.string()),
      district: v.optional(v.string()),
      allocatedBudget: v.optional(v.number()),
      obligatedBudget: v.optional(v.number()),
      budgetUtilized: v.optional(v.number()),
      balance: v.optional(v.number()),
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
    const insertedRecords: Array<{ 
      breakdownId: Id<"govtProjectBreakdowns">; 
      breakdown: any 
    }> = [];

    // 🆕 Track affected projects for recalculation
    const affectedProjects = new Set<Id<"projects">>();

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

      // Track project for recalculation
      if (breakdown.projectId) {
        affectedProjects.add(breakdown.projectId);
      }
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

    // 🎯 TRIGGER: Recalculate all affected projects
    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: insertedRecords.length, 
      ids: insertedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size, // 🆕 REPORT
    };
  },
});

/**
 * BULK UPDATE: Multiple project breakdowns
 * WITH ACTIVITY LOGGING + AUTO-AGGREGATION
 */
export const bulkUpdateBreakdowns = mutation({
  args: {
    updates: v.array(v.object({
      breakdownId: v.id("govtProjectBreakdowns"),
      projectName: v.optional(v.string()),
      implementingOffice: v.optional(v.string()),
      projectId: v.optional(v.id("projects")), // 🆕 CAN BULK CHANGE PARENT
      municipality: v.optional(v.string()),
      barangay: v.optional(v.string()),
      district: v.optional(v.string()),
      allocatedBudget: v.optional(v.number()),
      obligatedBudget: v.optional(v.number()),
      budgetUtilized: v.optional(v.number()),
      balance: v.optional(v.number()),
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
    const updatedRecords: Array<{
      breakdownId: Id<"govtProjectBreakdowns">;
      breakdown: any;
      previousValues: any;
      newValues: any;
    }> = [];

    // 🆕 Track affected projects for recalculation
    const affectedProjects = new Set<Id<"projects">>();

    // Update all breakdowns
    for (const update of args.updates) {
      const { breakdownId, ...updateData } = update;

      // Get previous values
      const previousBreakdown = await ctx.db.get(breakdownId);
      if (!previousBreakdown) {
        console.warn(`Breakdown ${breakdownId} not found, skipping`);
        continue;
      }

      // Track old and new projects
      if (previousBreakdown.projectId) {
        affectedProjects.add(previousBreakdown.projectId);
      }
      if (update.projectId) {
        affectedProjects.add(update.projectId);
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

    // 🎯 TRIGGER: Recalculate all affected projects
    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: updatedRecords.length, 
      ids: updatedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size, // 🆕 REPORT
    };
  },
});

/**
 * BULK DELETE: Multiple project breakdowns
 * WITH ACTIVITY LOGGING + AUTO-AGGREGATION
 */
export const bulkDeleteBreakdowns = mutation({
  args: {
    breakdownIds: v.array(v.id("govtProjectBreakdowns")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const deletedRecords: Array<{
      breakdownId: Id<"govtProjectBreakdowns">;
      previousValues: any;
    }> = [];

    // 🆕 Track affected projects for recalculation
    const affectedProjects = new Set<Id<"projects">>();

    // Delete all breakdowns
    for (const breakdownId of args.breakdownIds) {
      // Get values before deletion
      const breakdown = await ctx.db.get(breakdownId);
      if (!breakdown) {
        console.warn(`Breakdown ${breakdownId} not found, skipping`);
        continue;
      }

      // Track project for recalculation
      if (breakdown.projectId) {
        affectedProjects.add(breakdown.projectId);
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

    // 🎯 TRIGGER: Recalculate all affected projects
    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: deletedRecords.length, 
      ids: deletedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size, // 🆕 REPORT
    };
  },
});

/**
 * READ: Get a single project breakdown by ID
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
    status: v.optional(v.string()),
    projectId: v.optional(v.id("projects")), // 🆕 FILTER BY PARENT
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .collect();

    // Apply filters
    if (args.projectId) {
      breakdowns = breakdowns.filter(b => b.projectId === args.projectId);
    }

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
 * 🆕 MANUAL RECALCULATION: Recalculate specific project
 * Use this to manually sync metrics if needed
 */
export const recalculateProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const result = await recalculateProjectMetrics(ctx, args.projectId, userId);

    return {
      success: true,
      projectId: args.projectId,
      ...result,
    };
  },
});

/**
 * 🆕 MANUAL RECALCULATION: Recalculate ALL projects
 * Use with caution - expensive operation
 */
export const recalculateAllProjects = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "super_admin") {
      throw new Error("Only super_admin can recalculate all projects");
    }

    const allProjects = await ctx.db.query("projects").collect();
    const results = [];

    for (const project of allProjects) {
      const result = await recalculateProjectMetrics(ctx, project._id, userId);
      results.push({
        projectId: project._id,
        projectName: project.particulars,
        ...result,
      });
    }

    return {
      success: true,
      totalProjects: allProjects.length,
      results,
    };
  },
});

// Keep existing functions (logBreakdownView, logBreakdownExport) unchanged
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

    await logGovtProjectActivity(ctx, userId, {
      action: "viewed",
      breakdownId: args.breakdownId,
      breakdown: breakdown,
      source: "web_ui",
    });

    return { success: true };
  },
});

export const logBreakdownExport = mutation({
  args: {
    breakdownIds: v.array(v.id("govtProjectBreakdowns")),
    exportFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdowns = await Promise.all(
      args.breakdownIds.map(id => ctx.db.get(id))
    );

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