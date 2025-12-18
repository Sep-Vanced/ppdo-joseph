// convex/budgetItems.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
// 🆕 Import aggregation logic for manual trigger
import { recalculateBudgetItemMetrics, recalculateAllBudgetItems } from "./lib/budgetAggregation";

/**
 * Get all budget items ordered by creation date (newest first)
 * Pinned items will appear first
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("createdAt")
      .order("desc")
      .collect();

    // Sort: pinned items first (by pinnedAt desc), then unpinned items
    const sortedItems = budgetItems.sort((a, b) => {
      // Both pinned - sort by pinnedAt (most recent first)
      if (a.isPinned && b.isPinned) {
        return (b.pinnedAt || 0) - (a.pinnedAt || 0);
      }
      // Only a is pinned
      if (a.isPinned) return -1;
      // Only b is pinned
      if (b.isPinned) return 1;
      // Neither pinned - sort by creation time
      return b._creationTime - a._creationTime;
    });

    return sortedItems;
  },
});

/**
 * Get a single budget item by ID
 */
export const get = query({
  args: {
    id: v.id("budgetItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const budgetItem = await ctx.db.get(args.id);
    return budgetItem;
  },
});

/**
 * Get budget item by particulars name
 */
export const getByParticulars = query({
  args: {
    particulars: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const budgetItem = await ctx.db
      .query("budgetItems")
      .withIndex("particulars", (q) => q.eq("particulars", args.particulars))
      .first();

    return budgetItem;
  },
});

/**
 * Create a new budget item
 * ❌ Removed manual project count inputs. Initialized to 0.
 */
export const create = mutation({
  args: {
    particulars: v.string(),
    totalBudgetAllocated: v.number(),
    obligatedBudget: v.optional(v.number()),
    totalBudgetUtilized: v.number(),
    // ❌ REMOVED MANUAL METRIC INPUTS
    notes: v.optional(v.string()),
    year: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("done"),
        v.literal("pending"),
        v.literal("ongoing")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Check if particulars already exists
    const existing = await ctx.db
      .query("budgetItems")
      .withIndex("particulars", (q) => q.eq("particulars", args.particulars))
      .first();

    if (existing) {
      throw new Error("Budget item with this particulars already exists");
    }

    // Calculate utilization rate
    const utilizationRate =
      args.totalBudgetAllocated > 0
        ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
        : 0;

    const now = Date.now();
    const budgetItemData: any = {
      particulars: args.particulars,
      totalBudgetAllocated: args.totalBudgetAllocated,
      totalBudgetUtilized: args.totalBudgetUtilized,
      utilizationRate: utilizationRate,
      // 🆕 AUTO-INITIALIZED TO ZERO (will be computed from child projects)
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOnTrack: 0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
      isPinned: false,
    };

    // Only add optional fields if they have values
    if (args.obligatedBudget !== undefined) budgetItemData.obligatedBudget = args.obligatedBudget;
    if (args.notes !== undefined) budgetItemData.notes = args.notes;
    if (args.year !== undefined) budgetItemData.year = args.year;
    if (args.status !== undefined) budgetItemData.status = args.status;

    const budgetItemId = await ctx.db.insert("budgetItems", budgetItemData);

    return budgetItemId;
  },
});

/**
 * Update an existing budget item
 * ❌ Removed manual project count inputs.
 */
export const update = mutation({
  args: {
    id: v.id("budgetItems"),
    totalBudgetAllocated: v.number(),
    obligatedBudget: v.optional(v.number()),
    totalBudgetUtilized: v.number(),
    // ❌ REMOVED MANUAL METRIC INPUTS
    notes: v.optional(v.string()),
    year: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("done"),
        v.literal("pending"),
        v.literal("ongoing")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Budget item not found");
    }

    // Calculate utilization rate
    const utilizationRate =
      args.totalBudgetAllocated > 0
        ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
        : 0;

    const now = Date.now();
    const updateData: any = {
      totalBudgetAllocated: args.totalBudgetAllocated,
      totalBudgetUtilized: args.totalBudgetUtilized,
      utilizationRate: utilizationRate,
      // ❌ DO NOT UPDATE project counts - they are computed from child projects
      updatedBy: userId,
      updatedAt: now,
    };

    // Only add optional fields if they have values
    if (args.obligatedBudget !== undefined) updateData.obligatedBudget = args.obligatedBudget;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.year !== undefined) updateData.year = args.year;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.id, updateData);

    return args.id;
  },
});

/**
 * Delete a budget item
 */
export const remove = mutation({
  args: {
    id: v.id("budgetItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Budget item not found");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Pin a budget item to the top of the list
 */
export const pin = mutation({
  args: {
    id: v.id("budgetItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get the user to check role
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has access (admin or super_admin)
    if (user.role !== "admin" && user.role !== "super_admin") {
      throw new Error("Unauthorized: Only admins can pin items");
    }

    // Get the budget item
    const budgetItem = await ctx.db.get(args.id);
    if (!budgetItem) {
      throw new Error("Budget item not found");
    }

    // Update the budget item
    await ctx.db.patch(args.id, {
      isPinned: true,
      pinnedAt: Date.now(),
      pinnedBy: userId,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    return { success: true };
  },
});

/**
 * Unpin a budget item
 */
export const unpin = mutation({
  args: {
    id: v.id("budgetItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get the user to check role
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has access (admin or super_admin)
    if (user.role !== "admin" && user.role !== "super_admin") {
      throw new Error("Unauthorized: Only admins can unpin items");
    }

    // Get the budget item
    const budgetItem = await ctx.db.get(args.id);
    if (!budgetItem) {
      throw new Error("Budget item not found");
    }

    // Update the budget item
    await ctx.db.patch(args.id, {
      isPinned: false,
      pinnedAt: undefined,
      pinnedBy: undefined,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    return { success: true };
  },
});

/**
 * Get budget statistics
 */
export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const budgetItems = await ctx.db.query("budgetItems").collect();

    const totalAllocated = budgetItems.reduce(
      (sum, item) => sum + item.totalBudgetAllocated,
      0
    );

    const totalObligated = budgetItems.reduce(
      (sum, item) => sum + (item.obligatedBudget || 0),
      0
    );

    const totalUtilized = budgetItems.reduce(
      (sum, item) => sum + item.totalBudgetUtilized,
      0
    );

    const averageUtilizationRate =
      budgetItems.length > 0
        ? budgetItems.reduce((sum, item) => sum + item.utilizationRate, 0) /
          budgetItems.length
        : 0;

    const averageProjectCompleted =
      budgetItems.length > 0
        ? budgetItems.reduce((sum, item) => sum + item.projectCompleted, 0) /
          budgetItems.length
        : 0;

    const averageProjectDelayed =
      budgetItems.length > 0
        ? budgetItems.reduce((sum, item) => sum + item.projectDelayed, 0) /
          budgetItems.length
        : 0;

    const averageProjectsOnTrack =
      budgetItems.length > 0
        ? budgetItems.reduce((sum, item) => sum + item.projectsOnTrack, 0) /
          budgetItems.length
        : 0;

    return {
      totalAllocated,
      totalObligated,
      totalUtilized,
      averageUtilizationRate,
      averageProjectCompleted,
      averageProjectDelayed,
      averageProjectsOnTrack,
      totalProjects: budgetItems.length,
    };
  },
});

/**
 * MANUAL RECALCULATION - Trigger for single budget item
 * Useful for fixing inconsistencies or testing
 */
export const recalculateMetrics = mutation({
  args: {
    id: v.id("budgetItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      throw new Error("Unauthorized: Only admins can manually recalculate");
    }

    const result = await recalculateBudgetItemMetrics(ctx, args.id, userId);
    
    return {
      success: true,
      message: "Metrics recalculated successfully",
      ...result,
    };
  },
});

/**
 * BULK RECALCULATION - Recalculate all budget items
 * Super admin only - expensive operation
 */
export const recalculateAllMetrics = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "super_admin") {
      throw new Error("Unauthorized: Only super_admin can recalculate all");
    }

    const results = await recalculateAllBudgetItems(ctx, userId);
    
    return {
      success: true,
      message: `Recalculated ${results.length} budget items`,
      results,
    };
  },
});