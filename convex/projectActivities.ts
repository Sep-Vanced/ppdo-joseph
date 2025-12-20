// convex/projectActivities.ts

import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByProject = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    
    return await ctx.db
      .query("projectActivities")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
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
      .query("projectActivities")
      .withIndex("timestamp")
      .order("desc")
      .take(limit);
  },
});