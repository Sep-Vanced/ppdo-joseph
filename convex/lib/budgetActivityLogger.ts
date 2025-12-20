import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

export interface BudgetLogConfig {
  action: "created" | "updated" | "deleted";
  budgetItemId?: Id<"budgetItems">;
  budgetItem?: any;
  previousValues?: any;
  newValues?: any;
  reason?: string;
}

export async function logBudgetActivity(
  ctx: MutationCtx,
  userId: Id<"users">,
  config: BudgetLogConfig
) {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found for logging");

  const budgetData = config.budgetItem || config.newValues || config.previousValues || {};
  
  let changedFields: string[] = [];
  let changeSummary: any = {};

  if (config.action === "updated" && config.previousValues && config.newValues) {
    const allKeys = new Set([...Object.keys(config.previousValues), ...Object.keys(config.newValues)]);
    for (const key of allKeys) {
      if (["_id", "_creationTime", "updatedAt", "updatedBy", "createdAt", "createdBy", 
           "projectCompleted", "projectDelayed", "projectsOnTrack", "utilizationRate"].includes(key)) continue;
      
      const pVal = config.previousValues[key];
      const nVal = config.newValues[key];

      if (JSON.stringify(pVal) !== JSON.stringify(nVal)) {
        changedFields.push(key);
      }
    }

    if (changedFields.includes("totalBudgetAllocated")) {
      changeSummary.allocationChanged = true;
      changeSummary.oldAllocation = config.previousValues.totalBudgetAllocated;
      changeSummary.newAllocation = config.newValues.totalBudgetAllocated;
    }
  }

  await ctx.db.insert("budgetItemActivities", {
    action: config.action,
    budgetItemId: config.budgetItemId,
    particulars: budgetData.particulars || "Unknown Budget Item",
    departmentId: budgetData.departmentId,
    year: budgetData.year,

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