// convex/govtProjectActivities.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get activities for a specific breakdown
 */
export const getBreakdownActivities = query({
  args: {
    breakdownId: v.id("govtProjectBreakdowns"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    const activities = await ctx.db
      .query("govtProjectBreakdownActivities")
      .withIndex("breakdownAndTimestamp", (q) => 
        q.eq("breakdownId", args.breakdownId)
      )
      .order("desc")
      .take(limit);

    return activities;
  },
});

/**
 * Get activities for a project + office combination
 */
export const getProjectOfficeActivities = query({
  args: {
    projectName: v.string(),
    implementingOffice: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    action: v.optional(v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
      v.literal("bulk_created"),
      v.literal("bulk_updated"),
      v.literal("bulk_deleted")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let activities = await ctx.db
      .query("govtProjectBreakdownActivities")
      .withIndex("projectOfficeTimestamp", (q) => 
        q.eq("projectName", args.projectName)
         .eq("implementingOffice", args.implementingOffice)
      )
      .order("desc")
      .collect();

    // Apply filters
    if (args.startDate) {
      activities = activities.filter(a => a.timestamp >= args.startDate!);
    }

    if (args.endDate) {
      activities = activities.filter(a => a.timestamp <= args.endDate!);
    }

    if (args.action) {
      activities = activities.filter(a => a.action === args.action);
    }

    return activities;
  },
});

/**
 * Get all activities with advanced filtering and pagination
 */
export const getAllActivities = query({
  args: {
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    action: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
    municipality: v.optional(v.string()),
    isFlagged: v.optional(v.boolean()),
    isReviewed: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    source: v.optional(v.string()),
    batchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = args.page || 1;
    const pageSize = args.pageSize || 50;

    // Get all activities
    let activities = await ctx.db
      .query("govtProjectBreakdownActivities")
      .withIndex("timestamp")
      .order("desc")
      .collect();

    // Apply filters
    if (args.action) {
      activities = activities.filter(a => a.action === args.action);
    }

    if (args.performedBy) {
      activities = activities.filter(a => a.performedBy === args.performedBy);
    }

    if (args.projectName) {
      activities = activities.filter(a => 
        a.projectName.toLowerCase().includes(args.projectName!.toLowerCase())
      );
    }

    if (args.implementingOffice) {
      activities = activities.filter(a => 
        a.implementingOffice.toLowerCase().includes(args.implementingOffice!.toLowerCase())
      );
    }

    if (args.municipality) {
      activities = activities.filter(a => 
        a.municipality?.toLowerCase().includes(args.municipality!.toLowerCase())
      );
    }

    if (args.isFlagged !== undefined) {
      activities = activities.filter(a => a.isFlagged === args.isFlagged);
    }

    if (args.isReviewed !== undefined) {
      activities = activities.filter(a => a.isReviewed === args.isReviewed);
    }

    if (args.startDate) {
      activities = activities.filter(a => a.timestamp >= args.startDate!);
    }

    if (args.endDate) {
      activities = activities.filter(a => a.timestamp <= args.endDate!);
    }

    if (args.source) {
      activities = activities.filter(a => a.source === args.source);
    }

    if (args.batchId) {
      activities = activities.filter(a => a.batchId === args.batchId);
    }

    // Pagination
    const totalCount = activities.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedActivities = activities.slice(startIndex, startIndex + pageSize);

    return {
      activities: paginatedActivities,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },
});

/**
 * Get flagged activities (for admin review)
 */
export const getFlaggedActivities = query({
  args: {
    includeReviewed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    if (args.includeReviewed) {
      // Get all flagged activities
      return await ctx.db
        .query("govtProjectBreakdownActivities")
        .withIndex("isFlagged", (q) => q.eq("isFlagged", true))
        .order("desc")
        .collect();
    } else {
      // Get only unreviewed flagged activities
      return await ctx.db
        .query("govtProjectBreakdownActivities")
        .withIndex("flaggedAndNotReviewed", (q) => 
          q.eq("isFlagged", true).eq("isReviewed", false)
        )
        .order("desc")
        .collect();
    }
  },
});

/**
 * Get activity statistics
 */
export const getActivityStatistics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    projectName: v.optional(v.string()),
    implementingOffice: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let activities = await ctx.db
      .query("govtProjectBreakdownActivities")
      .withIndex("timestamp")
      .order("desc")
      .collect();

    // Apply filters
    if (args.startDate) {
      activities = activities.filter(a => a.timestamp >= args.startDate!);
    }

    if (args.endDate) {
      activities = activities.filter(a => a.timestamp <= args.endDate!);
    }

    if (args.projectName) {
      activities = activities.filter(a => a.projectName === args.projectName);
    }

    if (args.implementingOffice) {
      activities = activities.filter(a => a.implementingOffice === args.implementingOffice);
    }

    // Calculate statistics
    const stats = {
      total: activities.length,
      created: activities.filter(a => a.action === "created").length,
      updated: activities.filter(a => a.action === "updated").length,
      deleted: activities.filter(a => a.action === "deleted").length,
      bulkCreated: activities.filter(a => a.action === "bulk_created").length,
      bulkUpdated: activities.filter(a => a.action === "bulk_updated").length,
      bulkDeleted: activities.filter(a => a.action === "bulk_deleted").length,
      viewed: activities.filter(a => a.action === "viewed").length,
      exported: activities.filter(a => a.action === "exported").length,
      imported: activities.filter(a => a.action === "imported").length,
      flagged: activities.filter(a => a.isFlagged).length,
      reviewed: activities.filter(a => a.isReviewed).length,
      unreviewed: activities.filter(a => a.isFlagged && !a.isReviewed).length,
    };

    // User activity breakdown
    const userActivityMap = new Map<string, number>();
    activities.forEach(a => {
      const count = userActivityMap.get(a.performedByName) || 0;
      userActivityMap.set(a.performedByName, count + 1);
    });

    const topUsers = Array.from(userActivityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Action timeline (daily breakdown for date range)
    const timelineMap = new Map<string, number>();
    activities.forEach(a => {
      const date = new Date(a.timestamp).toISOString().split('T')[0];
      const count = timelineMap.get(date) || 0;
      timelineMap.set(date, count + 1);
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      stats,
      topUsers,
      timeline,
    };
  },
});

/**
 * Get activities by user
 */
export const getUserActivities = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    // Use provided userId or default to current user
    const targetUserId = args.userId || authUserId;
    const limit = args.limit || 100;

    let activities = await ctx.db
      .query("govtProjectBreakdownActivities")
      .withIndex("userAndTimestamp", (q) => q.eq("performedBy", targetUserId))
      .order("desc")
      .take(limit);

    // Apply date filters
    if (args.startDate) {
      activities = activities.filter(a => a.timestamp >= args.startDate!);
    }

    if (args.endDate) {
      activities = activities.filter(a => a.timestamp <= args.endDate!);
    }

    return activities;
  },
});

/**
 * Get activities by batch ID
 */
export const getBatchActivities = query({
  args: {
    batchId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activities = await ctx.db
      .query("govtProjectBreakdownActivities")
      .withIndex("batchId", (q) => q.eq("batchId", args.batchId))
      .order("desc")
      .collect();

    return activities;
  },
});

/**
 * Review a flagged activity (admin only)
 */
export const reviewActivity = mutation({
  args: {
    activityId: v.id("govtProjectBreakdownActivities"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    await ctx.db.patch(args.activityId, {
      isReviewed: true,
      reviewedBy: userId,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
    });

    return { success: true };
  },
});

/**
 * Get recent activities (dashboard widget)
 */
export const getRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
    excludeViewed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 20;

    let activities = await ctx.db
      .query("govtProjectBreakdownActivities")
      .withIndex("timestamp")
      .order("desc")
      .take(limit * 2); // Get more to filter

    // Filter out "viewed" actions if requested
    if (args.excludeViewed) {
      activities = activities.filter(a => a.action !== "viewed");
    }

    return activities.slice(0, limit);
  },
});

/**
 * Search activities by keyword
 */
export const searchActivities = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    const searchLower = args.searchTerm.toLowerCase();

    const activities = await ctx.db
      .query("govtProjectBreakdownActivities")
      .withIndex("timestamp")
      .order("desc")
      .collect();

    // Search across multiple fields
    const filtered = activities.filter(a => {
      return (
        a.projectName.toLowerCase().includes(searchLower) ||
        a.implementingOffice.toLowerCase().includes(searchLower) ||
        a.performedByName.toLowerCase().includes(searchLower) ||
        a.performedByEmail.toLowerCase().includes(searchLower) ||
        a.municipality?.toLowerCase().includes(searchLower) ||
        a.barangay?.toLowerCase().includes(searchLower) ||
        a.reason?.toLowerCase().includes(searchLower) ||
        a.flagReason?.toLowerCase().includes(searchLower)
      );
    });

    return filtered.slice(0, limit);
  },
});