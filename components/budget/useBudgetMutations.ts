import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { BudgetItem } from "../../../../../types/types";

export function useBudgetMutations() {
  const createBudgetItem = useMutation(api.budgetItems.create);
  const updateBudgetItem = useMutation(api.budgetItems.update);
  const moveToTrash = useMutation(api.budgetItems.moveToTrash);

  const handleAdd = async (
    item: Omit<
      BudgetItem,
      | "id"
      | "utilizationRate"
      | "projectCompleted"
      | "projectDelayed"
      | "projectsOnTrack"
      | "status"
    >
  ) => {
    try {
      await createBudgetItem({
        particulars: item.particular,
        totalBudgetAllocated: item.totalBudgetAllocated,
        obligatedBudget: item.obligatedBudget,
        totalBudgetUtilized: item.totalBudgetUtilized,
        year: item.year,
      });
      toast.success("Budget item created successfully");
    } catch (error) {
      console.error("Error creating budget item:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create budget item";
      toast.error(message);
      throw error;
    }
  };

  const handleEdit = async (
    id: string,
    item: Omit<
      BudgetItem,
      | "id"
      | "utilizationRate"
      | "projectCompleted"
      | "projectDelayed"
      | "projectsOnTrack"
      | "status"
    >
  ) => {
    try {
      await updateBudgetItem({
        id: id as Id<"budgetItems">,
        particulars: item.particular,
        totalBudgetAllocated: item.totalBudgetAllocated,
        obligatedBudget: item.obligatedBudget,
        totalBudgetUtilized: item.totalBudgetUtilized,
        year: item.year,
      });
      toast.success("Budget item updated successfully");
    } catch (error) {
      console.error("Error updating budget item:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update budget item";
      toast.error(message);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await moveToTrash({
        id: id as Id<"budgetItems">,
        reason: "Moved to trash via dashboard",
      });
      toast.success("Item moved to trash");
    } catch (error) {
      console.error("Error deleting budget item:", error);
      toast.error("Failed to move item to trash");
      throw error;
    }
  };

  return {
    handleAdd,
    handleEdit,
    handleDelete,
  };
}
