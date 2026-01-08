import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export function useProjectMutations(budgetItemId?: Id<"budgetItems">) {
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const deleteProject = useMutation(api.projects.moveToTrash);
  const recalculateBudgetItem = useMutation(api.budgetItems.recalculateSingleBudgetItem);

  const handleAddProject = async (projectData: any) => {
    if (!budgetItemId) {
      toast.error("Budget item not found. Cannot create project.");
      return;
    }

    try {
      const response: any = await createProject({
        particulars: projectData.particulars,
        budgetItemId,
        categoryId: projectData.categoryId || undefined,
        implementingOffice: projectData.implementingOffice,
        totalBudgetAllocated: projectData.totalBudgetAllocated,
        obligatedBudget: projectData.obligatedBudget || undefined,
        totalBudgetUtilized: projectData.totalBudgetUtilized || 0,
        remarks: projectData.remarks || undefined,
        year: projectData.year || undefined,
        targetDateCompletion: projectData.targetDateCompletion || undefined,
        projectManagerId: projectData.projectManagerId || undefined,
      });

      if (response.success) {
        toast.success(response.message || "Project created successfully!", {
          description: `"${projectData.particulars}" has been added.`,
        });
      } else {
        toast.error(response.error?.message || "Failed to create project");
        if (response.error?.code === "VALIDATION_ERROR") {
          console.error("Validation details:", response.error.details);
        }
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("An unexpected error occurred", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleEditProject = async (id: string, projectData: any) => {
    if (!budgetItemId) return;
    
    try {
      const response: any = await updateProject({
        id: id as Id<"projects">,
        particulars: projectData.particulars,
        budgetItemId,
        categoryId: projectData.categoryId || undefined,
        implementingOffice: projectData.implementingOffice,
        totalBudgetAllocated: projectData.totalBudgetAllocated,
        obligatedBudget: projectData.obligatedBudget || undefined,
        totalBudgetUtilized: projectData.totalBudgetUtilized || 0,
        remarks: projectData.remarks || undefined,
        year: projectData.year || undefined,
        targetDateCompletion: projectData.targetDateCompletion || undefined,
        projectManagerId: projectData.projectManagerId || undefined,
        reason: "Updated via dashboard UI",
      });

      if (response.success) {
        toast.success(response.message || "Project updated successfully!", {
          description: `"${projectData.particulars}" has been updated.`,
        });
      } else {
        toast.error(response.error?.message || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("An unexpected error occurred", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const response: any = await deleteProject({
        id: id as Id<"projects">,
        reason: "Moved to trash via project dashboard",
      });

      if (response.success) {
        toast.success(response.message || "Project moved to trash successfully!");
      } else {
        toast.error(response.error?.message || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleRecalculate = async () => {
    if (!budgetItemId) return;
    
    try {
      const result: any = await recalculateBudgetItem({ budgetItemId });

      if (result.success) {
        toast.success("Budget item recalculated successfully!");
      } else if (result.status) {
        toast.success("Budget item recalculated successfully!", {
          description: `Status: ${result.status}, Projects: ${result.projectsCount}`,
        });
      }
    } catch (error) {
      console.error("Recalculation error:", error);
      toast.error("Failed to recalculate budget item");
    }
  };

  return {
    handleAddProject,
    handleEditProject,
    handleDeleteProject,
    handleRecalculate,
  };
}
