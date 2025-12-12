// convex/remarks.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create a new remark
 */
export const createRemark = mutation({
  args: {
    projectId: v.id("projects"),
    inspectionId: v.optional(v.id("inspections")),
    budgetItemId: v.optional(v.id("budgetItems")),
    content: v.string(),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    tags: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    attachments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Verify inspection exists if provided
    if (args.inspectionId) {
      const inspection = await ctx.db.get(args.inspectionId);
      if (!inspection) {
        throw new Error("Inspection not found");
      }
      // Verify inspection belongs to the project
      if (inspection.projectId !== args.projectId) {
        throw new Error("Inspection does not belong to this project");
      }
    }

    // Verify budget item exists if provided
    if (args.budgetItemId) {
      const budgetItem = await ctx.db.get(args.budgetItemId);
      if (!budgetItem) {
        throw new Error("Budget item not found");
      }
    }

    const now = Date.now();

    const remarkId = await ctx.db.insert("remarks", {
      projectId: args.projectId,
      inspectionId: args.inspectionId,
      budgetItemId: args.budgetItemId,
      content: args.content,
      category: args.category,
      priority: args.priority,
      tags: args.tags,
      isPinned: args.isPinned || false,
      attachments: args.attachments,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return remarkId;
  },
});

/**
 * Update an existing remark
 */
export const updateRemark = mutation({
  args: {
    remarkId: v.id("remarks"),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    tags: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    attachments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { remarkId, ...updates } = args;

    // Verify remark exists
    const remark = await ctx.db.get(remarkId);
    if (!remark) {
      throw new Error("Remark not found");
    }

    // Update the remark
    await ctx.db.patch(remarkId, {
      ...updates,
      updatedBy: userId,
      updatedAt: Date.now(),
    });

    return remarkId;
  },
});

/**
 * Delete a remark
 */
export const deleteRemark = mutation({
  args: {
    remarkId: v.id("remarks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify remark exists
    const remark = await ctx.db.get(args.remarkId);
    if (!remark) {
      throw new Error("Remark not found");
    }

    // Optional: Check if user is the creator or has admin rights
    // For now, any authenticated user can delete
    // You can add role-based checks here later

    await ctx.db.delete(args.remarkId);

    return { success: true };
  },
});

/**
 * Get a single remark by ID
 */
export const getRemark = query({
  args: {
    remarkId: v.id("remarks"),
  },
  handler: async (ctx, args) => {
    const remark = await ctx.db.get(args.remarkId);
    if (!remark) {
      return null;
    }

    // Get related data
    const project = await ctx.db.get(remark.projectId);
    const creator = await ctx.db.get(remark.createdBy);
    const updater = await ctx.db.get(remark.updatedBy);
    
    let inspection = null;
    if (remark.inspectionId) {
      inspection = await ctx.db.get(remark.inspectionId);
    }

    let budgetItem = null;
    if (remark.budgetItemId) {
      budgetItem = await ctx.db.get(remark.budgetItemId);
    }

    return {
      ...remark,
      project,
      inspection,
      budgetItem,
      creator,
      updater,
    };
  },
});

/**
 * List all remarks for a project
 */
export const listRemarksByProject = query({
  args: {
    projectId: v.id("projects"),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let remarksQuery = ctx.db
      .query("remarks")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId));

    let remarks = await remarksQuery.collect();

    // Filter by category if provided
    if (args.category) {
      remarks = remarks.filter((r) => r.category === args.category);
    }

    // Filter by priority if provided
    if (args.priority) {
      remarks = remarks.filter((r) => r.priority === args.priority);
    }

    // Filter by pinned status if provided
    if (args.isPinned !== undefined) {
      remarks = remarks.filter((r) => r.isPinned === args.isPinned);
    }

    // Sort by pinned first, then by creation date (most recent first)
    const sortedRemarks = remarks.sort((a, b) => {
      // Pinned remarks come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then sort by date (newest first)
      return b.createdAt - a.createdAt;
    });

    // Enrich with creator info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);
        
        let inspection = null;
        if (remark.inspectionId) {
          inspection = await ctx.db.get(remark.inspectionId);
        }

        return {
          ...remark,
          creator,
          updater,
          inspection,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * List all remarks for a specific inspection
 */
export const listRemarksByInspection = query({
  args: {
    inspectionId: v.id("inspections"),
  },
  handler: async (ctx, args) => {
    const remarks = await ctx.db
      .query("remarks")
      .withIndex("inspectionId", (q) => q.eq("inspectionId", args.inspectionId))
      .collect();

    // Sort by creation date (most recent first)
    const sortedRemarks = remarks.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with creator info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);
        const project = await ctx.db.get(remark.projectId);

        return {
          ...remark,
          creator,
          updater,
          project,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * List all remarks for a budget item
 */
export const listRemarksByBudgetItem = query({
  args: {
    budgetItemId: v.id("budgetItems"),
  },
  handler: async (ctx, args) => {
    const remarks = await ctx.db
      .query("remarks")
      .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.budgetItemId))
      .collect();

    // Sort by creation date (most recent first)
    const sortedRemarks = remarks.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with creator info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);
        const project = await ctx.db.get(remark.projectId);

        return {
          ...remark,
          creator,
          updater,
          project,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * List remarks by category
 */
export const listRemarksByCategory = query({
  args: {
    projectId: v.id("projects"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const remarks = await ctx.db
      .query("remarks")
      .withIndex("projectAndCategory", (q) => 
        q.eq("projectId", args.projectId).eq("category", args.category)
      )
      .collect();

    // Sort by creation date (most recent first)
    const sortedRemarks = remarks.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with creator info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);

        return {
          ...remark,
          creator,
          updater,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * List remarks by priority
 */
export const listRemarksByPriority = query({
  args: {
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const remarks = await ctx.db
      .query("remarks")
      .withIndex("priority", (q) => q.eq("priority", args.priority))
      .collect();

    // Filter by project if provided
    let filteredRemarks = remarks;
    if (args.projectId !== undefined) {
      filteredRemarks = remarks.filter((r) => r.projectId === args.projectId);
    }

    // Sort by creation date (most recent first)
    const sortedRemarks = filteredRemarks.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with creator and project info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);
        const project = await ctx.db.get(remark.projectId);

        return {
          ...remark,
          creator,
          updater,
          project,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * Get pinned remarks for a project
 */
export const getPinnedRemarks = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const remarks = await ctx.db
      .query("remarks")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Filter only pinned remarks
    const pinnedRemarks = remarks.filter((r) => r.isPinned === true);

    // Sort by creation date (most recent first)
    const sortedRemarks = pinnedRemarks.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with creator info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);

        return {
          ...remark,
          creator,
          updater,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * Toggle pin status of a remark
 */
export const togglePinRemark = mutation({
  args: {
    remarkId: v.id("remarks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const remark = await ctx.db.get(args.remarkId);
    if (!remark) {
      throw new Error("Remark not found");
    }

    await ctx.db.patch(args.remarkId, {
      isPinned: !remark.isPinned,
      updatedBy: userId,
      updatedAt: Date.now(),
    });

    return { isPinned: !remark.isPinned };
  },
});

/**
 * Get remark statistics for a project
 */
export const getProjectRemarkStats = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const remarks = await ctx.db
      .query("remarks")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    const stats = {
      total: remarks.length,
      pinned: remarks.filter((r) => r.isPinned === true).length,
      highPriority: remarks.filter((r) => r.priority === "high").length,
      mediumPriority: remarks.filter((r) => r.priority === "medium").length,
      lowPriority: remarks.filter((r) => r.priority === "low").length,
      withInspection: remarks.filter((r) => r.inspectionId !== undefined).length,
      general: remarks.filter((r) => r.inspectionId === undefined).length,
    };

    // Get categories count
    const categories: Record<string, number> = {};
    remarks.forEach((remark) => {
      if (remark.category) {
        categories[remark.category] = (categories[remark.category] || 0) + 1;
      }
    });

    return {
      ...stats,
      categories,
    };
  },
});

/**
 * Search remarks by content
 */
export const searchRemarks = query({
  args: {
    searchTerm: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();

    let remarks;
    if (args.projectId !== undefined) {
      remarks = await ctx.db
        .query("remarks")
        .withIndex("projectId", (q) => q.eq("projectId", args.projectId!))
        .collect();
    } else {
      remarks = await ctx.db.query("remarks").collect();
    }

    // Filter by search term in content or category
    const filtered = remarks.filter(
      (remark) =>
        remark.content.toLowerCase().includes(searchLower) ||
        (remark.category && remark.category.toLowerCase().includes(searchLower))
    );

    // Sort by relevance (content match comes first, then by date)
    const sorted = filtered.sort((a, b) => {
      const aContentMatch = a.content.toLowerCase().includes(searchLower);
      const bContentMatch = b.content.toLowerCase().includes(searchLower);
      if (aContentMatch && !bContentMatch) return -1;
      if (!aContentMatch && bContentMatch) return 1;
      return b.createdAt - a.createdAt;
    });

    // Enrich with creator and project info
    const enrichedRemarks = await Promise.all(
      sorted.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);
        const project = await ctx.db.get(remark.projectId);

        return {
          ...remark,
          creator,
          updater,
          project,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * Get recent remarks (last 10)
 */
export const getRecentRemarks = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    let remarks;
    if (args.projectId !== undefined) {
      remarks = await ctx.db
        .query("remarks")
        .withIndex("projectAndCreatedAt", (q) => q.eq("projectId", args.projectId!))
        .order("desc")
        .take(limit);
    } else {
      remarks = await ctx.db
        .query("remarks")
        .withIndex("createdAt")
        .order("desc")
        .take(limit);
    }

    // Enrich with creator and project info
    const enrichedRemarks = await Promise.all(
      remarks.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy);
        const updater = await ctx.db.get(remark.updatedBy);
        const project = await ctx.db.get(remark.projectId);

        let inspection = null;
        if (remark.inspectionId) {
          inspection = await ctx.db.get(remark.inspectionId);
        }

        return {
          ...remark,
          creator,
          updater,
          project,
          inspection,
        };
      })
    );

    return enrichedRemarks;
  },
});

/**
 * Get remarks by user (remarks created by a specific user)
 */
export const getRemarksByUser = query({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let remarks;
    
    if (args.projectId !== undefined) {
      remarks = await ctx.db
        .query("remarks")
        .withIndex("createdByAndProject", (q) => 
          q.eq("createdBy", args.userId).eq("projectId", args.projectId!)
        )
        .collect();
    } else {
      remarks = await ctx.db
        .query("remarks")
        .withIndex("createdBy", (q) => q.eq("createdBy", args.userId))
        .collect();
    }

    // Sort by creation date (most recent first)
    const sortedRemarks = remarks.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with project info
    const enrichedRemarks = await Promise.all(
      sortedRemarks.map(async (remark) => {
        const project = await ctx.db.get(remark.projectId);
        const updater = await ctx.db.get(remark.updatedBy);

        let inspection = null;
        if (remark.inspectionId) {
          inspection = await ctx.db.get(remark.inspectionId);
        }

        return {
          ...remark,
          project,
          updater,
          inspection,
        };
      })
    );

    return enrichedRemarks;
  },
});