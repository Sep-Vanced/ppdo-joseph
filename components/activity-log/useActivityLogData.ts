import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ActivityLogSheetProps, UnifiedActivityLog } from "./types";

type UseActivityLogDataArgs = Pick<
  ActivityLogSheetProps,
  "type" | "entityId" | "budgetItemId" | "projectName" | "implementingOffice"
> & {
  actionFilter: string;
  loadedCount: number;
};

type ActivityLogResponse = {
  activities: UnifiedActivityLog[];
  isLoading: boolean;
  hasMoreToLoad: boolean;
};

export function useActivityLogData({
  type,
  entityId,
  budgetItemId,
  projectName,
  implementingOffice,
  actionFilter,
  loadedCount,
}: UseActivityLogDataArgs): ActivityLogResponse {
  const breakdownLogs = useQuery(
    api.govtProjectActivities.getAllActivities,
    type === "breakdown"
      ? {
          projectName,
          implementingOffice,
          action: actionFilter !== "all" ? actionFilter : undefined,
          pageSize: loadedCount,
        }
      : "skip"
  );

  const projectLogs = useQuery(
    api.projectActivities.getByProject,
    type === "project" && entityId
      ? { projectId: entityId as Id<"projects">, limit: loadedCount }
      : "skip"
  );

  const projectLogsByBudget = useQuery(
    api.projectActivities.getByBudgetItem,
    type === "project" && budgetItemId && !entityId
      ? { budgetItemId: budgetItemId as Id<"budgetItems">, limit: loadedCount }
      : "skip"
  );

  const singleBudgetLogs = useQuery(
    api.budgetItemActivities.getByBudgetItem,
    type === "budget" && entityId
      ? { budgetItemId: entityId as Id<"budgetItems">, limit: loadedCount }
      : "skip"
  );

  const allBudgetLogs = useQuery(
    api.budgetItemActivities.getAll,
    type === "budget" && !entityId ? { limit: loadedCount } : "skip"
  );

  let activities: UnifiedActivityLog[] = [];
  let isLoading = false;

  if (type === "breakdown") {
    activities = (breakdownLogs?.activities || []) as UnifiedActivityLog[];
    isLoading = breakdownLogs === undefined;
  } else if (type === "project") {
    activities = (projectLogs || projectLogsByBudget || []) as UnifiedActivityLog[];
    isLoading = projectLogs === undefined && projectLogsByBudget === undefined;
  } else if (type === "budget") {
    if (entityId) {
      activities = (singleBudgetLogs || []) as UnifiedActivityLog[];
      isLoading = singleBudgetLogs === undefined;
    } else {
      activities = (allBudgetLogs || []) as UnifiedActivityLog[];
      isLoading = allBudgetLogs === undefined;
    }
  }

  return {
    activities,
    isLoading,
    hasMoreToLoad: activities.length >= loadedCount,
  };
}
