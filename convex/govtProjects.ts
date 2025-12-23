// convex/govtProjects.ts
// 🆕 ENHANCED: Now validates implementing agencies and updates usage counts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logGovtProjectActivity, logBulkGovtProjectActivity } from "./lib/govtProjectActivityLogger";
import { recalculateProjectMetrics } from "./lib/projectAggregation";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Reusable status validator
const statusValidator = v.union(
  v.literal("completed"),
  v.literal("delayed"),
  v.literal("ongoing")
);

/**
 * CREATE: Single project breakdown row
 * 🆕 ENHANCED: Now validates implementing agency
 */
export const createProjectBreakdown = mutation({
  args: {
      projectName: v.string(),
      implementingOffice: v.string(),
      projectId: v.optional(v.id("projects")),
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

        // Validate implementing agency exists and is active
        const agency = await ctx.db
          .query("implementingAgencies")
          .withIndex("code", (q) => q.eq("code", args.implementingOffice))
          .first();
        
        if (!agency) {
          throw new Error(
            `Implementing agency "${args.implementingOffice}" does not exist. Please add it in Implementing Agencies management first.`
          );
        }

        if (!agency.isActive) {
          throw new Error(
            `Implementing agency "${args.implementingOffice}" is inactive and cannot be used. Please activate it first.`
          );
        }

        const now = Date.now();
        const { reason, ...breakdownData } = args;
        
        // Verify parent project exists if provided
        if (args.projectId) {
            const project = await ctx.db.get(args.projectId);
            if (!project) throw new Error("Parent project not found");
        }

        // Insert the breakdown
        const breakdownId = await ctx.db.insert("govtProjectBreakdowns", {
            ...breakdownData,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            updatedBy: userId,
            isDeleted: false,
        });

        // Update usage count for implementing agency
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
          code: args.implementingOffice,
          usageContext: "breakdown",
          delta: 1,
        });

        // Log the activity
        const createdBreakdown = await ctx.db.get(breakdownId);
        await logGovtProjectActivity(ctx, userId, {
            action: "created",
            breakdownId: breakdownId,
            breakdown: createdBreakdown,
            newValues: createdBreakdown,
            source: "web_ui",
            reason: reason,
        });

        // ✅ RECALCULATE PARENT PROJECT METRICS
        // This aggregates the new budget figures into the parent Project
        if (args.projectId) {
            await recalculateProjectMetrics(ctx, args.projectId, userId);
        }

        return { breakdownId };
    },
});

/**
 * UPDATE: Single project breakdown row
 * 🆕 ENHANCED: Now validates implementing agency if changed
 */
export const updateProjectBreakdown = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
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

    const previousBreakdown = await ctx.db.get(breakdownId);
    if (!previousBreakdown) {
      throw new Error("Breakdown not found");
    }

    // Handle Implementing Office Change
    const newImplementingOffice = args.implementingOffice;
    if (newImplementingOffice && newImplementingOffice !== previousBreakdown.implementingOffice) {
      const agency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", newImplementingOffice))
        .first();
      
      if (!agency) {
        throw new Error(`Implementing agency "${newImplementingOffice}" does not exist.`);
      }
      if (!agency.isActive) {
        throw new Error(`Implementing agency "${newImplementingOffice}" is inactive.`);
      }

      // Decrement old agency usage
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: previousBreakdown.implementingOffice,
        usageContext: "breakdown",
        delta: -1,
      });
      // Increment new agency usage
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: newImplementingOffice,
        usageContext: "breakdown",
        delta: 1,
      });
    }

    const oldProjectId = previousBreakdown.projectId;

    // Perform Update
    await ctx.db.patch(breakdownId, {
      ...updates,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    const updatedBreakdown = await ctx.db.get(breakdownId);

    // Log Activity
    await logGovtProjectActivity(ctx, userId, {
      action: "updated",
      breakdownId: breakdownId,
      breakdown: updatedBreakdown,
      previousValues: previousBreakdown,
      newValues: updatedBreakdown,
      source: "web_ui",
      reason: reason,
    });

    // ✅ RECALCULATE PARENT PROJECTS
    // If the breakdown was moved to a different project, recalculate the old one
    if (oldProjectId && oldProjectId !== args.projectId) {
      await recalculateProjectMetrics(ctx, oldProjectId, userId);
    }

    // Recalculate the current (or new) parent project
    // This updates the Project's Obligated and Utilized budgets
    if (args.projectId) {
      await recalculateProjectMetrics(ctx, args.projectId, userId);
    } else if (oldProjectId && args.projectId === undefined) {
      // If args.projectId wasn't passed (it's optional in update), it means it didn't change.
      // We must recalculate the existing parent to reflect budget changes.
      await recalculateProjectMetrics(ctx, oldProjectId, userId);
    }

    return { success: true, breakdownId };
  },
});

/**
 * HARD DELETE: Permanent Removal
 */
export const deleteProjectBreakdown = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) throw new Error("Breakdown not found");

    const projectId = breakdown.projectId;

    // Delete record
    await ctx.db.delete(args.breakdownId);

    // Update usage count for implementing agency
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: breakdown.implementingOffice,
      usageContext: "breakdown",
      delta: -1,
    });

    // Log activity
    await logGovtProjectActivity(ctx, userId, {
      action: "deleted",
      breakdownId: args.breakdownId,
      previousValues: breakdown,
      source: "web_ui",
      reason: args.reason,
    });

    // ✅ RECALCULATE PARENT PROJECT
    if (projectId) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { success: true };
  },
});

/**
 * BULK CREATE: Multiple project breakdowns
 * 🆕 ENHANCED: Now validates implementing agencies for bulk operations
 */
export const bulkCreateBreakdowns = mutation({
  args: {
    breakdowns: v.array(v.object({
      projectName: v.string(),
      implementingOffice: v.string(),
      projectId: v.optional(v.id("projects")),
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

    // Validate all implementing agencies first
    const uniqueAgencies = new Set(args.breakdowns.map(b => b.implementingOffice));
    for (const agencyCode of uniqueAgencies) {
      const agency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", agencyCode))
        .first();
      
      if (!agency) {
        throw new Error(`Implementing agency "${agencyCode}" does not exist.`);
      }
      if (!agency.isActive) {
        throw new Error(`Implementing agency "${agencyCode}" is inactive.`);
      }
    }

    const now = Date.now();
    const insertedRecords: Array<{ 
      breakdownId: Id<"govtProjectBreakdowns">; 
      breakdown: any 
    }> = [];
    const affectedProjects = new Set<Id<"projects">>();

    // Insert Loop
    for (const breakdown of args.breakdowns) {
      const breakdownId = await ctx.db.insert("govtProjectBreakdowns", {
        ...breakdown,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
        isDeleted: false,
      });
      const createdBreakdown = await ctx.db.get(breakdownId);
      insertedRecords.push({ breakdownId, breakdown: createdBreakdown });
      
      if (breakdown.projectId) {
        affectedProjects.add(breakdown.projectId);
      }
    }

    // Bulk Update Agency Usage Counts
    for (const agencyCode of uniqueAgencies) {
      const count = args.breakdowns.filter(b => b.implementingOffice === agencyCode).length;
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: agencyCode,
        usageContext: "breakdown",
        delta: count,
      });
    }

    // Log Bulk Activity
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

    // ✅ RECALCULATE ALL AFFECTED PARENT PROJECTS
    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: insertedRecords.length, 
      ids: insertedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size,
    };
  },
});

export const getBreakdownStats = query({
  args: {
    budgetItemId: v.optional(v.id("budgetItems")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let allBreakdowns = [];
    
    if (args.budgetItemId) {
      // Find all projects for this budget item
      const projects = await ctx.db
        .query("projects")
        .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.budgetItemId))
        .collect();
      
      // Collect breakdowns for these projects
      const breakdownPromises = projects.map(project =>
        ctx.db
          .query("govtProjectBreakdowns")
          .withIndex("projectId", (q) => q.eq("projectId", project._id))
          .filter((q) => q.neq(q.field("isDeleted"), true)) // Exclude trash
          .collect()
      );
      
      const allBreakdownArrays = await Promise.all(breakdownPromises);
      allBreakdowns = allBreakdownArrays.flat();
    } else {
      allBreakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .filter((q) => q.neq(q.field("isDeleted"), true)) // Exclude trash
        .collect();
    }

    const totalBreakdowns = allBreakdowns.length;
    const totalAllocated = allBreakdowns.reduce((sum, b) => sum + (b.allocatedBudget || 0), 0);
    const totalUtilized = allBreakdowns.reduce((sum, b) => sum + (b.budgetUtilized || 0), 0);
    
    const statusCounts = allBreakdowns.reduce(
      (acc, b) => {
        if (b.status === "completed") acc.completed++;
        else if (b.status === "delayed") acc.delayed++;
        else if (b.status === "ongoing") acc.ongoing++;
        return acc;
      },
      { completed: 0, delayed: 0, ongoing: 0 }
    );

    return {
      totalBreakdowns,
      totalAllocated,
      totalUtilized,
      statusCounts,
      utilizationRate: totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0,
    };
  },
});

/**
 * BULK UPDATE: Multiple project breakdowns
 * 🆕 ENHANCED: Now validates implementing agencies for bulk operations
 */
export const bulkUpdateBreakdowns = mutation({
  args: {
    updates: v.array(v.object({
      breakdownId: v.id("govtProjectBreakdowns"),
      projectName: v.optional(v.string()),
      implementingOffice: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
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

    // Validate any NEW implementing agencies
    const newAgencies = new Set(
      args.updates
        .map(u => u.implementingOffice)
        .filter((office): office is string => office !== undefined)
    );

    for (const agencyCode of newAgencies) {
      const agency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", agencyCode))
        .first();
      
      if (!agency) {
        throw new Error(`Implementing agency "${agencyCode}" does not exist.`);
      }
      if (!agency.isActive) {
        throw new Error(`Implementing agency "${agencyCode}" is inactive.`);
      }
    }

    const now = Date.now();
    const updatedRecords: Array<{
      breakdownId: Id<"govtProjectBreakdowns">;
      breakdown: any;
      previousValues: any;
      newValues: any;
    }> = [];
    const affectedProjects = new Set<Id<"projects">>();
    const agencyChanges = new Map<string, number>();

    for (const update of args.updates) {
      const { breakdownId, ...updateData } = update;
      const previousBreakdown = await ctx.db.get(breakdownId);
      if (!previousBreakdown) continue;

      // Track Parent Projects for recalculation
      if (previousBreakdown.projectId) affectedProjects.add(previousBreakdown.projectId);
      if (update.projectId) affectedProjects.add(update.projectId);

      // Track Agency Changes
      const newOffice = update.implementingOffice;
      if (newOffice && newOffice !== previousBreakdown.implementingOffice) {
        const oldAgency = previousBreakdown.implementingOffice;
        agencyChanges.set(oldAgency, (agencyChanges.get(oldAgency) || 0) - 1);
        agencyChanges.set(newOffice, (agencyChanges.get(newOffice) || 0) + 1);
      }

      await ctx.db.patch(breakdownId, {
        ...updateData,
        updatedAt: now,
        updatedBy: userId,
      });
      const updatedBreakdown = await ctx.db.get(breakdownId);

      updatedRecords.push({
        breakdownId,
        breakdown: updatedBreakdown,
        previousValues: previousBreakdown,
        newValues: updatedBreakdown,
      });
    }

    // Apply Agency Changes
    for (const [agencyCode, delta] of agencyChanges.entries()) {
      if (delta !== 0) {
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
          code: agencyCode,
          usageContext: "breakdown",
          delta: delta,
        });
      }
    }

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

    // ✅ RECALCULATE ALL AFFECTED PARENT PROJECTS
    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: updatedRecords.length, 
      ids: updatedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size,
    };
  },
});

/**
 * BULK DELETE: Multiple project breakdowns
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

    const affectedProjects = new Set<Id<"projects">>();
    const agencyUsage = new Map<string, number>();

    for (const breakdownId of args.breakdownIds) {
      const breakdown = await ctx.db.get(breakdownId);
      if (!breakdown) continue;

      const agency = breakdown.implementingOffice;
      agencyUsage.set(agency, (agencyUsage.get(agency) || 0) + 1);

      if (breakdown.projectId) {
        affectedProjects.add(breakdown.projectId);
      }

      await ctx.db.delete(breakdownId);
      deletedRecords.push({
        breakdownId,
        previousValues: breakdown,
      });
    }

    // Update Agency Counts
    for (const [agencyCode, count] of agencyUsage.entries()) {
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: agencyCode,
        usageContext: "breakdown",
        delta: -count,
      });
    }

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

    // ✅ RECALCULATE ALL AFFECTED PARENT PROJECTS
    for (const projectId of affectedProjects) {
      await recalculateProjectMetrics(ctx, projectId, userId);
    }

    return { 
      count: deletedRecords.length, 
      ids: deletedRecords.map(r => r.breakdownId),
      batchId,
      affectedProjects: affectedProjects.size,
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

    return await ctx.db.get(args.breakdownId);
  },
});

/**
 * Get ACTIVE breakdowns (Hidden Trash)
 * 🔧 UPDATED: Enhanced to properly handle projectId filtering using index
 */
export const getProjectBreakdowns = query({
  args: {
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
    municipality: v.optional(v.string()),
    status: v.optional(v.string()),
    projectId: v.optional(v.id("projects")), // 🔧 Key filter
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let breakdowns;

    // 🔧 CRITICAL: Use index when filtering by projectId
    if (args.projectId) {
      breakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .withIndex("projectId", (q) => q.eq("projectId", args.projectId!))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect();
    } else {
      breakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect();
    }

    // Apply additional filters
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

    // Sort by most recent first
    breakdowns.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (args.limit) {
      breakdowns = breakdowns.slice(0, args.limit);
    }

    return breakdowns;
  },
});

/**
 * Get TRASHED breakdowns only
 */
export const getTrash = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("isDeleted", (q) => q.eq("isDeleted", true))
      .order("desc")
      .collect();
  },
});

/**
 * Soft Delete: Move Breakdown to Trash
 */
export const moveToTrash = mutation({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) throw new Error("Breakdown not found");

    // Mark as deleted
    await ctx.db.patch(args.breakdownId, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: userId
    });

    // Decrement usage count (since it's no longer "active")
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: breakdown.implementingOffice,
      usageContext: "breakdown",
      delta: -1,
    });

    // ✅ RECALCULATE PARENT PROJECT
    // Since this is now "deleted", recalculation will exclude its budget figures from the parent totals
    if (breakdown.projectId) {
      await recalculateProjectMetrics(ctx, breakdown.projectId, userId);
    }

    // Log Activity
    await logGovtProjectActivity(ctx, userId, {
      action: "updated",
      breakdownId: args.breakdownId,
      previousValues: breakdown,
      newValues: { ...breakdown, isDeleted: true },
      source: "web_ui",
      reason: args.reason || "Moved to trash",
    });

    return { success: true };
  },
});

/**
 * Restore Breakdown from Trash
 */
export const restoreFromTrash = mutation({
  args: { breakdownId: v.id("govtProjectBreakdowns") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const breakdown = await ctx.db.get(args.breakdownId);
    if (!breakdown) throw new Error("Breakdown not found");

    // Mark as active
    await ctx.db.patch(args.breakdownId, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined
    });

    // Increment usage count back
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: breakdown.implementingOffice,
      usageContext: "breakdown",
      delta: 1,
    });

    // ✅ RECALCULATE PARENT PROJECT
    // Recalculation will now include this breakdown's budget figures again
    if (breakdown.projectId) {
      await recalculateProjectMetrics(ctx, breakdown.projectId, userId);
    }

    return { success: true };
  },
});

/**
 * 🆕 MANUAL RECALCULATION: Recalculate specific project
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