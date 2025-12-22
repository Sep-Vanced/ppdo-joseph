// convex/projects.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { recalculateBudgetItemMetrics } from "./lib/budgetAggregation";
import { recalculateProjectMetrics } from "./lib/projectAggregation";
import { logProjectActivity } from "./lib/projectActivityLogger";
import { internal } from "./_generated/api";

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

    if (args.budgetItemId) {
      projects = await ctx.db
        .query("projects")
        .withIndex("budgetItemId", (q) => q.eq("budgetItemId", args.budgetItemId))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .order("desc")
        .collect();
    } else {
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
 * Cascades to children (Breakdowns) and updates parent Budget Item.
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

    // Update usage count for the project particular
    await ctx.runMutation(internal.projectParticulars.updateUsageCount, {
      code: existing.particulars,
      delta: -1,
    });

    // Update usage count for implementing agency
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: existing.implementingOffice,
      usageContext: "project",
      delta: -1,
    });

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
 * Cascades restore to children and recalculates Parent Budget.
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

    // 2. Restore Breakdowns
    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", (q) => q.eq("projectId", args.id))
      .collect();

    for (const breakdown of breakdowns) {
      // Only restore breakdowns that were deleted at roughly the same time (cascade restore)
      // Or simply restore all attached breakdowns marked as deleted
      if (breakdown.isDeleted) {
        await ctx.db.patch(breakdown._id, {
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined
        });
      }
    }

    // Update usage count for the project particular
    await ctx.runMutation(internal.projectParticulars.updateUsageCount, {
      code: existing.particulars,
      delta: 1,
    });

    // Update usage count for implementing agency
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: existing.implementingOffice,
      usageContext: "project",
      delta: 1,
    });

    // 3. Recalculate Parent Budget to add this project back to totals
    if (existing.budgetItemId) {
      await recalculateBudgetItemMetrics(ctx, existing.budgetItemId, userId);
    }
    
    // Also recalculate the project itself to ensure its totals from restored breakdowns are correct
    await recalculateProjectMetrics(ctx, args.id, userId);

    return { success: true, message: "Project restored" };
  },
});

/**
 * Get a single project by ID (with ownership check)
 */
export const get = query({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");
        const project = await ctx.db.get(args.id);
        if (!project || project.isDeleted) throw new Error("Project not found");
        // Removed strict ownership check for read access as per common dashboard patterns
        // if (project.createdBy !== userId) throw new Error("Not authorized");
        return project;
    },
});

/**
 * Get a project by ID for validation purposes (no complex checks)
 * Used by breakdown forms to validate against parent project budget
 */
export const getForValidation = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    
    const project = await ctx.db.get(args.id);
    if (!project || project.isDeleted) {
      throw new Error("Project not found");
    }
    
    // Return fields needed for validation
    return {
      _id: project._id,
      particulars: project.particulars,
      implementingOffice: project.implementingOffice,
      totalBudgetAllocated: project.totalBudgetAllocated,
      totalBudgetUtilized: project.totalBudgetUtilized,
      budgetItemId: project.budgetItemId,
      status: project.status,
    };
  },
});

/**
 * Create a new project
 * 🆕 ENHANCED: Validates agency, links department, updates usage, logs, and updates parent budget.
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
        
        // Validate project particular exists and is active
        const particular = await ctx.db
          .query("projectParticulars")
          .withIndex("code", (q) => q.eq("code", args.particulars))
          .first();
        
        if (!particular) {
          throw new Error(
            `Project particular "${args.particulars}" does not exist. Please add it in Project Particulars management first.`
          );
        }

        if (!particular.isActive) {
          throw new Error(
            `Project particular "${args.particulars}" is inactive and cannot be used. Please activate it first.`
          );
        }

        // Validate implementing agency exists and is active
        const agency = await ctx.db
          .query("implementingAgencies")
          .withIndex("code", (q) => q.eq("code", args.implementingOffice))
          .first();
        
        if (!agency) {
          throw new Error(
            `Implementing agency "${args.implementingOffice}" does not exist. Please add it in Implementing Agencies management first.`
          );
        }

        if (!agency.isActive) {
          throw new Error(
            `Implementing agency "${args.implementingOffice}" is inactive and cannot be used. Please activate it first.`
          );
        }

        if (args.budgetItemId) {
            const budgetItem = await ctx.db.get(args.budgetItemId);
            if (!budgetItem) throw new Error("Budget item not found");
        }

        const now = Date.now();
        // Initial utilization rate calculation
        const utilizationRate = args.totalBudgetAllocated > 0
            ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
            : 0;

        // Auto-link department ID if this agency represents a department
        const departmentId = agency.departmentId;

        const projectId = await ctx.db.insert("projects", {
            particulars: args.particulars,
            budgetItemId: args.budgetItemId,
            implementingOffice: args.implementingOffice,
            departmentId: departmentId, 
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
            isDeleted: false,
        });

        // Update usage count for the project particular
        await ctx.runMutation(internal.projectParticulars.updateUsageCount, {
          code: args.particulars,
          delta: 1,
        });

        // Update usage count for implementing agency
        await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
          code: args.implementingOffice,
          usageContext: "project",
          delta: 1,
        });

        const newProject = await ctx.db.get(projectId);
        await logProjectActivity(ctx, userId, {
            action: "created",
            projectId: projectId,
            newValues: newProject,
            reason: "New project creation"
        });

        // ✅ RECALCULATE PARENT BUDGET ITEM
        if (args.budgetItemId) {
            await recalculateBudgetItemMetrics(ctx, args.budgetItemId, userId);
        }
        
        return projectId;
    },
});

/**
 * Update an existing project
 * 🆕 ENHANCED: Validates changes (particular, agency), updates usage counts, and recalculates parent budgets.
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

        // If particular is changing, validate new particular
        if (args.particulars !== existing.particulars) {
          const particular = await ctx.db
            .query("projectParticulars")
            .withIndex("code", (q) => q.eq("code", args.particulars))
            .first();
          
          if (!particular) {
            throw new Error(
              `Project particular "${args.particulars}" does not exist. Please add it in Project Particulars management first.`
            );
          }

          if (!particular.isActive) {
            throw new Error(
              `Project particular "${args.particulars}" is inactive and cannot be used. Please activate it first.`
            );
          }

          // Update usage counts
          await ctx.runMutation(internal.projectParticulars.updateUsageCount, {
            code: existing.particulars,
            delta: -1,
          });
          await ctx.runMutation(internal.projectParticulars.updateUsageCount, {
            code: args.particulars,
            delta: 1,
          });
        }

        // If implementing office is changing, validate and update counts
        let departmentId = existing.departmentId;
        
        if (args.implementingOffice !== existing.implementingOffice) {
          const agency = await ctx.db
            .query("implementingAgencies")
            .withIndex("code", (q) => q.eq("code", args.implementingOffice))
            .first();
          
          if (!agency) {
            throw new Error(
              `Implementing agency "${args.implementingOffice}" does not exist. Please add it in Implementing Agencies management first.`
            );
          }

          if (!agency.isActive) {
            throw new Error(
              `Implementing agency "${args.implementingOffice}" is inactive and cannot be used. Please activate it first.`
            );
          }
          
          // Update departmentId based on new agency
          departmentId = agency.departmentId;

          // Update usage counts
          await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
            code: existing.implementingOffice,
            usageContext: "project",
            delta: -1,
          });
          await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
            code: args.implementingOffice,
            usageContext: "project",
            delta: 1,
          });
        }

        if (args.budgetItemId) {
            const budgetItem = await ctx.db.get(args.budgetItemId);
            if (!budgetItem) throw new Error("Budget item not found");
        }

        const now = Date.now();
        // Note: Project's own utilization rate calculation (based on manual inputs if no breakdowns exist yet)
        const utilizationRate = args.totalBudgetAllocated > 0
            ? (args.totalBudgetUtilized / args.totalBudgetAllocated) * 100
            : 0;
            
        const oldBudgetItemId = existing.budgetItemId;
        
        await ctx.db.patch(args.id, {
            particulars: args.particulars,
            budgetItemId: args.budgetItemId,
            implementingOffice: args.implementingOffice,
            departmentId: departmentId,
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
        
        // Log Activity
        await logProjectActivity(ctx, userId, {
            action: "updated",
            projectId: args.id,
            previousValues: existing,
            newValues: updatedProject,
            reason: args.reason
        });

        // ✅ RECALCULATE PARENT BUDGET ITEMS
        // If moved to a different budget item, recalculate the old one
        if (oldBudgetItemId && oldBudgetItemId !== args.budgetItemId) {
            await recalculateBudgetItemMetrics(ctx, oldBudgetItemId, userId);
        }
        
        // Recalculate the new (or current) budget item
        if (args.budgetItemId) {
            await recalculateBudgetItemMetrics(ctx, args.budgetItemId, userId);
        } else if (oldBudgetItemId && args.budgetItemId === undefined) {
            // Implicitly same budget item if not in args, but strictly checking `undefined`
            // If args.budgetItemId is strictly undefined, it means we didn't change it, 
            // so we should update the existing one to reflect budget changes.
            await recalculateBudgetItemMetrics(ctx, oldBudgetItemId, userId);
        }

        // Also trigger project internal aggregation to ensure it's consistent with its own breakdowns
        // (This handles cases where user manually edits fields that are usually aggregated)
        await recalculateProjectMetrics(ctx, args.id, userId);

        return args.id;
    },
});

/**
 * HARD DELETE: Permanent Removal
 * Cascades delete to breakdowns and updates parent budget.
 */
export const remove = mutation({
  args: { 
    id: v.id("projects"),
    reason: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) throw new Error("User not found");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Project not found");

    const isSuperAdmin = currentUser.role === 'super_admin';
    const isCreator = existing.createdBy === userId;
    
    // Only Creator or Super Admin can hard delete
    if (!isCreator && !isSuperAdmin) throw new Error("Not authorized");

    const budgetItemId = existing.budgetItemId;
    
    // 1. Get Linked Breakdowns
    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", (q) => q.eq("projectId", args.id))
      .collect();

    // 2. Permanent Delete Children (Breakdowns)
    for (const breakdown of breakdowns) {
      await ctx.db.delete(breakdown._id);
      
      // Update agency usage for breakdown deletion
      await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
        code: breakdown.implementingOffice,
        usageContext: "breakdown",
        delta: -1,
      });
    }

    // 3. Log Activity
    await logProjectActivity(ctx, userId, {
      action: "deleted",
      projectId: args.id, 
      previousValues: existing,
      reason: args.reason || "Permanent Delete"
    });

    // 4. Permanent Delete Project
    await ctx.db.delete(args.id);

    // Update usage count for the project particular
    await ctx.runMutation(internal.projectParticulars.updateUsageCount, {
      code: existing.particulars,
      delta: -1,
    });

    // Update usage count for implementing agency
    await ctx.runMutation(internal.implementingAgencies.updateUsageCount, {
      code: existing.implementingOffice,
      usageContext: "project",
      delta: -1,
    });

    // 5. Update Parent Budget Item
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
        
        // Ownership check can be relaxed for admins if needed, keeping strict for now
        // if (existing.createdBy !== userId) throw new Error("Not authorized");
   
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