// convex/projects.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { recalculateBudgetItemMetrics } from "./lib/budgetAggregation";

/**
 * Get all projects (optionally filtered by budgetItemId)
 */
export const list = query({
  args: {
    budgetItemId: v.optional(v.id("budgetItems")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    let projects;

    if (args.budgetItemId) {
      projects = await ctx.db
        .query("projects")
        .withIndex("budgetItemId", (q) =>
          q.eq("budgetItemId", args.budgetItemId)
        )
        .order("desc")
        .collect();
    } else {
      projects = await ctx.db
        .query("projects")
        .order("desc")
        .collect();
    }

    return projects;
  },
});

/**
 * Get a single project by ID
 */
export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.id);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.createdBy !== userId) {
      throw new Error("Not authorized");
    }

    return project;
  },
});

/**
 * Create a new project
 * ⚠️ UPDATED: Removed projectCompleted, projectDelayed, projectsOnTrack
 * These are now auto-calculated from govtProjectBreakdowns
 */
export const create = mutation({
  args: {
    particulars: v.string(),
    budgetItemId: v.optional(v.id("budgetItems")),
    implementingOffice: v.string(),
    totalBudgetAllocated: v.number(),
    obligatedBudget: v.optional(v.number()),
    totalBudgetUtilized: v.number(),
    remarks: v.optional(v.string()),
    year: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("done"), v.literal("delayed"), v.literal("pending"), v.literal("ongoing"))
    ),
    targetDateCompletion: v.optional(v.number()),
    projectManagerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Verify budgetItem exists if provided
    if (args.budgetItemId) {
      const budgetItem = await ctx.db.get(args.budgetItemId);
      if (!budgetItem) {
        throw new Error("Budget item not found");
      }
      if (budgetItem.createdBy !== userId) {
        throw new Error("Not authorized to add projects to this budget item");
      }
    }

    const now = Date.now();

    // Calculate utilization rate
    const utilizationRate =
      args.totalBudgetAllocated > 0
        ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
        : 0;

    // ⚠️ CHANGED: Initialize project counts to 0
    // They will be calculated when govtProjectBreakdowns are added
    const projectId = await ctx.db.insert("projects", {
      particulars: args.particulars,
      budgetItemId: args.budgetItemId,
      implementingOffice: args.implementingOffice,
      totalBudgetAllocated: args.totalBudgetAllocated,
      obligatedBudget: args.obligatedBudget,
      totalBudgetUtilized: args.totalBudgetUtilized,
      utilizationRate,
      projectCompleted: 0, // ⚠️ Auto-calculated
      projectDelayed: 0, // ⚠️ Auto-calculated
      projectsOnTrack: 0, // ⚠️ Auto-calculated
      remarks: args.remarks,
      year: args.year,
      status: args.status,
      targetDateCompletion: args.targetDateCompletion,
      projectManagerId: args.projectManagerId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // 🎯 TRIGGER: Recalculate parent budgetItem metrics if linked
    if (args.budgetItemId) {
      await recalculateBudgetItemMetrics(ctx, args.budgetItemId, userId);
    }

    return projectId;
  },
});

/**
 * Update an existing project
 * ⚠️ UPDATED: Removed projectCompleted, projectDelayed, projectsOnTrack
 */
export const update = mutation({
  args: {
    id: v.id("projects"),
    particulars: v.string(),
    budgetItemId: v.optional(v.id("budgetItems")),
    implementingOffice: v.string(),
    totalBudgetAllocated: v.number(),
    obligatedBudget: v.optional(v.number()),
    totalBudgetUtilized: v.number(),
    remarks: v.optional(v.string()),
    year: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("done"), v.literal("delayed"), v.literal("pending"), v.literal("ongoing"))
    ),
    targetDateCompletion: v.optional(v.number()),
    projectManagerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Project not found");
    }

    if (existing.createdBy !== userId) {
      throw new Error("Not authorized");
    }

    // Verify new budgetItem exists if provided
    if (args.budgetItemId) {
      const budgetItem = await ctx.db.get(args.budgetItemId);
      if (!budgetItem) {
        throw new Error("Budget item not found");
      }
      if (budgetItem.createdBy !== userId) {
        throw new Error("Not authorized to link to this budget item");
      }
    }

    const now = Date.now();

    // Calculate utilization rate
    const utilizationRate =
      args.totalBudgetAllocated > 0
        ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
        : 0;

    // Store old budgetItemId to recalculate if it changed
    const oldBudgetItemId = existing.budgetItemId;

    // ⚠️ CHANGED: Don't update project counts - they're auto-calculated
    await ctx.db.patch(args.id, {
      particulars: args.particulars,
      budgetItemId: args.budgetItemId,
      implementingOffice: args.implementingOffice,
      totalBudgetAllocated: args.totalBudgetAllocated,
      obligatedBudget: args.obligatedBudget,
      totalBudgetUtilized: args.totalBudgetUtilized,
      utilizationRate,
      // ⚠️ PROJECT COUNTS NOT UPDATED - Maintained by govtProjectBreakdowns
      remarks: args.remarks,
      year: args.year,
      status: args.status,
      targetDateCompletion: args.targetDateCompletion,
      projectManagerId: args.projectManagerId,
      updatedAt: now,
      updatedBy: userId,
    });

    // 🎯 TRIGGER: Recalculate metrics for affected budget items
    const budgetItemsToRecalculate = new Set<string>();

    // Add old parent if it exists and is different from new parent
    if (oldBudgetItemId && oldBudgetItemId !== args.budgetItemId) {
      budgetItemsToRecalculate.add(oldBudgetItemId);
    }

    // Add new parent if it exists
    if (args.budgetItemId) {
      budgetItemsToRecalculate.add(args.budgetItemId);
    }

    // Recalculate all affected budget items
    for (const budgetItemId of budgetItemsToRecalculate) {
      await recalculateBudgetItemMetrics(ctx, budgetItemId as any, userId);
    }

    return args.id;
  },
});

/**
 * Delete a project
 * After deletion, automatically recalculates parent budgetItem metrics
 */
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Project not found");
    }

    if (existing.createdBy !== userId) {
      throw new Error("Not authorized");
    }

    // Store budgetItemId before deletion
    const budgetItemId = existing.budgetItemId;

    // Check for related obligations
    const obligations = await ctx.db
      .query("obligations")
      .withIndex("projectId", (q) => q.eq("projectId", args.id))
      .collect();

    if (obligations.length > 0) {
      throw new Error(
        `Cannot delete project with ${obligations.length} obligation(s). Delete the obligations first.`
      );
    }

    // Delete the project
    await ctx.db.delete(args.id);

    // 🎯 TRIGGER: Recalculate parent budgetItem metrics if it was linked
    if (budgetItemId) {
      await recalculateBudgetItemMetrics(ctx, budgetItemId, userId);
    }

    return args.id;
  },
});

/**
 * Toggle pin status for a project
 */
export const togglePin = mutation({
  args: {
    id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Project not found");
    }

    if (existing.createdBy !== userId) {
      throw new Error("Not authorized");
    }

    const now = Date.now();
    const newPinnedState = !existing.isPinned;

    await ctx.db.patch(args.id, {
      isPinned: newPinnedState,
      pinnedAt: newPinnedState ? now : undefined,
      pinnedBy: newPinnedState ? userId : undefined,
      updatedAt: now,
      updatedBy: userId,
    });

    return args.id;
  },
});