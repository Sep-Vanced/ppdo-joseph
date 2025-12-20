// convex/projects.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { recalculateBudgetItemMetrics } from "./lib/budgetAggregation";
import { logProjectActivity } from "./lib/projectActivityLogger";

/**
 * Get ACTIVE projects (Hidden Trash)
 */
export const list = query({
  args: {
    budgetItemId: v.optional(v.id("budgetItems")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    let projects;

    // [FIX] Use distinct queries instead of trying to mutate a query variable
    if (args.budgetItemId) {
      // Use index if ID is provided
      projects = await ctx.db
        .query("projects")
        .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.budgetItemId))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .order("desc")
        .collect();
    } else {
      // Full table scan if no ID provided
      projects = await ctx.db
        .query("projects")
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .order("desc")
        .collect();
    }

    return projects;
  },
});

/**
 * Get TRASHED projects only
 */
export const getTrash = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("projects")
      .withIndex("isDeleted", (q) => q.eq("isDeleted", true))
      .order("desc")
      .collect();
  },
});

/**
 * Soft Delete: Move Project to Trash
 */
export const moveToTrash = mutation({
  args: { 
    id: v.id("projects"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Project not found");

    // 1. Trash Project
    await ctx.db.patch(args.id, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      updatedAt: now,
      updatedBy: userId
    });

    // 2. Trash Linked Breakdowns (Cascade)
    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", (q) => q.eq("projectId", args.id))
      .collect();

    for (const breakdown of breakdowns) {
      await ctx.db.patch(breakdown._id, {
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId
      });
    }

    // 3. Recalculate Parent Budget to remove this project from totals
    if (existing.budgetItemId) {
      await recalculateBudgetItemMetrics(ctx, existing.budgetItemId, userId);
    }

    // Log Activity
    await logProjectActivity(ctx, userId, {
      action: "updated",
      projectId: args.id,
      previousValues: existing,
      newValues: { ...existing, isDeleted: true },
      reason: args.reason || "Moved to trash"
    });

    return { success: true, message: "Project moved to trash" };
  },
});

/**
 * Restore Project from Trash
 */
export const restoreFromTrash = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Project not found");

    // 1. Restore Project
    await ctx.db.patch(args.id, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      updatedAt: Date.now()
    });

    // 2. Restore Breakdowns (Only those that were deleted at the same time?)
    // Simple robust approach: Restore all children
    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", (q) => q.eq("projectId", args.id))
      .collect();

    for (const breakdown of breakdowns) {
      // Only restore if it looks like it was cascade deleted (check timestamp or just restore all)
      if (breakdown.isDeleted) {
        await ctx.db.patch(breakdown._id, {
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined
        });
      }
    }

    // 3. Recalculate Parent Budget to add this project back to totals
    if (existing.budgetItemId) {
      await recalculateBudgetItemMetrics(ctx, existing.budgetItemId, userId);
    }

    return { success: true, message: "Project restored" };
  },
});

/**
 * Get a single project by ID
 */
export const get = query({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        const project = await ctx.db.get(args.id);
        if (!project || project.isDeleted) throw new Error("Project not found");
        if (project.createdBy !== userId) throw new Error("Not authorized");
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
            isDeleted: false, // Init
        });

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
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Project not found");

        if (args.budgetItemId) {
            const budgetItem = await ctx.db.get(args.budgetItemId);
            if (!budgetItem) throw new Error("Budget item not found");
        }

        const now = Date.now();
        const utilizationRate = args.totalBudgetAllocated > 0
            ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
            : 0;
        
        const oldBudgetItemId = existing.budgetItemId;
        
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

        const updatedProject = await ctx.db.get(args.id);
        await logProjectActivity(ctx, userId, {
            action: "updated",
            projectId: args.id,
            previousValues: existing,
            newValues: updatedProject,
            reason: args.reason
        });

        if (oldBudgetItemId && oldBudgetItemId !== args.budgetItemId) {
            await recalculateBudgetItemMetrics(ctx, oldBudgetItemId, userId);
        }
        if (args.budgetItemId) {
            await recalculateBudgetItemMetrics(ctx, args.budgetItemId, userId);
        }

        return args.id;
    },
});

/**
 * HARD DELETE: Permanent Removal
 */
export const remove = mutation({
  args: { 
    id: v.id("projects"),
    reason: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // [FIX] Get current user to check roles properly if needed
    const currentUser = await ctx.db.get(userId);
    if (!currentUser) throw new Error("User not found");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Project not found");

    // Optional: Add authorization check here if you want consistency
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isCreator = existing.createdBy === userId;
    if (!isCreator && !isSuperAdmin) throw new Error("Not authorized");

    const budgetItemId = existing.budgetItemId;
    
    // 1. Get Linked Breakdowns
    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", (q) => q.eq("projectId", args.id))
      .collect();

    // 2. Permanent Delete Children
    for (const breakdown of breakdowns) {
      await ctx.db.delete(breakdown._id);
    }

    // 3. Log
    await logProjectActivity(ctx, userId, {
      action: "deleted",
      projectId: args.id, 
      previousValues: existing,
      reason: args.reason || "Permanent Delete"
    });

    // 4. Permanent Delete Project
    await ctx.db.delete(args.id);

    // 5. Update Parent
    if (budgetItemId) {
      await recalculateBudgetItemMetrics(ctx, budgetItemId, userId);
    }

    return { success: true };
  },
});

/**
 * Toggle pin status for a project
 */
export const togglePin = mutation({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Project not found");
        if (existing.createdBy !== userId) throw new Error("Not authorized");
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