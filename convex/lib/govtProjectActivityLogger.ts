// convex/lib/govtProjectActivityLogger.ts

import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "../_generated/dataModel";
import { Doc } from "../_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Configuration for activity logging
 */
export interface ActivityLogConfig {
  action: 
    | "created" 
    | "updated" 
    | "deleted" 
    | "bulk_created" 
    | "bulk_updated" 
    | "bulk_deleted" 
    | "viewed" 
    | "exported" 
    | "imported";
  breakdownId?: Id<"govtProjectBreakdowns">;
  breakdown?: Doc<"govtProjectBreakdowns"> | null;
  previousValues?: any;
  newValues?: any;
  batchId?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: "web_ui" | "bulk_import" | "api" | "system" | "migration";
  sessionId?: string;
}

/**
 * Log an activity for a government project breakdown
 * Central function that handles all activity logging logic
 */
export async function logGovtProjectActivity(
  ctx: MutationCtx,
  userId: Id<"users">,
  config: ActivityLogConfig
): Promise<Id<"govtProjectBreakdownActivities">> {
  const now = Date.now();

  // Get user details (snapshot at time of action)
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found for activity logging");
  }

  // Get department details if available
  let departmentName: string | undefined;
  if (user.departmentId) {
    const department = await ctx.db.get(user.departmentId);
    departmentName = department?.name;
  }

  // Extract contextual data from breakdown
  let projectName = "";
  let implementingOffice = "";
  let municipality: string | undefined;
  let barangay: string | undefined;
  let district: string | undefined;

  if (config.breakdown) {
    projectName = config.breakdown.projectName;
    implementingOffice = config.breakdown.implementingOffice;
    municipality = config.breakdown.municipality;
    barangay = config.breakdown.barangay;
    district = config.breakdown.district;
  } else if (config.previousValues) {
    // For deletes, extract from previousValues
    projectName = config.previousValues.projectName || "";
    implementingOffice = config.previousValues.implementingOffice || "";
    municipality = config.previousValues.municipality;
    barangay = config.previousValues.barangay;
    district = config.previousValues.district;
  }

  // Calculate changed fields for updates
  let changedFields: string[] = [];
  let changeSummary: any = {};
  if (config.action === "updated" && config.previousValues && config.newValues) {
    changedFields = calculateChangedFields(config.previousValues, config.newValues);
    changeSummary = buildChangeSummary(config.previousValues, config.newValues, changedFields);
  }

  // Auto-flag certain activities
  const { isFlagged, flagReason } = shouldFlagActivity(
    config.action,
    config.previousValues,
    config.newValues,
    changeSummary
  );

  // Normalize role to match schema type
  const normalizedRole = user.role || "user";

  // Create activity record
  const activityId = await ctx.db.insert("govtProjectBreakdownActivities", {
    action: config.action,
    breakdownId: config.breakdownId,
    batchId: config.batchId,
    // Contextual data
    projectName,
    implementingOffice,
    municipality,
    barangay,
    district,

    // Change tracking
    previousValues: config.previousValues ? JSON.stringify(config.previousValues) : undefined,
    newValues: config.newValues ? JSON.stringify(config.newValues) : undefined,
    changedFields: changedFields.length > 0 ? JSON.stringify(changedFields) : undefined,
    changeSummary: Object.keys(changeSummary).length > 0 ? changeSummary : undefined,

    // User metadata
    performedBy: userId,
    performedByName: user.name || "Unknown",
    performedByEmail: user.email || "",
    performedByRole: 
      normalizedRole === "inspector" || 
      normalizedRole === "super_admin" || 
      normalizedRole === "admin" 
        ? normalizedRole 
        : "user",
    performedByDepartmentId: user.departmentId,
    performedByDepartmentName: departmentName,

    reason: config.reason,
    timestamp: now,

    // Technical metadata
    ipAddress: config.ipAddress,
    userAgent: config.userAgent,
    source: config.source || "web_ui",
    sessionId: config.sessionId,

    // Flags
    isFlagged,
    flagReason,
    isReviewed: false,
  });

  return activityId;
}

/**
 * Calculate which fields changed between two versions
 */
function calculateChangedFields(oldValues: any, newValues: any): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  for (const key of allKeys) {
    // Skip system fields
    if (["_id", "_creationTime", "createdAt", "updatedAt", "createdBy", "updatedBy"].includes(key)) {
      continue;
    }
    const oldVal = oldValues[key];
    const newVal = newValues[key];

    // Deep comparison for objects/arrays
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changed.push(key);
    }
  }
  return changed;
}

/**
 * Build a summary of important changes
 * Highlights budget, status, and date changes
 */
function buildChangeSummary(oldValues: any, newValues: any, changedFields: string[]): any {
  const summary: any = {};

  // Budget change detection
  const budgetFields = ["allocatedBudget", "obligatedBudget", "budgetUtilized", "balance"];
  const budgetChanged = changedFields.some(f => budgetFields.includes(f));
  if (budgetChanged) {
    summary.budgetChanged = true;
    summary.oldBudget = oldValues.allocatedBudget;
    summary.newBudget = newValues.allocatedBudget;
  }

  // Status change detection
  if (changedFields.includes("status")) {
    summary.statusChanged = true;
    summary.oldStatus = oldValues.status;
    summary.newStatus = newValues.status;
  }

  // Date change detection
  const dateFields = ["dateStarted", "targetDate", "completionDate"];
  const dateChanged = changedFields.some(f => dateFields.includes(f));
  if (dateChanged) {
    summary.dateChanged = true;
  }

  // Location change detection
  const locationFields = ["municipality", "barangay", "district"];
  const locationChanged = changedFields.some(f => locationFields.includes(f));
  if (locationChanged) {
    summary.locationChanged = true;
  }

  return summary;
}

/**
 * Determine if an activity should be flagged for review
 */
function shouldFlagActivity(
  action: string,
  oldValues: any,
  newValues: any,
  changeSummary: any
): { isFlagged: boolean; flagReason?: string } {
  // Always flag deletions
  if (action === "deleted") {
    return { isFlagged: true, flagReason: "Record deletion" };
  }

  // Flag large budget changes (>20%)
  if (changeSummary.budgetChanged) {
    const oldBudget = oldValues?.allocatedBudget || 0;
    const newBudget = newValues?.allocatedBudget || 0;
    if (oldBudget > 0) {
      const percentChange = Math.abs(((newBudget - oldBudget) / oldBudget) * 100);
      if (percentChange > 20) {
        return { 
          isFlagged: true, 
          flagReason: `Large budget change: ${percentChange.toFixed(1)}%` 
        };
      }
    }
  }

  // Flag status changes to terminal states
  if (changeSummary.statusChanged) {
    const newStatus = changeSummary.newStatus;
    if (newStatus === "Completed" || newStatus === "Cancelled") {
      return {
        isFlagged: true,
        flagReason: `Status changed to ${newStatus}`
      };
    }
  }

  return { isFlagged: false };
}

/**
 * Log bulk operation
 * Creates a batch ID and logs activities for multiple records
 */
export async function logBulkGovtProjectActivity(
  ctx: MutationCtx,
  userId: Id<"users">,
  action: "bulk_created" | "bulk_updated" | "bulk_deleted",
  records: Array<{ 
    breakdownId?: Id<"govtProjectBreakdowns">; 
    breakdown?: any; 
    previousValues?: any; 
    newValues?: any 
  }>,
  config?: {
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    source?: "web_ui" | "bulk_import" | "api" | "system" | "migration";
  }
): Promise<string> {
  // Generate batch ID
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log each record
  for (const record of records) {
    await logGovtProjectActivity(ctx, userId, {
      action,
      breakdownId: record.breakdownId,
      breakdown: record.breakdown,
      previousValues: record.previousValues,
      newValues: record.newValues,
      batchId,
      ...config,
    });
  }

  return batchId;
}