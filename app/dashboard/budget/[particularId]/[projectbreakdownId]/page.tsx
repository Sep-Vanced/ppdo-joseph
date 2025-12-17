// app/dashboard/budget/[particularId]/[projectbreakdownId]/page.tsx

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
import { Eye, EyeOff } from "lucide-react";

// Define the Breakdown type based on your Convex schema
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
  status?: "Completed" | "On-Going" | "On-Hold" | "Cancelled" | "Delayed";
  remarks?: string;
  district?: string;
  municipality?: string;
  barangay?: string;
  reportDate?: number;
  batchId?: string;
  fundSource?: string;
}

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
    "20% DF": "20% Development Fund",
  };
  return mapping[particular] || particular;
};

// Helper function to extract project ID from slug
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

const STORAGE_KEY = "project-breakdown-header-visibility";

export default function ProjectBreakdownPage() {
  const router = useRouter();
  const params = useParams();
  const { accentColorValue } = useAccentColor();
  const { setCustomBreadcrumbs } = useBreadcrumb();
  const particularId = decodeURIComponent(params.particularId as string);
  const slugWithId = params.projectbreakdownId as string;
  const projectId = extractProjectId(slugWithId);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
  
  // Header visibility state - default hidden, load from localStorage
  const [showHeader, setShowHeader] = useState(false);

  // Load visibility preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setShowHeader(saved === "true");
    }
  }, []);

  // Toggle visibility and save to localStorage
  const toggleHeaderVisibility = () => {
    const newValue = !showHeader;
    setShowHeader(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  // Get the project details
  const project = useQuery(
    api.projects.get,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );
  // Get all breakdowns for this project using the new backend
  const breakdownHistory = useQuery(
    api.govtProjects.getProjectBreakdowns,
    project ? { projectName: project.projectName } : "skip"
  );
  // Fetch departments for the form
  const departments = useQuery(api.departments.list, { includeInactive: false });

  const particularFullName = getParticularFullName(particularId);
  // Set custom breadcrumbs when project data is loaded
  useEffect(() => {
    if (project) {
      setCustomBreadcrumbs([
        { label: "Home", href: "/dashboard" },
        { label: "Budget", href: "/dashboard/budget" },
        { label: particularFullName, href: `/dashboard/budget/${encodeURIComponent(particularId)}` },
        { label: project.departmentName || "Loading..." },
      ]);
    }

    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [project, particularFullName, particularId, setCustomBreadcrumbs]);
  
  // Mutations - using new backend functions
  const createBreakdown = useMutation(api.govtProjects.createProjectBreakdown);
  const updateBreakdown = useMutation(api.govtProjects.updateProjectBreakdown);
  const deleteBreakdown = useMutation(api.govtProjects.deleteProjectBreakdown);
  
  // Calculate statistics from breakdown history
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
      toast.success("Breakdown record created successfully!");
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
      toast.success("Breakdown record updated successfully!");
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
        reason: "Deleted via dashboard confirmation",
      });
      toast.success("Breakdown record deleted successfully!");
      setShowDeleteModal(false);
      setSelectedBreakdown(null);
    } catch (error) {
      console.error("Error deleting breakdown:", error);
      toast.error("Failed to delete breakdown record", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  // Cast the breakdownHistory to match the expected type
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
                {project?.projectName || "Loading..."}
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
            onClick={toggleHeaderVisibility}
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
          {project && (
            <ActivityLogSheet 
              projectName={project.projectName}
            />
          )}
        </div>
      </div>

      {/* Project Overview Cards - Conditionally Rendered */}
      {showHeader && project && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6 no-print">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Implementing Office
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {project.departmentName || "N/A"}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Current Budget
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(project.allocatedBudget)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Current Accomplishment
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {project.projectAccomplishment.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Status
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
              {project.status?.replace("_", " ") || "N/A"}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Date Started
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatDate(project.dateStarted)}
            </p>
          </div>

          {project.remarks && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                Remarks
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
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
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                          {stats.latestReport.status || "N/A"}
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
            defaultProjectName={project.projectName}
            defaultImplementingOffice={
              departments.find(d => d._id === project.departmentId)?.name || project.departmentName
            }
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
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedBreakdown(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Breakdown Record"
          message={`Are you sure you want to delete this breakdown record for ${selectedBreakdown.implementingOffice}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </>
  );
}