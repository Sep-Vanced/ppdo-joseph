// convex/lib/budgetAggregation.ts

import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Calculate and update budgetItem metrics from child projects
 * This is the SINGLE SOURCE OF TRUTH for budgetItem project counts
 */
export async function recalculateBudgetItemMetrics(
  ctx: MutationCtx,
  budgetItemId: Id<"budgetItems">,
  userId: Id<"users">
) {
  // Get all projects for this budget item
  const projects = await ctx.db
    .query("projects")
    .withIndex("budgetItemId", (q) => q.eq("budgetItemId", budgetItemId))
    .collect();

  if (projects.length === 0) {
    // No projects - set all counts to 0
    await ctx.db.patch(budgetItemId, {
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOnTrack: 0,
      updatedAt: Date.now(),
      updatedBy: userId,
    });
    return { projectsCount: 0 };
  }

  // Aggregate counts from all child projects
  const aggregated = projects.reduce(
    (acc, project) => ({
      completed: acc.completed + (project.projectCompleted || 0),
      delayed: acc.delayed + (project.projectDelayed || 0),
      // Schema uses 'projectsOnTrack', inputs often refer to 'ongoing'
      ongoing: acc.ongoing + (project.projectsOnTrack || 0),
    }),
    { completed: 0, delayed: 0, ongoing: 0 }
  );

  // Update budget item with aggregated totals
  await ctx.db.patch(budgetItemId, {
    projectCompleted: aggregated.completed,
    projectDelayed: aggregated.delayed,
    projectsOnTrack: aggregated.ongoing,
    updatedAt: Date.now(),
    updatedBy: userId,
  });

  return {
    projectsCount: projects.length,
    aggregated,
  };
}

/**
 * Recalculate metrics for multiple budget items
 * Useful for bulk operations or system-wide recalculation
 */
export async function recalculateMultipleBudgetItems(
  ctx: MutationCtx,
  budgetItemIds: Id<"budgetItems">[],
  userId: Id<"users">
) {
  const results = [];
  
  for (const budgetItemId of budgetItemIds) {
    const result = await recalculateBudgetItemMetrics(ctx, budgetItemId, userId);
    results.push({ budgetItemId, ...result });
  }
  
  return results;
}

/**
 * Recalculate ALL budget items (system-wide)
 * Use with caution - potentially expensive operation
 */
export async function recalculateAllBudgetItems(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  const allBudgetItems = await ctx.db.query("budgetItems").collect();
  const budgetItemIds = allBudgetItems.map(bi => bi._id);
  
  return await recalculateMultipleBudgetItems(ctx, budgetItemIds, userId);
}