// convex/budgetItems.ts
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  recalculateBudgetItemMetrics,
  recalculateAllBudgetItems,
} from "./lib/budgetAggregation";
import { logBudgetActivity } from "./lib/budgetActivityLogger";

/**
 * Get all ACTIVE budget items (Hides Trash)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("isDeleted", (q) => q.eq("isDeleted", undefined)) // Or check for false if you set defaults
      .filter((q) => q.neq(q.field("isDeleted"), true)) // Double check filtering
      .order("desc")
      .collect();

    return budgetItems;
  },
});

/**
 * Get TRASHED budget items only
 */
export const getTrash = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("budgetItems")
      .withIndex("isDeleted", (q) => q.eq("isDeleted", true))
      .order("desc")
      .collect();
  },
});

/**
 * Soft Delete: Move Budget Item to Trash
 * Cascades to children (Projects -> Breakdowns)
 */
export const moveToTrash = mutation({
  args: { 
    id: v.id("budgetItems"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Budget Item not found");

    // 1. Trash Budget Item
    await ctx.db.patch(args.id, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      updatedAt: now,
      updatedBy: userId
    });

    // 2. Trash Linked Projects (Cascade)
    const projects = await ctx.db
      .query("projects")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.id))
      .collect();

    for (const project of projects) {
      // Trash Project
      await ctx.db.patch(project._id, {
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId
      });

      // 3. Trash Linked Breakdowns (Deep Cascade)
      const breakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .withIndex("projectId", (q) => q.eq("projectId", project._id))
        .collect();

      for (const breakdown of breakdowns) {
        await ctx.db.patch(breakdown._id, {
          isDeleted: true,
          deletedAt: now,
          deletedBy: userId
        });
      }
    }

    // Log Activity
    await logBudgetActivity(ctx, userId, {
      action: "updated",
      budgetItemId: args.id,
      previousValues: existing,
      newValues: { ...existing, isDeleted: true },
      reason: args.reason || "Moved to trash (Cascaded to children)"
    });

    return { success: true, message: "Moved to trash" };
  },
});

/**
 * Restore from Trash
 * Cascades restore to children
 */
export const restoreFromTrash = mutation({
  args: { id: v.id("budgetItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Item not found");

    // 1. Restore Budget Item
    await ctx.db.patch(args.id, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      updatedAt: Date.now()
    });

    // 2. Restore Linked Projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.id))
      .collect();

    for (const project of projects) {
      if (project.isDeleted) {
        await ctx.db.patch(project._id, {
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined
        });

        // 3. Restore Linked Breakdowns
        const breakdowns = await ctx.db
          .query("govtProjectBreakdowns")
          .withIndex("projectId", (q) => q.eq("projectId", project._id))
          .collect();

        for (const breakdown of breakdowns) {
          if (breakdown.isDeleted) {
            await ctx.db.patch(breakdown._id, {
              isDeleted: false,
              deletedAt: undefined,
              deletedBy: undefined
            });
          }
        }
      }
    }

    // Recalculate metrics immediately to ensure data is fresh
    await recalculateBudgetItemMetrics(ctx, args.id, userId);

    return { success: true, message: "Restored from trash" };
  },
});

/**
 * Get a single budget item by ID
 */
export const get = query({
    args: { id: v.id("budgetItems") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        const budgetItem = await ctx.db.get(args.id);
        if (!budgetItem || budgetItem.isDeleted) throw new Error("Budget item not found"); // Hide deleted items
        return budgetItem;
    },
});

/**
 * Get a single budget item by particulars (name)
 */
export const getByParticulars = query({
    args: { particulars: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        const budgetItem = await ctx.db
            .query("budgetItems")
            .withIndex("particulars", (q) => q.eq("particulars", args.particulars))
            .filter(q => q.neq(q.field("isDeleted"), true))
            .first();
        if (!budgetItem) throw new Error("Budget item not found");
        return budgetItem;
    },
});

/**
 * Get statistics for all budget items
 */
export const getStatistics = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        // Calculate statistics from active items only
        const budgetItems = await ctx.db
            .query("budgetItems")
            .filter(q => q.neq(q.field("isDeleted"), true))
            .collect();
        if (budgetItems.length === 0) {
            return {
                totalAllocated: 0,
                totalUtilized: 0,
                averageUtilizationRate: 0,
                totalProjects: 0,
            };
        }
        const totalAllocated = budgetItems.reduce((sum, item) => sum + item.totalBudgetAllocated, 0);
        const totalUtilized = budgetItems.reduce((sum, item) => sum + item.totalBudgetUtilized, 0);
        const averageUtilizationRate = budgetItems.reduce((sum, item) => sum + item.utilizationRate, 0) / budgetItems.length;
        return {
            totalAllocated,
            totalUtilized,
            averageUtilizationRate,
            totalProjects: budgetItems.length,
        };
    },
});

/**
 * Create a new budget item
 * NOTE: Project counts are NOT provided - they will be calculated from child projects
 */
export const create = mutation({
  args: {
    particulars: v.string(),
    totalBudgetAllocated: v.number(),
    obligatedBudget: v.optional(v.number()),
    totalBudgetUtilized: v.number(),
    year: v.optional(v.number()),
    notes: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    fiscalYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const now = Date.now();
    const utilizationRate = args.totalBudgetAllocated > 0
        ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
        : 0;

    const budgetItemId = await ctx.db.insert("budgetItems", {
      particulars: args.particulars,
      totalBudgetAllocated: args.totalBudgetAllocated,
      obligatedBudget: args.obligatedBudget,
      totalBudgetUtilized: args.totalBudgetUtilized,
      utilizationRate,
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOnTrack: 0,
      status: "ongoing",
      year: args.year,
      notes: args.notes,
      departmentId: args.departmentId,
      fiscalYear: args.fiscalYear,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // [NEW] Log Activity
    const newBudget = await ctx.db.get(budgetItemId);
    await logBudgetActivity(ctx, userId, {
      action: "created",
      budgetItemId,
      newValues: newBudget,
      reason: "Initial creation"
    });

    return budgetItemId;
  },
});

/**
 * Update an existing budget item
 * ✅ FIXED: Do not update status - it's auto-calculated
 */
export const update = mutation({
    args: {
        id: v.id("budgetItems"),
        particulars: v.string(),
        totalBudgetAllocated: v.number(),
        obligatedBudget: v.optional(v.number()),
        totalBudgetUtilized: v.number(),
        year: v.optional(v.number()),
        notes: v.optional(v.string()),
        departmentId: v.optional(v.id("departments")),
        fiscalYear: v.optional(v.number()),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");

        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Budget item not found");

        const now = Date.now();
        const utilizationRate = args.totalBudgetAllocated > 0
            ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
            : 0;

        const { reason, ...updates } = args;
        await ctx.db.patch(args.id, {
            particulars: args.particulars,
            totalBudgetAllocated: args.totalBudgetAllocated,
            obligatedBudget: args.obligatedBudget,
            totalBudgetUtilized: args.totalBudgetUtilized,
            utilizationRate,
            year: args.year,
            notes: args.notes,
            departmentId: args.departmentId,
            fiscalYear: args.fiscalYear,
            updatedAt: now,
            updatedBy: userId,
        });

        const updatedBudget = await ctx.db.get(args.id);
        await logBudgetActivity(ctx, userId, {
            action: "updated",
            budgetItemId: args.id,
            previousValues: existing,
            newValues: updatedBudget,
            reason: args.reason
        });
        return args.id;
    },
});

/**
 * HARD DELETE: Permanently remove from database
 */
export const remove = mutation({
  args: { 
    id: v.id("budgetItems"),
    reason: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentUser = await ctx.db.get(userId); // [FIX] Fetch the user first
    if (!currentUser) throw new Error("User not found");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Budget item not found");

    // [FIX] Check currentUser.role instead of existing.role
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isCreator = existing.createdBy === userId;

    if (!isCreator && !isSuperAdmin) {
        throw new Error("Not authorized");
    }

    // 1. Get linked Projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.id))
      .collect();

    let deletedBreakdownsCount = 0;

    // 2. Deep delete children
    for (const project of projects) {
      const breakdowns = await ctx.db
        .query("govtProjectBreakdowns")
        .withIndex("projectId", (q) => q.eq("projectId", project._id))
        .collect();

      deletedBreakdownsCount += breakdowns.length;

      for (const breakdown of breakdowns) await ctx.db.delete(breakdown._id);
      await ctx.db.delete(project._id);
    }

    // 3. Delete Parent
    await ctx.db.delete(args.id);

    // 4. Log
    await logBudgetActivity(ctx, userId, {
      action: "deleted",
      budgetItemId: args.id,
      previousValues: existing,
      reason: args.reason || `Permanent Cascade Delete: ${projects.length} projects`
    });

    return { success: true };
  },
});


/**
 * Toggle pin status for a budget item
 */
export const togglePin = mutation({
    args: { id: v.id("budgetItems") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Budget item not found");
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

/**
 * INTERNAL: Recalculate metrics for a specific budget item
 * This is called automatically by project mutations
 */
export const recalculateMetrics = internalMutation({
    args: { budgetItemId: v.id("budgetItems"), userId: v.id("users") },
    handler: async (ctx, args) => {
        return await recalculateBudgetItemMetrics(ctx, args.budgetItemId, args.userId);
    },
});

/**
 * 🆕 PUBLIC: Recalculate metrics for a specific budget item (frontend callable)
 */
export const recalculateSingleBudgetItem = mutation({
    args: { budgetItemId: v.id("budgetItems") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        return await recalculateBudgetItemMetrics(ctx, args.budgetItemId, userId);
    },
});

/**
 * MANUAL: Recalculate all budget item metrics
 * Use this for one-time sync of existing data
 */
export const recalculateAllMetrics = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        const results = await recalculateAllBudgetItems(ctx, userId);
        return { message: `Recalculated ${results.length} budget items`, results };
    },
});
