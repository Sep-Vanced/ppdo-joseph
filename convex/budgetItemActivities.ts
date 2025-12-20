import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByBudgetItem = query({
  args: {
    budgetItemId: v.id("budgetItems"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    
    return await ctx.db
      .query("budgetItemActivities")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.budgetItemId))
      .order("desc")
      .take(limit);
  },
});

export const getAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    
    return await ctx.db
      .query("budgetItemActivities")
      .withIndex("timestamp")
      .order("desc")
      .take(limit);
  },
});