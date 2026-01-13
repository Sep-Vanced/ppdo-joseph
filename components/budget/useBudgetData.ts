import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BudgetItem, BudgetItemFromDB } from "@/types/types";

export function useBudgetData() {
  const budgetItemsFromDB = useQuery(api.budgetItems.list);
  const statistics = useQuery(api.budgetItems.getStatistics);

  const budgetItems: BudgetItem[] =
    budgetItemsFromDB?.map((item: BudgetItemFromDB) => ({
      id: item._id,
      particular: item.particulars,
      totalBudgetAllocated: item.totalBudgetAllocated,
      obligatedBudget: item.obligatedBudget,
      totalBudgetUtilized: item.totalBudgetUtilized,
      utilizationRate: item.utilizationRate,
      projectCompleted: item.projectCompleted,
      projectDelayed: item.projectDelayed,
      projectsOnTrack: item.projectsOnTrack,
      year: item.year,
      status: item.status,
      isPinned: item.isPinned,
      pinnedAt: item.pinnedAt,
      pinnedBy: item.pinnedBy,
    })) ?? [];

  return {
    budgetItems,
    statistics,
    isLoading: budgetItemsFromDB === undefined || statistics === undefined,
  };
}

export function useBudgetAccess() {
  const accessCheck = useQuery(api.budgetAccess.canAccess);

  return {
    accessCheck,
    isLoading: accessCheck === undefined,
    canAccess: accessCheck?.canAccess ?? false,
    user: accessCheck?.user,
    department: accessCheck?.department,
  };
}
