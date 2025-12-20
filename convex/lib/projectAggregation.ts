// convex/lib/projectAggregation.ts
import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";
import { recalculateBudgetItemMetrics } from "./budgetAggregation";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Calculate and update project metrics based on child breakdowns
 * ✅ UPDATED: Now excludes soft-deleted (trashed) breakdowns
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
    .filter((q) => q.neq(q.field("isDeleted"), true)) // [NEW] Exclude trashed
    .collect();

  const project = await ctx.db.get(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  if (breakdowns.length === 0) {
    await ctx.db.patch(projectId, {
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOnTrack: 0,
      status: "ongoing",
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    if (project.budgetItemId) {
      await recalculateBudgetItemMetrics(ctx, project.budgetItemId, userId);
    }

    return {
      breakdownsCount: 0,
      completed: 0,
      delayed: 0,
      onTrack: 0,
      status: "ongoing",
    };
  }

  // Count breakdowns
  const aggregated = breakdowns.reduce(
    (acc, breakdown) => {
      const status = breakdown.status;
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

  await ctx.db.patch(projectId, {
    projectCompleted: aggregated.completed,
    projectDelayed: aggregated.delayed,
    projectsOnTrack: aggregated.onTrack,
    status: status,
    updatedAt: Date.now(),
    updatedBy: userId,
  });

  if (project.budgetItemId) {
    await recalculateBudgetItemMetrics(ctx, project.budgetItemId, userId);
  }

  return {
    breakdownsCount: breakdowns.length,
    ...aggregated,
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
 * 🆕 BULK RECALCULATION: Recalculate all projects for a specific budget item
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