// app/dashboard/budget/[particularId]/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ProjectsTable } from "./components/ProjectsTable";
import { useAccentColor } from "../../contexts/AccentColorContext";
import { toast } from "sonner";
import { getStatusDisplayText } from "../types";
import { ActivityLogSheet } from "../../components/ActivityLogSheet";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

// Helper function to get full name from particular ID
const getParticularFullName = (particular: string): string => {
  const mapping: { [key: string]: string } = {
    GAD: "Gender and Development (GAD)",
    LDRRMP: "Local Disaster Risk Reduction and Management Plan",
    LCCAP: "Local Climate Change Action Plan",
    LCPC: "Local Council for the Protection of Children",
    SCPD: "Sectoral Committee for Persons with Disabilities",
    POPS: "Provincial Operations",
    CAIDS: "Community Affairs and Information Development Services",
    LNP: "Local Nutrition Program",
    PID: "Provincial Information Department",
    ACDP: "Agricultural Competitiveness Development Program",
    LYDP: "Local Youth Development Program",
    "20%_DF": "20% Development Fund",
  };
  return mapping[particular] || particular;
};

export default function ParticularProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const { accentColorValue } = useAccentColor();
  const particular = decodeURIComponent(params.particularId as string);

  // Get budget item by particular name to get its ID
  const budgetItem = useQuery(api.budgetItems.getByParticulars, {
    particulars: particular,
  });

  // 🔧 ADD: Debug log to verify budgetItem is loaded
  useEffect(() => {
    console.log("🎯 [Page] Budget Item Query Result:", {
      particular,
      budgetItem,
      hasBudgetItem: !!budgetItem,
      budgetItemId: budgetItem?._id,
    });
  }, [particular, budgetItem]);

  // 🆕 Get breakdown statistics for this budget item
  const breakdownStats = useQuery(api.govtProjects.getBreakdownStats, {
    budgetItemId: budgetItem?._id,
  });

  // Get all departments for the dropdown
  const departments = useQuery(api.departments.list, { includeInactive: false });

  // Get projects filtered by budgetItemId
  const projects = useQuery(
    api.projects.list,
    budgetItem ? { budgetItemId: budgetItem._id } : "skip"
  );

  // Mutations
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const deleteProject = useMutation(api.projects.remove);
  const recalculateBudgetItem = useMutation(api.budgetItems.recalculateSingleBudgetItem);

  const particularFullName = getParticularFullName(particular);

  // Transform Convex projects to match component interface
  const transformedProjects =
    projects?.map((project) => ({
      id: project._id,
      particulars: project.particulars,
      implementingOffice: project.implementingOffice,
      totalBudgetAllocated: project.totalBudgetAllocated,
      obligatedBudget: project.obligatedBudget,
      totalBudgetUtilized: project.totalBudgetUtilized,
      utilizationRate: project.utilizationRate,
      projectCompleted: project.projectCompleted,
      projectDelayed: project.projectDelayed,
      projectsOngoing: project.projectsOnTrack,
      remarks: project.remarks ?? "",
      year: project.year,
      status: project.status,
      targetDateCompletion: project.targetDateCompletion,
      isPinned: project.isPinned,
      pinnedAt: project.pinnedAt,
      pinnedBy: project.pinnedBy,
      budgetItemId: project.budgetItemId,
    })) ?? [];

  const handleAddProject = async (projectData: any) => {
    if (!budgetItem) {
      toast.error("Budget item not found. Cannot create project.");
      return;
    }

    try {
      // Find the department by name
      const department = departments?.find(
        (d) =>
          d.name === projectData.implementingOffice ||
          d.code === projectData.implementingOffice
      );

      if (!department) {
        toast.error("Please select a valid department/implementing office.");
        return;
      }

      await createProject({
        particulars: projectData.particulars,
        budgetItemId: budgetItem._id,
        implementingOffice: projectData.implementingOffice,
        totalBudgetAllocated: projectData.totalBudgetAllocated,
        obligatedBudget: projectData.obligatedBudget || undefined,
        totalBudgetUtilized: projectData.totalBudgetUtilized || 0,
        remarks: projectData.remarks || undefined,
        year: projectData.year || undefined,
        targetDateCompletion: projectData.targetDateCompletion || undefined,
        projectManagerId: projectData.projectManagerId || undefined,
      });

      toast.success("Project created successfully!", {
        description: `"${projectData.particulars}" has been added. Status will auto-update when breakdowns are added.`,
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleEditProject = async (id: string, projectData: any) => {
    if (!budgetItem) return;

    try {
      const department = departments?.find(
        (d) =>
          d.name === projectData.implementingOffice ||
          d.code === projectData.implementingOffice
      );

      if (!department) {
        toast.error("Please select a valid department/implementing office.");
        return;
      }

      await updateProject({
        id: id as Id<"projects">,
        particulars: projectData.particulars,
        budgetItemId: budgetItem._id,
        implementingOffice: projectData.implementingOffice,
        totalBudgetAllocated: projectData.totalBudgetAllocated,
        obligatedBudget: projectData.obligatedBudget || undefined,
        totalBudgetUtilized: projectData.totalBudgetUtilized || 0,
        remarks: projectData.remarks || undefined,
        year: projectData.year || undefined,
        targetDateCompletion: projectData.targetDateCompletion || undefined,
        projectManagerId: projectData.projectManagerId || undefined,
      });

      toast.success("Project updated successfully!", {
        description: `"${projectData.particulars}" has been updated.`,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject({ id: id as Id<"projects"> });
      toast.success("Project deleted successfully!", {
        description: "Parent budget item metrics updated automatically.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  // 🆕 Handle manual recalculation
  const handleRecalculateBudgetItem = async () => {
    if (!budgetItem) return;
    
    try {
      const result = await recalculateBudgetItem({
        budgetItemId: budgetItem._id,
      });
      
      toast.success("Budget item recalculated successfully!", {
        description: `Status: ${result.status}, Projects: ${result.projectsCount}`,
      });
    } catch (error) {
      console.error("Recalculation error:", error);
      toast.error("Failed to recalculate budget item");
    }
  };

  // Calculate summary statistics
  const totalAllocatedBudget = transformedProjects.reduce(
    (sum, project) => sum + project.totalBudgetAllocated,
    0
  );
  const totalUtilizedBudget = transformedProjects.reduce(
    (sum, project) => sum + project.totalBudgetUtilized,
    0
  );
  const avgUtilizationRate =
    transformedProjects.length > 0
      ? transformedProjects.reduce(
          (sum, project) => sum + project.utilizationRate,
          0
        ) / transformedProjects.length
      : 0;

  return (
    <>
      {/* Back Button and Page Header */}
      <div className="mb-6 no-print">
        <Link
          href="/dashboard/budget"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Budget Tracking
        </Link>

        <div className="flex items-center justify-between gap-4 mb-1">
          {/* LEFT: PARTICULAR FULL NAME */}
          <h1
            className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            {particularFullName}
          </h1>

          {/* RIGHT: ACTIVITY LOG BUTTON */}
          {budgetItem && (
            <ActivityLogSheet
              type="budget"
              entityId={budgetItem._id}
              title={`Log: ${budgetItem.particulars}`}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Budget Log</span>
                </Button>
              }
            />
          )}
        </div>

        <p className="text-zinc-600 dark:text-zinc-400">
          Detailed project tracking and budget utilization
          {budgetItem?.status && (
            <span className={`ml-2 font-medium ${getStatusColorClass(budgetItem.status)}`}>
              • Status: {getStatusDisplayText(budgetItem.status)}
            </span>
          )}
        </p>

        
      </div>

      

      {/* 🆕 Status Information Card */}
      {budgetItem && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 no-print">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Status Information
            </h3>
            <button
              onClick={handleRecalculateBudgetItem}
              className="px-3 py-1 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Recalculate
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Budget Status
              </div>
              <div className={`text-2xl font-bold ${getStatusColorClass(budgetItem.status || "ongoing")}`}>
                {budgetItem.status?.toUpperCase() || "ONGOING"}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Auto-calculated from projects
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Total Projects
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {transformedProjects.length}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                {budgetItem.projectCompleted}C • {budgetItem.projectDelayed}D • {budgetItem.projectsOnTrack}O
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Total Breakdowns
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {breakdownStats?.totalBreakdowns || 0}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Across all projects
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Status Rule
              </div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                {budgetItem.projectsOnTrack > 0 
                  ? "Ongoing (has ongoing projects)"
                  : budgetItem.projectDelayed > 0
                  ? "Delayed (has delayed projects)"
                  : "Completed (all projects completed)"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Allocated Budget
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalAllocatedBudget)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Utilized Budget
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalUtilizedBudget)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Average Utilization Rate
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {avgUtilizationRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Projects
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {transformedProjects.length}
          </p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="mb-6">
        {projects === undefined ||
        departments === undefined ||
        budgetItem === undefined ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading projects...
            </p>
          </div>
        ) : (
          <ProjectsTable
            projects={transformedProjects}
            particularId={particular}
            budgetItemId={budgetItem._id} // 🔧 CRITICAL FIX: Pass budgetItemId here!
            onAdd={handleAddProject}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        )}
      </div>
    </>
  );
}

// 🆕 Helper function
function getStatusColorClass(status?: "completed" | "ongoing" | "delayed"): string {
  if (!status) return "text-zinc-600 dark:text-zinc-400";
  switch (status) {
    case "completed": return "text-green-600 dark:text-green-400";
    case "ongoing": return "text-blue-600 dark:text-blue-400";
    case "delayed": return "text-red-600 dark:text-red-400";
    default: return "text-zinc-600 dark:text-zinc-400";
  }
}