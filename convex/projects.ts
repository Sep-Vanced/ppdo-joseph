// convex/projects.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { recalculateBudgetItemMetrics } from "./lib/budgetAggregation";
import { logProjectActivity } from "./lib/projectActivityLogger";

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
 * ⚠️ UPDATED: Removed projectCompleted, projectDelayed, projectsOnTrack, and status
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
    targetDateCompletion: v.optional(v.number()),
    projectManagerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // [Existing Validation Logic...]
    if (args.budgetItemId) {
      const budgetItem = await ctx.db.get(args.budgetItemId);
      if (!budgetItem) throw new Error("Budget item not found");
    }

    const now = Date.now();
    const utilizationRate = args.totalBudgetAllocated > 0
        ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
        : 0;

    const projectId = await ctx.db.insert("projects", {
      particulars: args.particulars,
      budgetItemId: args.budgetItemId,
      implementingOffice: args.implementingOffice,
      totalBudgetAllocated: args.totalBudgetAllocated,
      obligatedBudget: args.obligatedBudget,
      totalBudgetUtilized: args.totalBudgetUtilized,
      utilizationRate,
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOnTrack: 0,
      status: "ongoing",
      remarks: args.remarks,
      year: args.year,
      targetDateCompletion: args.targetDateCompletion,
      projectManagerId: args.projectManagerId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // [NEW] Log Activity
    const newProject = await ctx.db.get(projectId);
    await logProjectActivity(ctx, userId, {
      action: "created",
      projectId: projectId,
      newValues: newProject,
      reason: "New project creation"
    });

    if (args.budgetItemId) {
      await recalculateBudgetItemMetrics(ctx, args.budgetItemId, userId);
    }

    return projectId;
  },
});

/**
 * Update an existing project
 * ⚠️ UPDATED: Removed projectCompleted, projectDelayed, projectsOnTrack, and status
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
    targetDateCompletion: v.optional(v.number()),
    projectManagerId: v.optional(v.id("users")),
    reason: v.optional(v.string()), // [NEW] Allow passing a reason
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Project not found");

    // [Validation Logic...]
    if (args.budgetItemId) {
      const budgetItem = await ctx.db.get(args.budgetItemId);
      if (!budgetItem) throw new Error("Budget item not found");
    }

    const now = Date.now();
    const utilizationRate = args.totalBudgetAllocated > 0
        ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
        : 0;
    
    const oldBudgetItemId = existing.budgetItemId;

    const { reason, ...updates } = args;

    await ctx.db.patch(args.id, {
      particulars: args.particulars,
      budgetItemId: args.budgetItemId,
      implementingOffice: args.implementingOffice,
      totalBudgetAllocated: args.totalBudgetAllocated,
      obligatedBudget: args.obligatedBudget,
      totalBudgetUtilized: args.totalBudgetUtilized,
      utilizationRate,
      remarks: args.remarks,
      year: args.year,
      targetDateCompletion: args.targetDateCompletion,
      projectManagerId: args.projectManagerId,
      updatedAt: now,
      updatedBy: userId,
    });

    // [NEW] Log Activity
    const updatedProject = await ctx.db.get(args.id);
    await logProjectActivity(ctx, userId, {
      action: "updated",
      projectId: args.id,
      previousValues: existing,
      newValues: updatedProject,
      reason: args.reason
    });

    // Recalculation logic...
    const budgetItemsToRecalculate = new Set<string>();
    if (oldBudgetItemId && oldBudgetItemId !== args.budgetItemId) {
      budgetItemsToRecalculate.add(oldBudgetItemId);
    }
    if (args.budgetItemId) {
      budgetItemsToRecalculate.add(args.budgetItemId);
    }
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
  args: { 
    id: v.id("projects"),
    reason: v.optional(v.string()) // [NEW]
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Project not found");

    const budgetItemId = existing.budgetItemId;
    
    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", (q) => q.eq("projectId", args.id))
      .collect();

    if (breakdowns.length > 0) {
      throw new Error(`Cannot delete project with ${breakdowns.length} breakdown(s).`);
    }

    // [NEW] Log Activity BEFORE delete (so we capture the data)
    await logProjectActivity(ctx, userId, {
      action: "deleted",
      projectId: args.id, // ID is kept for reference even if record is gone
      previousValues: existing,
      reason: args.reason || "Project deleted"
    });

    await ctx.db.delete(args.id);

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