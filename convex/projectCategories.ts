// convex/projectCategories.ts

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * LIST ALL ACTIVE PROJECT CATEGORIES
 * Returns all active categories sorted by display order
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("projectCategories")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .collect()
      .then((categories) => 
        categories.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999))
      );
  },
});

/**
 * LIST ALL CATEGORIES (INCLUDING INACTIVE)
 * For admin management purposes
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      throw new Error("Only admins can view all categories");
    }

    return await ctx.db
      .query("projectCategories")
      .collect()
      .then((categories) => 
        categories.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999))
      );
  },
});

/**
 * GET A SINGLE CATEGORY BY ID
 */
export const get = query({
  args: { id: v.id("projectCategories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");

    return category;
  },
});

/**
 * GET A CATEGORY BY CODE
 */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db
      .query("projectCategories")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    if (!category) throw new Error("Category not found");
    return category;
  },
});

/**
 * CREATE A NEW PROJECT CATEGORY
 * ✅ UPDATED: Now allows spaces and percentage signs in code
 * Any authenticated user can create categories
 */
export const create = mutation({
  args: {
    code: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    iconName: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    parentCategoryId: v.optional(v.id("projectCategories")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // ✅ UPDATED: Validate code format (uppercase alphanumeric, underscores, spaces, percentage signs, commas, periods, hyphens, and @)
    const codeRegex = /^[A-Z0-9_%\s,.\-@]+$/;
    const trimmedCode = args.code.trim();
    
    if (!codeRegex.test(trimmedCode)) {
      throw new Error(
        "Category code can only contain uppercase letters, numbers, underscores, percentage signs, spaces, commas, periods, hyphens, and @"
      );
    }

    // Check if code already exists
    const existing = await ctx.db
      .query("projectCategories")
      .withIndex("code", (q) => q.eq("code", trimmedCode))
      .first();

    if (existing) {
      throw new Error(`Category with code "${trimmedCode}" already exists`);
    }

    // Validate parent category if provided
    if (args.parentCategoryId) {
      const parent = await ctx.db.get(args.parentCategoryId);
      if (!parent) {
        throw new Error("Parent category not found");
      }
      if (!parent.isActive) {
        throw new Error("Parent category is inactive");
      }
    }

    // Validate color code format if provided
    if (args.colorCode) {
      const colorRegex = /^#[0-9A-F]{6}$/i;
      if (!colorRegex.test(args.colorCode)) {
        throw new Error("Color code must be in hex format (e.g., #4CAF50)");
      }
    }

    const now = Date.now();

    const categoryId = await ctx.db.insert("projectCategories", {
      code: trimmedCode,
      fullName: args.fullName,
      description: args.description,
      colorCode: args.colorCode,
      iconName: args.iconName,
      displayOrder: args.displayOrder,
      parentCategoryId: args.parentCategoryId,
      notes: args.notes,
      isActive: true,
      isSystemDefault: false, // User-created categories are not system defaults
      usageCount: 0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return categoryId;
  },
});

/**
 * UPDATE A PROJECT CATEGORY
 * ✅ UPDATED: Now allows spaces and percentage signs in code
 * Users can update non-system-default categories
 * Admins can update any category except isSystemDefault flag
 */
export const update = mutation({
  args: {
    id: v.id("projectCategories"),
    code: v.optional(v.string()),
    fullName: v.optional(v.string()),
    description: v.optional(v.string()),
    colorCode: v.optional(v.string()),
    iconName: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    parentCategoryId: v.optional(v.id("projectCategories")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Category not found");

    // Regular users cannot edit system defaults
    if (existing.isSystemDefault && user.role !== "super_admin" && user.role !== "admin") {
      throw new Error("Only admins can edit system default categories");
    }

    // Validate code format if changing
    if (args.code !== undefined && args.code !== existing.code) {
      const trimmedCode = args.code.trim();
      
      // ✅ UPDATED: Validate new code format (allow spaces, %, commas, periods, hyphens, and @)
      const codeRegex = /^[A-Z0-9_%\s,.\-@]+$/;
      if (!codeRegex.test(trimmedCode)) {
        throw new Error(
          "Category code can only contain uppercase letters, numbers, underscores, percentage signs, spaces, commas, periods, hyphens, and @"
        );
      }

      // Check if new code already exists
      const duplicate = await ctx.db
        .query("projectCategories")
        .withIndex("code", (q) => q.eq("code", trimmedCode))
        .first();

      if (duplicate && duplicate._id !== args.id) {
        throw new Error(`Category with code "${trimmedCode}" already exists`);
      }
    }

    // Validate parent category if provided
    if (args.parentCategoryId) {
      if (args.parentCategoryId === args.id) {
        throw new Error("Category cannot be its own parent");
      }
      const parent = await ctx.db.get(args.parentCategoryId);
      if (!parent) {
        throw new Error("Parent category not found");
      }
      if (!parent.isActive) {
        throw new Error("Parent category is inactive");
      }
    }

    // Validate color code format if provided
    if (args.colorCode) {
      const colorRegex = /^#[0-9A-F]{6}$/i;
      if (!colorRegex.test(args.colorCode)) {
        throw new Error("Color code must be in hex format (e.g., #4CAF50)");
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      ...(args.code !== undefined && { code: args.code.trim() }),
      ...(args.fullName !== undefined && { fullName: args.fullName }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.colorCode !== undefined && { colorCode: args.colorCode }),
      ...(args.iconName !== undefined && { iconName: args.iconName }),
      ...(args.displayOrder !== undefined && { displayOrder: args.displayOrder }),
      ...(args.parentCategoryId !== undefined && { parentCategoryId: args.parentCategoryId }),
      ...(args.notes !== undefined && { notes: args.notes }),
      updatedAt: now,
      updatedBy: userId,
    });

    return args.id;
  },
});

/**
 * TOGGLE ACTIVE STATUS
 * Deactivate/reactivate a category
 * System defaults cannot be deactivated
 */
export const toggleActive = mutation({
  args: { id: v.id("projectCategories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Category not found");

    // Only admins can deactivate system defaults
    if (existing.isSystemDefault && user.role !== "super_admin" && user.role !== "admin") {
      throw new Error("Only admins can deactivate system default categories");
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
 * DELETE A CATEGORY
 * Soft delete by marking as inactive
 * System defaults cannot be deleted
 * IMPORTANT: Does NOT delete projects using this category
 */
export const remove = mutation({
  args: { 
    id: v.id("projectCategories"),
    permanent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Category not found");

    // System defaults cannot be deleted
    if (existing.isSystemDefault) {
      throw new Error("System default categories cannot be deleted");
    }

    // Only super_admin can permanently delete
    if (args.permanent && user.role !== "super_admin") {
      throw new Error("Only super_admin can permanently delete categories");
    }

    if (args.permanent) {
      // PERMANENT DELETE
      // First, check if any projects are using this category
      const projectsUsingCategory = await ctx.db
        .query("projects")
        .withIndex("categoryId", (q) => q.eq("categoryId", args.id))
        .first();

      if (projectsUsingCategory) {
        throw new Error(
          `Cannot delete category: ${existing.usageCount || 0} projects are using it. ` +
          `Please reassign or remove the category from projects first.`
        );
      }

      await ctx.db.delete(args.id);
    } else {
      // SOFT DELETE (mark as inactive)
      const now = Date.now();
      await ctx.db.patch(args.id, {
        isActive: false,
        updatedAt: now,
        updatedBy: userId,
      });
    }

    return { success: true, permanent: args.permanent || false };
  },
});

/**
 * UPDATE USAGE COUNT (INTERNAL)
 * Called automatically when projects are created/updated/deleted
 */
export const updateUsageCount = internalMutation({
  args: {
    categoryId: v.id("projectCategories"),
    delta: v.number(), // +1 to increment, -1 to decrement
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) return; // Category might have been deleted

    const currentCount = category.usageCount || 0;
    const newCount = Math.max(0, currentCount + args.delta);

    await ctx.db.patch(args.categoryId, {
      usageCount: newCount,
      updatedAt: Date.now(),
    });
  },
});

/**
 * GET CATEGORIES WITH USAGE STATISTICS
 * For admin reporting
 */
export const getUsageStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      throw new Error("Only admins can view usage statistics");
    }

    const categories = await ctx.db
      .query("projectCategories")
      .collect();

    return categories
      .map((category) => ({
        _id: category._id,
        code: category.code,
        fullName: category.fullName,
        isActive: category.isActive,
        isSystemDefault: category.isSystemDefault,
        usageCount: category.usageCount || 0,
        displayOrder: category.displayOrder,
      }))
      .sort((a, b) => b.usageCount - a.usageCount);
  },
});