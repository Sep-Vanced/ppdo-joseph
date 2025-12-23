"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useAccentColor } from "../../../contexts/AccentColorContext";
import { useBreadcrumb } from "../../../contexts/BreadcrumbContext";
import { BreakdownHistoryTable } from "./components/BreakdownHistoryTable";
import { BreakdownForm } from "./components/BreakdownForm";
import { Modal } from "../../components/Modal";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { toast } from "sonner";
import { ActivityLogSheet } from "../../../components/ActivityLogSheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { TrashBinModal } from "@/app/dashboard/components/TrashBinModal";

// Helper function to get full name from particular ID
const getParticularFullName = (particular: string): string => {
  const mapping: { [key: string]: string } = {
    GAD: "Gender and Development (GAD)",
    LDRRMP: "Local Disaster Risk Reduction and Management Plan",
    LDRRMF: "Local Disaster Risk Reduction and Management Plan",
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

// 🔧 CRITICAL: Extract projectId from slug
const extractProjectId = (slugWithId: string): string => {
  const parts = slugWithId.split('-');
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part.length > 15 && /^[a-z0-9]+$/i.test(part)) {
      return part;
    }
  }
  return parts[parts.length - 1];
};

interface Breakdown {
  _id: string;
  projectName: string;
  implementingOffice: string;
  projectTitle?: string;
  allocatedBudget?: number;
  obligatedBudget?: number;
  budgetUtilized?: number;
  utilizationRate?: number;
  balance?: number;
  dateStarted?: number;
  targetDate?: number;
  completionDate?: number;
  projectAccomplishment?: number;
  status?: "completed" | "ongoing" | "delayed";
  remarks?: string;
  district?: string;
  municipality?: string;
  barangay?: string;
  reportDate?: number;
  batchId?: string;
  fundSource?: string;
}

export default function ProjectBreakdownPage() {
  const router = useRouter();
  const params = useParams();
  const { accentColorValue } = useAccentColor();
  const { setCustomBreadcrumbs } = useBreadcrumb();
  
  // 🔧 CRITICAL: Extract IDs from URL params
  const particularId = decodeURIComponent(params.particularId as string);
  const slugWithId = params.projectbreakdownId as string;
  const projectId = extractProjectId(slugWithId);

  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
  const [showHeader, setShowHeader] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // 🔧 CRITICAL: Fetch project using extracted ID
  const project = useQuery(
    api.projects.get,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );
  
  // Get parent budget item
  const parentBudgetItem = useQuery(
    api.budgetItems.get,
    project?.budgetItemId ? { id: project.budgetItemId } : "skip"
  );
  
  // 🔧 CRITICAL: Fetch breakdowns filtered by projectId
  const breakdownHistory = useQuery(
    api.govtProjects.getProjectBreakdowns,
    project ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  
  const departments = useQuery(api.departments.list, { includeInactive: false });

  const particularFullName = getParticularFullName(particularId);
  
  // Set custom breadcrumbs
  useEffect(() => {
    if (project) {
      setCustomBreadcrumbs([
        { label: "Home", href: "/dashboard" },
        { label: "Budget", href: "/dashboard/budget" },
        { label: particularFullName, href: `/dashboard/budget/${encodeURIComponent(particularId)}` },
        { label: project.implementingOffice || "Loading..." },
      ]);
    }

    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [project, particularFullName, particularId, setCustomBreadcrumbs]);
  
  // Mutations
  const createBreakdown = useMutation(api.govtProjects.createProjectBreakdown);
  const updateBreakdown = useMutation(api.govtProjects.updateProjectBreakdown);
  const deleteBreakdown = useMutation(api.govtProjects.moveToTrash);
  const recalculateProject = useMutation(api.govtProjects.recalculateProject);
  
  // Handle manual recalculation
  const handleRecalculate = async () => {
    if (!project) return;
    
    setIsRecalculating(true);
    try {
      const result = await recalculateProject({
        projectId: projectId as Id<"projects">,
      });
      
      toast.success("Status recalculated successfully!", {
        description: `Project status: ${result.status}, Breakdowns: ${result.breakdownsCount}`,
      });
    } catch (error) {
      console.error("Recalculation error:", error);
      toast.error("Failed to recalculate status");
    } finally {
      setIsRecalculating(false);
    }
  };
  
  // Calculate statistics
  const stats = breakdownHistory
    ? {
        totalReports: breakdownHistory.length,
        latestReport: breakdownHistory[breakdownHistory.length - 1],
        earliestReport: breakdownHistory[0],
        totalAllocated: breakdownHistory.reduce(
          (sum, record) => sum + (record.allocatedBudget || 0),
          0
        ),
        totalUtilized: breakdownHistory.reduce(
          (sum, record) => sum + (record.budgetUtilized || 0),
          0
        ),
        avgAccomplishment:
          breakdownHistory.reduce(
            (sum, record) => sum + (record.projectAccomplishment || 0),
            0
          ) / (breakdownHistory.length || 1),
        statusCounts: breakdownHistory.reduce(
          (acc, record) => {
            if (record.status === "completed") acc.completed++;
            else if (record.status === "delayed") acc.delayed++;
            else if (record.status === "ongoing") acc.ongoing++;
            return acc;
          },
          { completed: 0, delayed: 0, ongoing: 0 }
        ),
        locations: new Set(
          breakdownHistory
            .map((record) => record.municipality)
            .filter(Boolean)
        ).size,
        offices: new Set(
          breakdownHistory.map((record) => record.implementingOffice)
        ).size,
      }
    : null;
    
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return "N/A";
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(timestamp));
  };

  const handlePrint = () => {
    window.print();
  };
  
  const handleAdd = async (breakdownData: Omit<Breakdown, "_id">) => {
    try {
      if (!project) {
        toast.error("Project not found");
        return;
      }

      await createBreakdown({
        projectName: breakdownData.projectName,
        implementingOffice: breakdownData.implementingOffice,
        projectId: projectId as Id<"projects">,
        projectTitle: breakdownData.projectTitle,
        allocatedBudget: breakdownData.allocatedBudget,
        obligatedBudget: breakdownData.obligatedBudget,
        budgetUtilized: breakdownData.budgetUtilized,
        utilizationRate: breakdownData.utilizationRate,
        balance: breakdownData.balance,
        dateStarted: breakdownData.dateStarted,
        targetDate: breakdownData.targetDate,
        completionDate: breakdownData.completionDate,
        projectAccomplishment: breakdownData.projectAccomplishment,
        status: breakdownData.status,
        remarks: breakdownData.remarks,
        district: breakdownData.district,
        municipality: breakdownData.municipality,
        barangay: breakdownData.barangay,
        reportDate: breakdownData.reportDate || Date.now(),
        batchId: breakdownData.batchId,
        fundSource: breakdownData.fundSource,
        reason: "Created via dashboard form",
      });
      
      toast.success("Breakdown record created successfully!", {
        description: "Project and parent budget status will update automatically.",
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating breakdown:", error);
      toast.error("Failed to create breakdown record", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleEdit = (breakdown: Breakdown) => {
    setSelectedBreakdown(breakdown);
    setShowEditModal(true);
  };
  
  const handleUpdate = async (breakdownData: Omit<Breakdown, "_id">) => {
    try {
      if (!selectedBreakdown) {
        toast.error("No breakdown selected");
        return;
      }

      await updateBreakdown({
        breakdownId: selectedBreakdown._id as Id<"govtProjectBreakdowns">,
        projectName: breakdownData.projectName,
        implementingOffice: breakdownData.implementingOffice,
        projectId: projectId as Id<"projects">,
        projectTitle: breakdownData.projectTitle,
        allocatedBudget: breakdownData.allocatedBudget,
        obligatedBudget: breakdownData.obligatedBudget,
        budgetUtilized: breakdownData.budgetUtilized,
        utilizationRate: breakdownData.utilizationRate,
        balance: breakdownData.balance,
        dateStarted: breakdownData.dateStarted,
        targetDate: breakdownData.targetDate,
        completionDate: breakdownData.completionDate,
        projectAccomplishment: breakdownData.projectAccomplishment,
        status: breakdownData.status,
        remarks: breakdownData.remarks,
        district: breakdownData.district,
        municipality: breakdownData.municipality,
        barangay: breakdownData.barangay,
        reason: "Updated via dashboard edit form",
      });
      
      toast.success("Breakdown record updated successfully!", {
        description: "Project and parent budget status will update automatically.",
      });
      setShowEditModal(false);
      setSelectedBreakdown(null);
    } catch (error) {
      console.error("Error updating breakdown:", error);
      toast.error("Failed to update breakdown record", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleDelete = (id: string) => {
    const breakdown = breakdownHistory?.find((b) => b._id === id);
    if (breakdown) {
      setSelectedBreakdown(breakdown);
      setShowDeleteModal(true);
    }
  };
  
  const handleConfirmDelete = async () => {
    try {
      if (!selectedBreakdown) {
        toast.error("No breakdown selected");
        return;
      }

      await deleteBreakdown({
        breakdownId: selectedBreakdown._id as Id<"govtProjectBreakdowns">,
        reason: "Moved to trash via dashboard confirmation",
      });
      
      toast.success("Breakdown record moved to trash!", {
        description: "Project and parent budget status will update automatically.",
      });
      setShowDeleteModal(false);
      setSelectedBreakdown(null);
    } catch (error) {
      console.error("Error moving breakdown to trash:", error);
      toast.error("Failed to move breakdown record to trash");
    }
  };

  const formattedBreakdownHistory: Breakdown[] = breakdownHistory 
    ? breakdownHistory.map((item: any) => ({
        _id: item._id,
        projectName: item.projectName || "",
        implementingOffice: item.implementingOffice || "",
        projectTitle: item.projectTitle,
        allocatedBudget: item.allocatedBudget,
        obligatedBudget: item.obligatedBudget,
        budgetUtilized: item.budgetUtilized,
        utilizationRate: item.utilizationRate,
        balance: item.balance,
        dateStarted: item.dateStarted,
        targetDate: item.targetDate,
        completionDate: item.completionDate,
        projectAccomplishment: item.projectAccomplishment,
        status: item.status,
        remarks: item.remarks,
        district: item.district,
        municipality: item.municipality,
        barangay: item.barangay,
        reportDate: item.reportDate,
        batchId: item.batchId,
        fundSource: item.fundSource,
      }))
    : [];

  return (
    <>
      {/* Header with Toggle and Activity Log Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 no-print">
        <div className="flex-1">
          <Link
            href={`/dashboard/budget/${encodeURIComponent(particularId)}`}
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
            Back to Projects
          </Link>

          {showHeader && (
            <>
              <h1
                className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              >
                {project?.particulars || "Loading..."}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Historical breakdown and progress tracking
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHeader(!showHeader)}
            className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {showHeader ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Hide Details</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Show Details</span>
              </>
            )}
          </Button>
          
          {/* 🆕 Recalculate Button */}
          {project && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`w-4 h-4 ${isRecalculating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Recalculate Status</span>
            </Button>
          )}
          
          {project && (
              <ActivityLogSheet 
                type="breakdown"
                projectName={project.particulars}
                implementingOffice={project.implementingOffice}
              />
            )}
        </div>
      </div>

      {/* 🆕 Status Chain Visualization */}
      {showHeader && project && parentBudgetItem && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 no-print">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Status Chain
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Breakdown Items
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {breakdownHistory?.length || 0}
              </div>
              {stats && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  {stats.statusCounts.ongoing} ongoing • {stats.statusCounts.delayed} delayed • {stats.statusCounts.completed} completed
                </div>
              )}
            </div>
            
            <div className="text-center border-l border-r border-blue-200 dark:border-blue-800 px-6">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Project Status
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(project.status)}`}>
                {project.status?.toUpperCase() || "ONGOING"}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Auto-calculated from {breakdownHistory?.length || 0} breakdowns
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Budget Status
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(parentBudgetItem.status)}`}>
                {parentBudgetItem.status?.toUpperCase() || "ONGOING"}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Auto-calculated from project
              </div>
            </div>
          </div>
          
          {/* 🆕 Status Rules */}
          <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Status Calculation Rules
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">1. Ongoing Priority</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  Any ongoing item sets parent to ongoing
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">2. Delayed Priority</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  If no ongoing, any delayed sets parent to delayed
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">3. Completed</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  Only if all items are completed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Overview Cards - Conditionally Rendered */}
      {showHeader && project && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6 no-print">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Implementing Office
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {project.implementingOffice || "N/A"}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Current Budget
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(project.totalBudgetAllocated)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Breakdown Counts
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {project.projectCompleted}C • {project.projectDelayed}D • {project.projectsOnTrack}O
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Project Status
            </p>
            <p className={`text-sm font-semibold ${getStatusColor(project.status)}`}>
              {project.status?.toUpperCase() || "ONGOING"}
            </p>
          </div>

          {project.year && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                Year
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {project.year}
              </p>
            </div>
          )}

          {project.remarks && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                Remarks
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {project.remarks}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary Statistics Accordion - Conditionally Rendered */}
      {showHeader && stats && (
        <div className="mb-6 no-print">
          <Accordion type="single" collapsible>
            <AccordionItem value="statistics" className="border-none">
              <AccordionTrigger className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 px-6 py-4 hover:no-underline [&[data-state=open]]:rounded-b-none">
                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Summary Statistics
                </span>
              </AccordionTrigger>
              <AccordionContent className="bg-white dark:bg-zinc-900 rounded-b-xl border border-t-0 border-zinc-200 dark:border-zinc-800 px-6 pb-6 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Total Breakdown Records
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {stats.totalReports}
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Implementing Offices
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {stats.offices}
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Total Allocated
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(stats.totalAllocated)}
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Average Accomplishment
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {stats.avgAccomplishment.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* 🆕 Status Distribution */}
                {stats.statusCounts && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl border border-green-200 dark:border-green-800 p-6 mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      Status Distribution
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                          Completed
                        </div>
                        <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                          {stats.statusCounts.completed}
                        </div>
                        <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                          {stats.totalReports > 0 ? Math.round((stats.statusCounts.completed / stats.totalReports) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                          Ongoing
                        </div>
                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                          {stats.statusCounts.ongoing}
                        </div>
                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                          {stats.totalReports > 0 ? Math.round((stats.statusCounts.ongoing / stats.totalReports) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                          Delayed
                        </div>
                        <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                          {stats.statusCounts.delayed}
                        </div>
                        <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                          {stats.totalReports > 0 ? Math.round((stats.statusCounts.delayed / stats.totalReports) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Latest Report Highlight */}
                {stats.latestReport && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      Latest Record
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Implementing Office
                        </p>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {stats.latestReport.implementingOffice}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Location
                        </p>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {stats.latestReport.municipality || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Status</p>
                        <p className={`text-base font-medium ${getStatusColor(stats.latestReport.status)}`}>
                          {stats.latestReport.status?.toUpperCase() || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Accomplishment
                        </p>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {stats.latestReport.projectAccomplishment?.toFixed(1) || "0.0"}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Breakdown History Table */}
      <div className="mb-6">
        {breakdownHistory === undefined ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading breakdown history...
            </p>
          </div>
        ) : (
          <BreakdownHistoryTable
            breakdowns={formattedBreakdownHistory}
            onPrint={handlePrint}
            onAdd={() => setShowAddModal(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenTrash={() => setShowTrashModal(true)}
          />
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && project && departments && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Breakdown Record"
          size="xl"
        >
          <BreakdownForm
            defaultProjectName={project.particulars}
            defaultImplementingOffice={project.implementingOffice}
            projectId={projectId}  // 🔧 ADD THIS LINE
            onSave={handleAdd}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBreakdown && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBreakdown(null);
          }}
          title="Edit Breakdown Record"
          size="xl"
        >
          <BreakdownForm
            breakdown={selectedBreakdown}
            projectId={projectId}  // 🔧 ADD THIS LINE
            onSave={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedBreakdown(null);
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBreakdown && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setSelectedBreakdown(null); }}
          onConfirm={handleConfirmDelete}
          title="Move to Trash"
          message={`Are you sure you want to move this breakdown record for ${selectedBreakdown.implementingOffice} to trash?`}
          confirmText="Move to Trash"
          variant="danger"
        />
      )}

      {/* NEW: Trash Modal for Breakdowns */}
      <TrashBinModal 
        isOpen={showTrashModal} 
        onClose={() => setShowTrashModal(false)} 
        type="breakdown" 
      />
    </>
  );
}

// 🆕 Helper function for status colors
function getStatusColor(status?: "completed" | "ongoing" | "delayed"): string {
  if (!status) return "text-zinc-600 dark:text-zinc-400";
  switch (status) {
    case "completed": return "text-green-600 dark:text-green-400";
    case "ongoing": return "text-blue-600 dark:text-blue-400";
    case "delayed": return "text-red-600 dark:text-red-400";
    default: return "text-zinc-600 dark:text-zinc-400";
  }
}