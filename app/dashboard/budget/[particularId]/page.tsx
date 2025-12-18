// app/dashboard/budget/[particularId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ProjectsTable } from "./components/ProjectsTable";
import { useAccentColor } from "../../contexts/AccentColorContext";
import { toast } from "sonner";

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
  const budgetItem = useQuery(api.budgetItems.getByParticulars, { particulars: particular });
  
  // Get all departments for the dropdown
  const departments = useQuery(api.departments.list, { includeInactive: false });
  
  // Get projects using the list query (no budgetItemId filter in old list, but we filter in UI for now)
  // Ideally, use a new query `api.projects.listByBudgetItem` if created, or filter the list
  const allProjects = useQuery(api.projects.list, {});
  
  // Mutations
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const deleteProject = useMutation(api.projects.remove);

  const particularFullName = getParticularFullName(particular);

  // Transform Convex projects to match component interface
  // Filter for projects related to this particular budget item
  // Note: Old schema matched by projectName (particular), new schema links by budgetItemId
  const transformedProjects = allProjects
    ?.filter(project => {
        // Fallback for old projects: match by name
        // For new projects: match by budgetItemId
        if (budgetItem && project.budgetItemId === budgetItem._id) return true;
        return project.projectName === particular;
    })
    .map(project => ({
      id: project._id,
      particulars: project.projectName, // Map projectName to particulars for frontend
      implementingOffice: project.departmentName || project.departmentCode || "Unknown",
      totalBudgetAllocated: project.totalBudgetAllocated,
      obligatedBudget: project.obligatedBudget,
      totalBudgetUtilized: project.totalBudgetUtilized,
      utilizationRate: project.utilizationRate,
      projectCompleted: project.projectCompleted,
      projectDelayed: project.projectDelayed,
      projectsOngoing: project.projectsOnTrack, // Map projectsOnTrack to projectsOngoing for frontend
      remarks: project.notes ?? "", // Map notes to remarks for frontend
      year: project.year,
      status: project.status,
      targetDateCompletion: project.targetDateCompletion,
      // Add pin fields
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
      // Find the department by name (implementing office)
      const department = departments?.find(
        d => d.name === projectData.implementingOffice || d.code === projectData.implementingOffice
      );

      if (!department) {
        toast.error("Please select a valid department/implementing office.");
        return;
      }

      await createProject({
        particulars: projectData.particulars, // Matches budget item name usually
        budgetItemId: budgetItem._id, // 🆕 CRITICAL: Link to budget item
        departmentId: department._id as Id<"departments">,
        totalBudgetAllocated: projectData.totalBudgetAllocated,
        obligatedBudget: projectData.obligatedBudget || undefined,
        totalBudgetUtilized: projectData.totalBudgetUtilized || 0,
        projectCompleted: projectData.projectCompleted || 0,
        projectDelayed: projectData.projectDelayed || 0,
        projectsOngoing: projectData.projectsOngoing || 0,
        remarks: projectData.remarks || undefined,
        year: projectData.year || undefined,
        status: projectData.status || undefined,
        targetDateCompletion: projectData.targetDateCompletion || undefined,
        projectManagerId: projectData.projectManagerId || undefined,
      });

      toast.success("Project created successfully!", {
        description: `"${projectData.particulars}" has been added.`,
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleEditProject = async (id: string, projectData: any) => {
    if (!budgetItem) return;

    try {
      // Find the department by name (implementing office)
      const department = departments?.find(
        d => d.name === projectData.implementingOffice || d.code === projectData.implementingOffice
      );

      if (!department) {
        toast.error("Please select a valid department/implementing office.");
        return;
      }

      await updateProject({
        id: id as Id<"projects">,
        particulars: projectData.particulars,
        budgetItemId: budgetItem._id, // Ensure link is maintained
        departmentId: department._id as Id<"departments">,
        totalBudgetAllocated: projectData.totalBudgetAllocated,
        obligatedBudget: projectData.obligatedBudget || undefined,
        totalBudgetUtilized: projectData.totalBudgetUtilized || 0,
        projectCompleted: projectData.projectCompleted || 0,
        projectDelayed: projectData.projectDelayed || 0,
        projectsOngoing: projectData.projectsOngoing || 0,
        remarks: projectData.remarks || undefined,
        year: projectData.year || undefined,
        status: projectData.status || undefined,
        targetDateCompletion: projectData.targetDateCompletion || undefined,
        projectManagerId: projectData.projectManagerId || undefined,
      });

      toast.success("Project updated successfully!", {
        description: `"${projectData.particulars}" has been updated.`,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject({ id: id as Id<"projects"> });
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
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
  const avgUtilizationRate = transformedProjects.length > 0
    ? transformedProjects.reduce((sum, project) => sum + project.utilizationRate, 0) / transformedProjects.length
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

        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {particularFullName}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Detailed project tracking and budget utilization
        </p>
      </div>

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
        {allProjects === undefined || departments === undefined || budgetItem === undefined ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading projects...</p>
          </div>
        ) : (
          <ProjectsTable
            projects={transformedProjects}
            particularId={particular}
            onAdd={handleAddProject}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        )}
      </div>
    </>
  );
}