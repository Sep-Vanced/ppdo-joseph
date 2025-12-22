// convex/lib/projectAggregation.ts
import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";
import { recalculateBudgetItemMetrics } from "./budgetAggregation";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Calculate and update project metrics based on child breakdowns
 * ✅ UPDATED: 
 * 1. Aggregates `obligatedBudget` and `totalBudgetUtilized` from breakdowns.
 * 2. Recalculates `utilizationRate` based on Project's allocated vs Breakdown's utilized.
 * 3. Excludes soft-deleted (trashed) breakdowns.
 */
export async function recalculateProjectMetrics(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
) {
  // Get all ACTIVE breakdowns (not in trash)
  const breakdowns = await ctx.db
    .query("govtProjectBreakdowns")
    .withIndex("projectId", (q) => q.eq("projectId", projectId))
    .filter((q) => q.neq(q.field("isDeleted"), true))
    .collect();

  const project = await ctx.db.get(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  // Initialize Aggregators
  let totalObligated = 0;
  let totalUtilized = 0;
  const statusCounts = { completed: 0, delayed: 0, onTrack: 0 };

  // Aggregate Data from Breakdowns
  for (const breakdown of breakdowns) {
    // Sum Financials
    totalObligated += (breakdown.obligatedBudget || 0);
    totalUtilized += (breakdown.budgetUtilized || 0);

    // Count Statuses
    const status = breakdown.status;
    if (status === "completed") statusCounts.completed++;
    else if (status === "delayed") statusCounts.delayed++;
    else if (status === "ongoing") statusCounts.onTrack++;
  }

  // Calculate Dynamic Utilization Rate
  // Formula: (Total Utilized from Breakdowns / Project Allocated) * 100
  const utilizationRate = project.totalBudgetAllocated > 0
    ? (totalUtilized / project.totalBudgetAllocated) * 100
    : 0;

  // Auto-calculate Project Status
  let status: "completed" | "delayed" | "ongoing";
  if (breakdowns.length === 0) {
    status = "ongoing"; // Default if no breakdowns
  } else {
    if (statusCounts.onTrack > 0) status = "ongoing";
    else if (statusCounts.delayed > 0) status = "delayed";
    else if (statusCounts.completed > 0) status = "completed";
    else status = "ongoing";
  }

  // Update Project with Aggregated Values
  await ctx.db.patch(projectId, {
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

  // Cascade Calculation to Parent Budget Item
  if (project.budgetItemId) {
    await recalculateBudgetItemMetrics(ctx, project.budgetItemId, userId);
  }

  return {
    breakdownsCount: breakdowns.length,
    ...statusCounts,
    totalObligated,
    totalUtilized,
    utilizationRate,
    status,
  };
}

/**
 * Recalculate metrics for multiple projects
 */
export async function recalculateMultipleProjects(
  ctx: MutationCtx,
  projectIds: Id<"projects">[],
  userId: Id<"users">
) {
  const results = [];
  for (const projectId of projectIds) {
    const result = await recalculateProjectMetrics(ctx, projectId, userId);
    results.push({
      projectId,
      ...result,
    });
  }
  
  return results;
}

/**
 * Recalculate ALL projects (system-wide)
 */
export async function recalculateAllProjects(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  const allProjects = await ctx.db.query("projects").collect();
  const projectIds = allProjects.map((p) => p._id);
  
  return await recalculateMultipleProjects(ctx, projectIds, userId);
}

/**
 * Bulk Recalculation: Recalculate all projects for a specific budget item
 */
export async function recalculateProjectsForBudgetItem(
  ctx: MutationCtx,
  budgetItemId: Id<"budgetItems">,
  userId: Id<"users">
) {
  const projects = await ctx.db
    .query("projects")
    .withIndex("budgetItemId", (q) => q.eq("budgetItemId", budgetItemId))
    .collect();
  const projectIds = projects.map((p) => p._id);
  
  return await recalculateMultipleProjects(ctx, projectIds, userId);
}