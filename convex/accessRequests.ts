// convex/accessRequests.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Create an access request
 */
export const create = mutation({
  args: {
    pageRequested: v.string(),
    accessType: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's department name
    let departmentName = "Not Assigned";
    if (user.departmentId) {
      const department = await ctx.db.get(user.departmentId);
      if (department) {
        departmentName = department.name;
      }
    }

    // Create access request
    const requestId = await ctx.db.insert("accessRequests", {
      userId: userId,
      userName: user.name || "Unknown",
      userEmail: user.email || "No email",
      departmentName: departmentName,
      departmentId: user.departmentId,
      pageRequested: args.pageRequested,
      accessType: args.accessType,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return requestId;
  },
});

/**
 * List all access requests (admin only)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return [];
    }

    // Only super_admin and admin can view all requests
    if (user.role !== "super_admin" && user.role !== "admin") {
      return [];
    }

    const requests = await ctx.db
      .query("accessRequests")
      .withIndex("createdAt")
      .order("desc")
      .collect();

    return requests;
  },
});

/**
 * Get count of pending access requests (admin only)
 */
export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return 0;
    }

    // Only super_admin and admin can view pending count
    if (user.role !== "super_admin" && user.role !== "admin") {
      return 0;
    }

    const pendingRequests = await ctx.db
      .query("accessRequests")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .collect();

    return pendingRequests.length;
  },
});

/**
 * Get user's own access requests
 */
export const myRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const requests = await ctx.db
      .query("accessRequests")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return requests;
  },
});

/**
 * Update access request status (admin only)
 */
export const updateStatus = mutation({
  args: {
    requestId: v.id("accessRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only super_admin and admin can update status
    if (user.role !== "super_admin" && user.role !== "admin") {
      throw new Error("Administrator access required");
    }

    await ctx.db.patch(args.requestId, {
      status: args.status,
      reviewedBy: userId,
      reviewedAt: Date.now(),
      adminNotes: args.adminNotes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});