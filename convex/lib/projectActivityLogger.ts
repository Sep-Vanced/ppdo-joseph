// convex/lib/projectActivityLogger.ts

import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

export interface ProjectLogConfig {
  action: "created" | "updated" | "deleted" | "restored";
  projectId?: Id<"projects">;
  project?: any; // Snapshot of project data
  previousValues?: any;
  newValues?: any;
  reason?: string;
}

export async function logProjectActivity(
  ctx: MutationCtx,
  userId: Id<"users">,
  config: ProjectLogConfig
) {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found for logging");

  // Snapshot Data
  const projectData = config.project || config.newValues || config.previousValues || {};
  
  // Calculate Diff
  let changedFields: string[] = [];
  let changeSummary: any = {};

  if (config.action === "updated" && config.previousValues && config.newValues) {
    const allKeys = new Set([...Object.keys(config.previousValues), ...Object.keys(config.newValues)]);
    
    for (const key of allKeys) {
      if (["_id", "_creationTime", "updatedAt", "updatedBy", "createdAt", "createdBy"].includes(key)) continue;
      
      const pVal = config.previousValues[key];
      const nVal = config.newValues[key];

      if (JSON.stringify(pVal) !== JSON.stringify(nVal)) {
        changedFields.push(key);
      }
    }

    // Smart Summaries
    if (changedFields.includes("totalBudgetAllocated")) {
      changeSummary.budgetChanged = true;
      changeSummary.oldBudget = config.previousValues.totalBudgetAllocated;
      changeSummary.newBudget = config.newValues.totalBudgetAllocated;
    }
    if (changedFields.includes("targetDateCompletion")) {
      changeSummary.scheduleChanged = true;
    }
    if (changedFields.includes("projectManagerId")) {
      changeSummary.managerChanged = true;
    }
  }

  await ctx.db.insert("projectActivities", {
    action: config.action,
    projectId: config.projectId,
    particulars: projectData.particulars || "Unknown Project",
    implementingOffice: projectData.implementingOffice || "Unknown Office",
    budgetItemId: projectData.budgetItemId,
    
    previousValues: config.previousValues ? JSON.stringify(config.previousValues) : undefined,
    newValues: config.newValues ? JSON.stringify(config.newValues) : undefined,
    changedFields: changedFields.length > 0 ? JSON.stringify(changedFields) : undefined,
    changeSummary: Object.keys(changeSummary).length > 0 ? changeSummary : undefined,

    performedBy: userId,
    performedByName: user.name || "Unknown",
    performedByEmail: user.email || "",
    performedByRole: user.role || "user",
    
    timestamp: Date.now(),
    reason: config.reason,
  });
}