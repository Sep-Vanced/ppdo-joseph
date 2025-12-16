// app/dashboard/budget/components/BudgetTrackingTable.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BudgetItem } from "../types";
import { useAccentColor } from "../../contexts/AccentColorContext";
import { Modal } from "./Modal";
import { ConfirmationModal } from "./ConfirmationModal";
import { BudgetItemForm } from "./BudgetItemForm";

interface BudgetTrackingTableProps {
  budgetItems: BudgetItem[];
  onAdd?: (item: Omit<BudgetItem, "id" | "utilizationRate">) => void;
  onEdit?: (id: string, item: Omit<BudgetItem, "id" | "utilizationRate">) => void;
  onDelete?: (id: string) => void;
  expandButton?: React.ReactNode;
}

export function BudgetTrackingTable({
  budgetItems,
  onAdd,
  onEdit,
  onDelete,
  expandButton,
}: BudgetTrackingTableProps) {
  const { accentColorValue } = useAccentColor();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const getUtilizationColor = (rate: number): string => {
    if (rate >= 80) return "text-red-600 dark:text-red-400";
    if (rate >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  const getProjectStatusColor = (value: number): string => {
    if (value >= 50) return "text-green-600 dark:text-green-400";
    if (value >= 30) return "text-orange-600 dark:text-orange-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  // Calculate totals
  const totals = budgetItems.reduce(
    (acc, item) => ({
      totalBudgetAllocated:
        acc.totalBudgetAllocated + item.totalBudgetAllocated,
      totalBudgetUtilized: acc.totalBudgetUtilized + item.totalBudgetUtilized,
      projectCompleted: acc.projectCompleted + item.projectCompleted,
      projectDelayed: acc.projectDelayed + item.projectDelayed,
      projectsOnTrack: acc.projectsOnTrack + item.projectsOnTrack,
    }),
    {
      totalBudgetAllocated: 0,
      totalBudgetUtilized: 0,
      projectCompleted: 0,
      projectDelayed: 0,
      projectsOnTrack: 0,
    }
  );

  const totalUtilizationRate =
    totals.totalBudgetAllocated > 0
      ? (totals.totalBudgetUtilized / totals.totalBudgetAllocated) * 100
      : 0;

  const handleRowClick = (item: BudgetItem, e: React.MouseEvent) => {
    // Don't navigate if clicking action buttons or first column (Actions)
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("td:first-child")
    ) {
      return;
    }
    router.push(`/dashboard/budget/${encodeURIComponent(item.particular)}`);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleMenuToggle = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === itemId ? null : itemId);
  };

  const handleEdit = (item: BudgetItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = (item: BudgetItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleSave = (formData: Omit<BudgetItem, "id" | "utilizationRate">) => {
    if (selectedItem && onEdit) {
      onEdit(selectedItem.id, formData);
    } else if (onAdd) {
      onAdd(formData);
    }
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const handleConfirmDelete = () => {
    if (selectedItem && onDelete) {
      onDelete(selectedItem.id);
    }
    setSelectedItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header with Add Button and Print */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between no-print">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Budget Items
          </h3>
          <div className="flex items-center gap-2">
            {expandButton}
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              title="Print"
            >
              <div className="cursor-pointer  flex items-center gap-2">
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </div>
            </button>
            {onAdd && (
              <button
                onClick={() => setShowAddModal(true)}
                className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md text-white"
                style={{ backgroundColor: accentColorValue }}
              >
                Add New Item
              </button>
            )}
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print-only p-4 border-b border-zinc-900">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Budget Tracking</h2>
          <p className="text-sm text-zinc-700">
            Generated on: {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Table with fixed header - Added max-height and relative positioning */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                {(onEdit || onDelete) && (
                  <th className="px-4 sm:px-6 py-4 text-center no-print sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Actions
                    </span>
                  </th>
                )}
                <th className="px-4 sm:px-6 py-4 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    PARTICULARS
                  </span>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    TOTAL BUDGET ALLOCATED
                  </span>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    TOTAL BUDGET UTILIZED
                  </span>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    UTILIZATION RATE
                  </span>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    PROJECT COMPLETED (%)
                  </span>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    PROJECT DELAYED (%)
                  </span>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    PROJECTS ON TRACK (%)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {budgetItems.length > 0 ? (
                <>
                  {budgetItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={(e) => handleRowClick(item, e)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    >
                      {(onEdit || onDelete) && (
                        <td
                          className="px-4 sm:px-6 py-4 text-center no-print"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative" ref={(el) => { menuRefs.current[item.id] = el; }}>
                            <button
                              onClick={(e) => handleMenuToggle(item.id, e)}
                              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Actions"
                            >
                              <svg
                                className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>
                            {openMenuId === item.id && (
                              <div className="absolute left-full ml-2 top-0 w-32 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50">
                                {onEdit && (
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
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
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                    Edit
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={() => handleDelete(item)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.particular}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.totalBudgetAllocated}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.totalBudgetUtilized}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span
                          className={`text-sm font-semibold ${getUtilizationColor(
                            item.utilizationRate
                          )}`}
                        >
                          {item.utilizationRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span
                          className={`text-sm font-medium ${getProjectStatusColor(
                            item.projectCompleted
                          )}`}
                        >
                          {item.projectCompleted.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span
                          className={`text-sm font-medium ${getProjectStatusColor(
                            item.projectDelayed
                          )}`}
                        >
                          {item.projectDelayed.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span
                          className={`text-sm font-medium ${getProjectStatusColor(
                            item.projectsOnTrack
                          )}`}
                        >
                          {item.projectsOnTrack.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 font-semibold">
                    {(onEdit || onDelete) && <td className="no-print"></td>}
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">
                        TOTAL
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <span
                        className="text-sm"
                        style={{ color: accentColorValue }}
                      >
                        {totals.totalBudgetAllocated}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <span
                        className="text-sm"
                        style={{ color: accentColorValue }}
                      >
                        {totals.totalBudgetUtilized}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <span
                        className={`text-sm ${getUtilizationColor(
                          totalUtilizationRate
                        )}`}
                      >
                        {totalUtilizationRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <span
                        className="text-sm"
                        style={{ color: accentColorValue }}
                      >
                        {(totals.projectCompleted / budgetItems.length).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <span
                        className="text-sm"
                        style={{ color: accentColorValue }}
                      >
                        {(totals.projectDelayed / budgetItems.length).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <span
                        className="text-sm"
                        style={{ color: accentColorValue }}
                      >
                        {(totals.projectsOnTrack / budgetItems.length).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan={onEdit || onDelete ? 8 : 7}
                    className="px-4 sm:px-6 py-12 text-center"
                  >
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No budget data available.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Budget Item"
          size="lg"
        >
          <BudgetItemForm
            onSave={handleSave}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          title="Edit Budget Item"
          size="lg"
        >
          <BudgetItemForm
            item={selectedItem}
            onSave={handleSave}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Budget Item"
          message={`Are you sure you want to delete "${selectedItem.particular}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </>
  );
}