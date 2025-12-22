// convex/lib/budgetAggregation.ts
import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Calculate and update budgetItem metrics based on child projects
 * ✅ UPDATED: 
 * 1. Aggregates `obligatedBudget` and `totalBudgetUtilized` from projects.
 * 2. Recalculates `utilizationRate` based on Budget's allocated vs Projects' utilized.
 * 3. Excludes soft-deleted (trashed) projects.
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
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  const budgetItem = await ctx.db.get(budgetItemId);
  if (!budgetItem) throw new Error("Budget item not found");

  // Initialize Aggregators
  let totalObligated = 0;
  let totalUtilized = 0;
  const statusCounts = { completed: 0, delayed: 0, onTrack: 0 };

  // Aggregate Data from Projects
  for (const project of projects) {
    // Sum Financials (aggregating the already aggregated values from projects)
    totalObligated += (project.obligatedBudget || 0);
    totalUtilized += (project.totalBudgetUtilized || 0);

    // Count Statuses
    const status = project.status;
    if (status === "completed") statusCounts.completed++;
    else if (status === "delayed") statusCounts.delayed++;
    else if (status === "ongoing") statusCounts.onTrack++;
  }

  // Calculate Dynamic Utilization Rate
  // Formula: (Total Utilized from Projects / Budget Allocated) * 100
  const utilizationRate = budgetItem.totalBudgetAllocated > 0
    ? (totalUtilized / budgetItem.totalBudgetAllocated) * 100
    : 0;

  // Auto-calculate Status
  let status: "completed" | "delayed" | "ongoing";
  if (projects.length === 0) {
    status = "ongoing"; // Default
  } else {
    if (statusCounts.onTrack > 0) status = "ongoing";
    else if (statusCounts.delayed > 0) status = "delayed";
    else if (statusCounts.completed > 0) status = "completed";
    else status = "ongoing";
  }

  // Update Budget Item with Aggregated Values
  await ctx.db.patch(budgetItemId, {
    obligatedBudget: totalObligated,
    totalBudgetUtilized: totalUtilized,
    utilizationRate: utilizationRate,
    projectCompleted: statusCounts.completed,
    projectDelayed: statusCounts.delayed,
    projectsOnTrack: statusCounts.onTrack,
    status: status,
    updatedAt: Date.now(),
    updatedBy: userId,
  });

  return {
    projectsCount: projects.length,
    ...statusCounts,
    totalObligated,
    totalUtilized,
    utilizationRate,
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