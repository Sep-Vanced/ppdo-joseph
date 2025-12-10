// app/dashboard/budget/[particularId]/[projectId]/components/FinancialBreakdownTable.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { FinancialBreakdownItem } from "../../../types";
import { useAccentColor } from "../../../../contexts/AccentColorContext";
import { flattenFinancialBreakdown } from "../data";
import { Modal } from "../../../components/Modal";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { FinancialBreakdownItemForm } from "./FinancialBreakdownItemForm";

interface FinancialBreakdownTableProps {
  items: FinancialBreakdownItem[];
  onAdd?: (
    item: Omit<FinancialBreakdownItem, "id" | "children">
  ) => void;
  onEdit?: (
    id: string,
    item: Omit<FinancialBreakdownItem, "id" | "children">
  ) => void;
  onDelete?: (id: string) => void;
}

export function FinancialBreakdownTable({
  items,
  onAdd,
  onEdit,
  onDelete,
}: FinancialBreakdownTableProps) {
  const { accentColorValue } = useAccentColor();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FinancialBreakdownItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      appropriation: acc.appropriation + item.appropriation,
      obligation: acc.obligation + item.obligation,
      balance: acc.balance + item.balance,
    }),
    {
      appropriation: 0,
      obligation: 0,
      balance: 0,
    }
  );

  const obligationPercentage =
    totals.appropriation > 0
      ? (totals.obligation / totals.appropriation) * 100
      : 0;
  const balancePercentage =
    totals.appropriation > 0
      ? (totals.balance / totals.appropriation) * 100
      : 0;

  const flattenedItems = flattenFinancialBreakdown(items);

  const getPaddingLeft = (level: number): string => {
    switch (level) {
      case 0:
        return "pl-2 sm:pl-4";
      case 1:
        return "pl-6 sm:pl-8";
      case 2:
        return "pl-10 sm:pl-12";
      case 3:
        return "pl-14 sm:pl-16";
      default:
        return "pl-18 sm:pl-20";
    }
  };

  const getFontWeight = (level: number): string => {
    if (level === 0) return "font-bold";
    if (level === 1) return "font-semibold";
    if (level === 2) return "font-medium";
    return "font-normal";
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

  const handleEdit = (item: FinancialBreakdownItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = (item: FinancialBreakdownItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleSave = (formData: Omit<FinancialBreakdownItem, "id" | "children">) => {
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
            Financial Breakdown
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              title="Print"
            >
              <div className="flex items-center gap-2">
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
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md text-white"
                style={{ backgroundColor: accentColorValue }}
              >
                Add New Item
              </button>
            )}
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print-only p-4 border-b border-zinc-900">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Financial Breakdown</h2>
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

        <div className="overflow-x-auto">
          <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              {(onEdit || onDelete) && (
                <th className="px-4 sm:px-6 py-4 text-center no-print">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    Actions
                  </span>
                </th>
              )}
              <th className="px-4 sm:px-6 py-4 text-left min-w-[400px]">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Programs, Projects, & Activities Description
                </span>
              </th>
              <th className="px-4 sm:px-6 py-4 text-right min-w-[150px]">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Appropriation
                </span>
              </th>
              <th className="px-4 sm:px-6 py-4 text-right min-w-[150px]">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Obligation
                </span>
              </th>
              <th className="px-4 sm:px-6 py-4 text-right min-w-[150px]">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Balance of Appropriation
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {flattenedItems.length > 0 ? (
              <>
                {flattenedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    {(onEdit || onDelete) && (
                      <td
                        className="px-4 sm:px-6 py-3 text-center no-print"
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
                    <td
                      className={`px-4 sm:px-6 py-3 ${getPaddingLeft(
                        item.level
                      )}`}
                    >
                      <div className="flex items-start gap-2">
                        {item.code && (
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 shrink-0">
                            {item.code}
                          </span>
                        )}
                        <span
                          className={`text-sm ${getFontWeight(
                            item.level
                          )} text-zinc-900 dark:text-zinc-100 ${
                            item.level === 0 ? "uppercase" : ""
                          }`}
                        >
                          {item.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <span
                        className={`text-sm ${getFontWeight(
                          item.level
                        )} text-zinc-900 dark:text-zinc-100`}
                      >
                        {item.appropriation > 0
                          ? formatCurrency(item.appropriation)
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <span
                        className={`text-sm ${getFontWeight(
                          item.level
                        )} text-zinc-900 dark:text-zinc-100`}
                      >
                        {item.obligation > 0
                          ? formatCurrency(item.obligation)
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <span
                        className={`text-sm ${getFontWeight(
                          item.level
                        )} text-zinc-900 dark:text-zinc-100`}
                      >
                          {item.balance > 0 ? formatCurrency(item.balance) : "-"}
                        </span>
                      </td>
                    </tr>
                ))}
                {/* Totals Row */}
                <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 font-bold">
                  {(onEdit || onDelete) && <td className="no-print"></td>}
                  <td className="px-4 sm:px-6 py-4">
                    <span className="text-sm text-zinc-900 dark:text-zinc-100 uppercase">
                      Total
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <span
                      className="text-sm"
                      style={{ color: accentColorValue }}
                    >
                      {formatCurrency(totals.appropriation)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <span
                      className="text-sm"
                      style={{ color: accentColorValue }}
                    >
                      {formatCurrency(totals.obligation)}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                      ({formatPercentage(obligationPercentage)})
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <span
                      className="text-sm"
                      style={{ color: accentColorValue }}
                    >
                      {formatCurrency(totals.balance)}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                              ({formatPercentage(balancePercentage)})
                            </span>
                          </td>
                        </tr>
              </>
            ) : (
              <tr>
                <td
                  colSpan={onEdit || onDelete ? 4 : 4}
                  className="px-4 sm:px-6 py-12 text-center"
                >
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No financial breakdown data available.
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
          title="Add Financial Breakdown Item"
          size="lg"
        >
          <FinancialBreakdownItemForm
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
          title="Edit Financial Breakdown Item"
          size="lg"
        >
          <FinancialBreakdownItemForm
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
          title="Delete Financial Breakdown Item"
          message={`Are you sure you want to delete "${selectedItem.description}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </>
  );
}
