// convex/budgetParticulars.ts
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * ============================================================================
 * QUERIES
 * ============================================================================
 */

/**
 * Get all budget particulars (active and inactive)
 */
export const list = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    let particulars = await ctx.db
      .query("budgetParticulars")
      .withIndex("isActiveAndDisplayOrder")
      .collect();

    // Filter by active status if requested
    if (!args.includeInactive) {
      particulars = particulars.filter(p => p.isActive);
    }

    // Sort by displayOrder, then by code
    return particulars.sort((a, b) => {
      const orderA = a.displayOrder ?? 9999;
      const orderB = b.displayOrder ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.code.localeCompare(b.code);
    });
  },
});

/**
 * Get a single budget particular by ID
 */
export const get = query({
  args: { id: v.id("budgetParticulars") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const particular = await ctx.db.get(args.id);
    if (!particular) throw new Error("Budget particular not found");

    return particular;
  },
});

/**
 * Get a budget particular by code
 */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const particular = await ctx.db
      .query("budgetParticulars")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    if (!particular) throw new Error("Budget particular not found");

    return particular;
  },
});

/**
 * Check if a code is available (not already in use)
 */
export const isCodeAvailable = query({
  args: {
    code: v.string(),
    excludeId: v.optional(v.id("budgetParticulars")), // For edit mode
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("budgetParticulars")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    // If no existing particular found, code is available
    if (!existing) return true;

    // If editing and it's the same particular, code is available
    if (args.excludeId && existing._id === args.excludeId) return true;

    // Otherwise, code is taken
    return false;
  },
});

/**
 * Get particulars by category
 */
export const getByCategory = query({
  args: {
    category: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    let particulars = await ctx.db
      .query("budgetParticulars")
      .withIndex("category", (q) => q.eq("category", args.category))
      .collect();

    if (args.activeOnly) {
      particulars = particulars.filter(p => p.isActive);
    }

    return particulars.sort((a, b) => {
      const orderA = a.displayOrder ?? 9999;
      const orderB = b.displayOrder ?? 9999;
      return orderA - orderB;
    });
  },
});

/**
 * Get statistics about budget particulars
 */
export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const allParticulars = await ctx.db
      .query("budgetParticulars")
      .collect();

    const active = allParticulars.filter(p => p.isActive);
    const inactive = allParticulars.filter(p => !p.isActive);
    const systemDefaults = allParticulars.filter(p => p.isSystemDefault);

    const totalUsage = allParticulars.reduce((sum, p) => 
      sum + (p.usageCount || 0), 0
    );
    
    const totalProjectUsage = allParticulars.reduce((sum, p) => 
      sum + (p.projectUsageCount || 0), 0
    );

    return {
      total: allParticulars.length,
      active: active.length,
      inactive: inactive.length,
      systemDefaults: systemDefaults.length,
      totalUsage,
      totalProjectUsage,
    };
  },
});

/**
 * ============================================================================
 * MUTATIONS
 * ============================================================================
 */

/**
 * Create a new budget particular
 * ✅ UPDATED: Now allows spaces and percentage signs in code
 */
export const create = mutation({
  args: {
    code: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    category: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // ✅ UPDATED: Validate code format (Unicode letters incl. accents, numbers, underscores, %, spaces, commas, periods, hyphens, and @)
    const codeRegex = /^[\p{L}0-9_%\s,.\-@]+$/u;
    const trimmedCode = args.code.trim();
    
    if (!codeRegex.test(trimmedCode)) {
      throw new Error(
        "Code can only contain letters (including accents), numbers, underscores, percentage signs, spaces, commas, periods, hyphens, and @"
      );
    }

    // Check if code already exists
    const existing = await ctx.db
      .query("budgetParticulars")
      .withIndex("code", (q) => q.eq("code", trimmedCode))
      .first();

    if (existing) {
      throw new Error(`Budget particular with code "${trimmedCode}" already exists`);
    }

    // Validate color code if provided
    if (args.colorCode) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(args.colorCode)) {
        throw new Error("Color code must be a valid hex color (e.g., #FF5733)");
      }
    }

    const now = Date.now();

    const particularId = await ctx.db.insert("budgetParticulars", {
      code: trimmedCode,
      fullName: args.fullName,
      description: args.description,
      displayOrder: args.displayOrder,
      isActive: true, // New particulars are active by default
      isSystemDefault: false, // Only set to true for defaults
      usageCount: 0,
      projectUsageCount: 0,
      category: args.category,
      colorCode: args.colorCode,
      notes: args.notes,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return particularId;
  },
});

/**
 * Update an existing budget particular
 * ✅ UPDATED: Now allows spaces and percentage signs in code
 */
export const update = mutation({
  args: {
    id: v.id("budgetParticulars"),
    code: v.optional(v.string()), // Can't change code if it's system default
    fullName: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    category: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Budget particular not found");

    // If trying to change code, validate
    if (args.code && args.code !== existing.code) {
      // Don't allow changing system default codes
      if (existing.isSystemDefault) {
        throw new Error("Cannot change code of system default particulars");
      }

      const trimmedCode = args.code.trim();

      // ✅ UPDATED: Validate new code format (allow spaces, %, commas, periods, hyphens, and @)
      const codeRegex = /^[A-Z0-9_%\s,.\-@]+$/;
      if (!codeRegex.test(trimmedCode)) {
        throw new Error(
          "Code can only contain uppercase letters, numbers, underscores, percentage signs, spaces, commas, periods, hyphens, and @"
        );
      }

      // Check if new code already exists
      const duplicate = await ctx.db
        .query("budgetParticulars")
        .withIndex("code", (q) => q.eq("code", trimmedCode))
        .first();

      if (duplicate && duplicate._id !== args.id) {
        throw new Error(`Budget particular with code "${trimmedCode}" already exists`);
      }
    }

    // Validate color code if provided
    if (args.colorCode) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(args.colorCode)) {
        throw new Error("Color code must be a valid hex color (e.g., #FF5733)");
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      ...(args.code && { code: args.code.trim() }),
      ...(args.fullName && { fullName: args.fullName }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.displayOrder !== undefined && { displayOrder: args.displayOrder }),
      ...(args.category !== undefined && { category: args.category }),
      ...(args.colorCode !== undefined && { colorCode: args.colorCode }),
      ...(args.notes !== undefined && { notes: args.notes }),
      updatedAt: now,
      updatedBy: userId,
    });

    return args.id;
  },
});

/**
 * Toggle active status of a budget particular
 */
export const toggleActive = mutation({
  args: {
    id: v.id("budgetParticulars"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Budget particular not found");

    // Check if this particular is in use before deactivating
    if (existing.isActive && (existing.usageCount || 0) > 0) {
      throw new Error(
        `Cannot deactivate "${existing.code}" - it is currently used by ${existing.usageCount} budget item(s). ` +
        `Please remove all references before deactivating.`
      );
    }

    if (existing.isActive && (existing.projectUsageCount || 0) > 0) {
      throw new Error(
        `Cannot deactivate "${existing.code}" - it is currently used by ${existing.projectUsageCount} project(s). ` +
        `Please remove all references before deactivating.`
      );
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      isActive: !existing.isActive,
      updatedAt: now,
      updatedBy: userId,
    });

    return args.id;
  },
});

/**
 * Delete a budget particular (only if not in use and not system default)
 */
export const remove = mutation({
  args: {
    id: v.id("budgetParticulars"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Budget particular not found");

    // Cannot delete system defaults
    if (existing.isSystemDefault) {
      throw new Error(
        `Cannot delete system default particular "${existing.code}". You can deactivate it instead.`
      );
    }

    // Cannot delete if in use
    if ((existing.usageCount || 0) > 0) {
      throw new Error(
        `Cannot delete "${existing.code}" - it is currently used by ${existing.usageCount} budget item(s). ` +
        `Please remove all references before deleting.`
      );
    }

    if ((existing.projectUsageCount || 0) > 0) {
      throw new Error(
        `Cannot delete "${existing.code}" - it is currently used by ${existing.projectUsageCount} project(s). ` +
        `Please remove all references before deleting.`
      );
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Update usage counts (called internally when budget items/projects are created/deleted)
 * 🔒 INTERNAL ONLY - Not exposed to client, used by other mutations
 */
export const updateUsageCount = internalMutation({
  args: {
    code: v.string(),
    type: v.union(v.literal("budget"), v.literal("project")),
    delta: v.number(), // +1 for create, -1 for delete
  },
  handler: async (ctx, args) => {
    const particular = await ctx.db
      .query("budgetParticulars")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    if (!particular) {
      // If particular doesn't exist, this might be from old data
      // Just log and return without error
      console.warn(`Budget particular "${args.code}" not found for usage count update`);
      return;
    }

    const now = Date.now();

    if (args.type === "budget") {
      const newCount = Math.max(0, (particular.usageCount || 0) + args.delta);
      await ctx.db.patch(particular._id, {
        usageCount: newCount,
        updatedAt: now,
      });
    } else {
      const newCount = Math.max(0, (particular.projectUsageCount || 0) + args.delta);
      await ctx.db.patch(particular._id, {
        projectUsageCount: newCount,
        updatedAt: now,
      });
    }
  },
});

/**
 * Recalculate all usage counts (maintenance function)
 * Can be called by super_admin
 */
export const recalculateUsageCounts = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Only super_admin can run this
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "super_admin") {
      throw new Error("Only super_admin can recalculate usage counts");
    }

    // Directly implement the logic here instead of calling internal mutation
    const allParticulars = await ctx.db.query("budgetParticulars").collect();
    
    // Get all budget items and projects (exclude deleted ones)
    const budgetItems = await ctx.db
      .query("budgetItems")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();
      
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Count usage for each particular
    const usageCounts: Record<string, { budget: number; project: number }> = {};

    for (const particular of allParticulars) {
      usageCounts[particular.code] = { budget: 0, project: 0 };
    }

    for (const item of budgetItems) {
      if (usageCounts[item.particulars]) {
        usageCounts[item.particulars].budget++;
      }
    }

    for (const project of projects) {
      if (usageCounts[project.particulars]) {
        usageCounts[project.particulars].project++;
      }
    }

    // Update all particulars
    const now = Date.now();
    for (const particular of allParticulars) {
      const counts = usageCounts[particular.code] || { budget: 0, project: 0 };
      await ctx.db.patch(particular._id, {
        usageCount: counts.budget,
        projectUsageCount: counts.project,
        updatedAt: now,
      });
    }

    return {
      success: true,
      particularsUpdated: allParticulars.length,
      totalBudgetItems: budgetItems.length,
      totalProjects: projects.length,
    };
  },
});

/**
 * Internal version for system use (no auth required)
 */
export const recalculateUsageCountsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allParticulars = await ctx.db.query("budgetParticulars").collect();
    
    // Get all budget items and projects (exclude deleted ones)
    const budgetItems = await ctx.db
      .query("budgetItems")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();
      
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Count usage for each particular
    const usageCounts: Record<string, { budget: number; project: number }> = {};

    for (const particular of allParticulars) {
      usageCounts[particular.code] = { budget: 0, project: 0 };
    }

    for (const item of budgetItems) {
      if (usageCounts[item.particulars]) {
        usageCounts[item.particulars].budget++;
      }
    }

    for (const project of projects) {
      if (usageCounts[project.particulars]) {
        usageCounts[project.particulars].project++;
      }
    }

    // Update all particulars
    const now = Date.now();
    for (const particular of allParticulars) {
      const counts = usageCounts[particular.code] || { budget: 0, project: 0 };
      await ctx.db.patch(particular._id, {
        usageCount: counts.budget,
        projectUsageCount: counts.project,
        updatedAt: now,
      });
    }

    return {
      success: true,
      particularsUpdated: allParticulars.length,
      totalBudgetItems: budgetItems.length,
      totalProjects: projects.length,
    };
  },
});