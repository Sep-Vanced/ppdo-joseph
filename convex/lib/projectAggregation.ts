// convex/lib/projectAggregation.ts
import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Calculate and update project metrics based on child govtProjectBreakdown STATUSES
 * This mirrors budgetAggregation.ts but for projects
 * 
 * MAPPING:
 * - "Completed" status → projectCompleted
 * - "Delayed" status → projectDelayed
 * - "On-Going" or "On-Hold" status → projectsOnTrack
 * - "Cancelled" or no status → not counted
 */
export async function recalculateProjectMetrics(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
) {
  // Get all breakdowns for this project
  const breakdowns = await ctx.db
    .query("govtProjectBreakdowns")
    .withIndex("projectId", (q) => q.eq("projectId", projectId))
    .collect();

  if (breakdowns.length === 0) {
    // No breakdowns - set all counts to 0
    await ctx.db.patch(projectId, {
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOnTrack: 0,
      updatedAt: Date.now(),
      updatedBy: userId,
    });
    return {
      breakdownsCount: 0,
      completed: 0,
      delayed: 0,
      onTrack: 0,
    };
  }

  // Count breakdowns based on their STATUS field
  const aggregated = breakdowns.reduce(
    (acc, breakdown) => {
      const status = breakdown.status;
      
      if (status === "Completed") {
        acc.completed++;
      } else if (status === "Delayed") {
        acc.delayed++;
      } else if (status === "On-Going" || status === "On-Hold") {
        acc.onTrack++;
      }
      // Breakdowns without status or "Cancelled" are not counted
      
      return acc;
    },
    { completed: 0, delayed: 0, onTrack: 0 }
  );

  // Update project with aggregated totals
  await ctx.db.patch(projectId, {
    projectCompleted: aggregated.completed,
    projectDelayed: aggregated.delayed,
    projectsOnTrack: aggregated.onTrack,
    updatedAt: Date.now(),
    updatedBy: userId,
  });

  return {
    breakdownsCount: breakdowns.length,
    ...aggregated,
  };
}

/**
 * Recalculate metrics for multiple projects
 * Useful for bulk operations or system-wide recalculation
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
 * Use with caution - potentially expensive operation
 */
export async function recalculateAllProjects(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  const allProjects = await ctx.db.query("projects").collect();
  const projectIds = allProjects.map((p) => p._id);
  
  return await recalculateMultipleProjects(ctx, projectIds, userId);
}