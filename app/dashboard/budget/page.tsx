// app/dashboard/budget/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BudgetTrackingTable } from "./components/BudgetTrackingTable";
import { Id } from "@/convex/_generated/dataModel";
import { Expand, X } from "lucide-react";
import { useState } from "react";
import MainSheet from "./components/MainSheet";
import AccessDeniedPage from "@/components/AccessDeniedPage";
import { ProjectStatus } from "./types";
import { ActivityLogSheet } from "../components/ActivityLogSheet";

// ✅ FIXED: Updated interface to reflect backend changes
interface BudgetItemFromDB {
  _id: Id<"budgetItems">;
  _creationTime: number;
  particulars: string;
  totalBudgetAllocated: number;
  obligatedBudget?: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  // 🔒 READ-ONLY: Calculated from child projects
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  notes?: string;
  year?: number;
  status?: ProjectStatus; // ✅ Now auto-calculated by backend
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: Id<"users">;
  departmentId?: Id<"departments">;
  fiscalYear?: number;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  updatedBy?: Id<"users">;
}

interface BudgetItemForUI {
  id: string;
  particular: string;
  totalBudgetAllocated: number;
  obligatedBudget?: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  // These are READ-ONLY and calculated automatically
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  year?: number;
  status?: ProjectStatus; // ✅ Auto-calculated by backend
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
}

export default function BudgetTrackingPage() {
  // Check access first
  const accessCheck = useQuery(api.budgetAccess.canAccess);
  const budgetItemsFromDB = useQuery(api.budgetItems.list);
  const statistics = useQuery(api.budgetItems.getStatistics);
  const createBudgetItem = useMutation(api.budgetItems.create);
  const updateBudgetItem = useMutation(api.budgetItems.update);
  const deleteBudgetItem = useMutation(api.budgetItems.remove);
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);

  // Loading state
  if (accessCheck === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Checking access permissions...
          </p>
        </div>
      </div>
    );
  }

  // Access denied - show access denied page
  if (!accessCheck.canAccess) {
    return (
      <AccessDeniedPage
        userName={accessCheck.user?.name || ""}
        userEmail={accessCheck.user?.email || ""}
        departmentName={accessCheck.department?.name || "Not Assigned"}
        pageRequested="Budget Tracking"
      />
    );
  }

  // Transform database items to UI format
  const budgetData: BudgetItemForUI[] =
    budgetItemsFromDB?.map((item: BudgetItemFromDB) => ({
      id: item._id,
      particular: item.particulars,
      totalBudgetAllocated: item.totalBudgetAllocated,
      obligatedBudget: item.obligatedBudget,
      totalBudgetUtilized: item.totalBudgetUtilized,
      utilizationRate: item.utilizationRate,
      // These are calculated automatically from child projects
      projectCompleted: item.projectCompleted,
      projectDelayed: item.projectDelayed,
      projectsOnTrack: item.projectsOnTrack,
      year: item.year,
      status: item.status, // ✅ Now comes from backend auto-calculation
      isPinned: item.isPinned,
      pinnedAt: item.pinnedAt,
      pinnedBy: item.pinnedBy,
    })) ?? [];

  const handleAdd = async (
    item: Omit<
      BudgetItemForUI,
      "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOnTrack" | "status" // 🆕 Remove status from form data
    >
  ) => {
    try {
      // 🆕 REMOVED: status field - it's now auto-calculated
      await createBudgetItem({
        particulars: item.particular,
        totalBudgetAllocated: item.totalBudgetAllocated,
        obligatedBudget: item.obligatedBudget,
        totalBudgetUtilized: item.totalBudgetUtilized,
        // 🎯 PROJECT COUNTS REMOVED - Backend initializes them to 0
        // 🎯 STATUS REMOVED - Backend auto-calculates it
        year: item.year,
        // ❌ status: item.status, // REMOVED
      });
    } catch (error) {
      console.error("Error creating budget item:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create budget item"
      );
    }
  };

  const handleEdit = async (
    id: string,
    item: Omit<
      BudgetItemForUI,
      "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOnTrack" | "status" // 🆕 Remove status from form data
    >
  ) => {
    try {
      // 🆕 REMOVED: status field - it's now auto-calculated
      await updateBudgetItem({
        id: id as Id<"budgetItems">,
        particulars: item.particular,
        totalBudgetAllocated: item.totalBudgetAllocated,
        obligatedBudget: item.obligatedBudget,
        totalBudgetUtilized: item.totalBudgetUtilized,
        // 🎯 PROJECT COUNTS REMOVED - Backend handles them automatically
        // 🎯 STATUS REMOVED - Backend auto-calculates it
        year: item.year,
        // ❌ status: item.status, // REMOVED
      });
    } catch (error) {
      console.error("Error updating budget item:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update budget item"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBudgetItem({
        id: id as Id<"budgetItems">,
      });
    } catch (error) {
      console.error("Error deleting budget item:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete budget item"
      );
    }
  };

  const handleExpand = () => {
    setIsExpandModalOpen(true);
  };

  if (budgetItemsFromDB === undefined || statistics === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading budget data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 no-print">
        <div className="flex items-center justify-between gap-4 mb-1">
          {/* LEFT: TITLE */}
          <h1
            className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            Budget Tracking
          </h1>

          {/* RIGHT: GLOBAL ACTIVITY LOG BUTTON */}
          <ActivityLogSheet
            type="budget"
            // No entityId means fetch ALL budget logs
            title="Global Budget History"
          />
        </div>

        <p className="text-zinc-600 dark:text-zinc-400">
          Monitor budget allocation, utilization, and project status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Budget Allocated
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ₱{statistics.totalAllocated.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Budget Utilized
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ₱{statistics.totalUtilized.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Average Utilization Rate
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {statistics.averageUtilizationRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Particulars
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {statistics.totalProjects}
          </p>
        </div>
      </div>

      {/* Budget Tracking Table */}
      <div className="mb-6">
        <BudgetTrackingTable
          budgetItems={budgetData}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          expandButton={
            <button
              onClick={handleExpand}
              className="cursor-pointer items-center justify-center px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Expand className="w-4 h-4" />
            </button>
          }
        />
      </div>

      {/* Full Screen Modal with Overlay */}
      {isExpandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setIsExpandModalOpen(false)}
              className="absolute top-1.5 right-4 z-50 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-md"
              title="Close"
            >
              <X className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            </button>

            <div className="w-full h-full">
              <MainSheet />
            </div>
          </div>
        </div>
      )}
    </>
  );
}