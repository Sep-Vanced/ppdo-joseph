// convex/lib/budgetAggregation.ts
import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Calculate and update budgetItem metrics based on child project STATUSES
 * ✅ UPDATED: Now excludes soft-deleted (trashed) projects
 */
export async function recalculateBudgetItemMetrics(
  ctx: MutationCtx,
  budgetItemId: Id<"budgetItems">,
  userId: Id<"users">
) {
  // Get all ACTIVE projects (not in trash)
  const projects = await ctx.db
    .query("projects")
    .withIndex("budgetItemId", (q) => q.eq("budgetItemId", budgetItemId))
    .filter((q) => q.neq(q.field("isDeleted"), true)) // [NEW] Exclude trashed
    .collect();

  if (projects.length === 0) {
    await ctx.db.patch(budgetItemId, {
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOnTrack: 0,
      status: "ongoing",
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    return {
      projectsCount: 0,
      completed: 0,
      delayed: 0,
      onTrack: 0,
      status: "ongoing",
    };
  }

  // Count projects
  const aggregated = projects.reduce(
    (acc, project) => {
      const status = project.status;
      if (status === "completed") acc.completed++;
      else if (status === "delayed") acc.delayed++;
      else if (status === "ongoing") acc.onTrack++;
      return acc;
    },
    { completed: 0, delayed: 0, onTrack: 0 }
  );

  // Auto-calculate status
  let status: "completed" | "delayed" | "ongoing";
  if (aggregated.onTrack > 0) status = "ongoing";
  else if (aggregated.delayed > 0) status = "delayed";
  else if (aggregated.completed > 0) status = "completed";
  else status = "ongoing";

  // Update budget item
  await ctx.db.patch(budgetItemId, {
    projectCompleted: aggregated.completed,
    projectDelayed: aggregated.delayed,
    projectsOnTrack: aggregated.onTrack,
    status: status,
    updatedAt: Date.now(),
    updatedBy: userId,
  });

  return {
    projectsCount: projects.length,
    ...aggregated,
    status,
  };
}

/**
 * Recalculate metrics for multiple budget items
 */
export async function recalculateMultipleBudgetItems(
  ctx: MutationCtx,
  budgetItemIds: Id<"budgetItems">[],
  userId: Id<"users">
) {
  const results = [];
  for (const budgetItemId of budgetItemIds) {
    const result = await recalculateBudgetItemMetrics(ctx, budgetItemId, userId);
    results.push({
      budgetItemId,
      ...result,
    });
  }
  
  return results;
}

/**
 * Recalculate ALL budget items (system-wide)
 */
export async function recalculateAllBudgetItems(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  const allBudgetItems = await ctx.db.query("budgetItems").collect();
  const budgetItemIds = allBudgetItems.map((bi) => bi._id);
  
  return await recalculateMultipleBudgetItems(ctx, budgetItemIds, userId);
}