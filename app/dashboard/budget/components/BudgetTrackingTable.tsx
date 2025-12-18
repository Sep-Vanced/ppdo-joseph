// app/dashboard/budget/components/BudgetTrackingTable.tsx

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BudgetItem, SortDirection, SortField } from "../types";
import { useAccentColor } from "../../contexts/AccentColorContext";
import { Modal } from "./Modal";
import { ConfirmationModal } from "./ConfirmationModal";
import { BudgetItemForm } from "./BudgetItemForm";
import BudgetShareModal from "./BudgetShareModal";
import { 
  Share2, 
  Search, 
  ArrowUpDown, 
  ArrowUpAZ, 
  ArrowDownAZ,
  ArrowUp,
  ArrowDown,
  Pin,
  PinOff,
  Edit,
  Trash2,
  Filter,
  X
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface BudgetTrackingTableProps {
  budgetItems: BudgetItem[];
  // UPDATE THESE TWO LINES:
  onAdd?: (item: Omit<BudgetItem, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOnTrack">) => void;
  onEdit?: (id: string, item: Omit<BudgetItem, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOnTrack">) => void;
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
  const accessCheck = useQuery(api.budgetAccess.canAccess);
  const pendingRequestsCount = useQuery(api.accessRequests.getPendingCount);
  const pinBudgetItem = useMutation(api.budgetItems.pin);
  const unpinBudgetItem = useMutation(api.budgetItems.unpin);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: BudgetItem;
  } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<number[]>([]);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    accessCheck?.user?.role === "admin" ||
    accessCheck?.user?.role === "super_admin";

  useEffect(() => {
    const checkDraft = () => {
      try {
        const saved = localStorage.getItem("budget_item_form_draft");
        setHasDraft(!!saved);
      } catch (error) {
        setHasDraft(false);
      }
    };

    checkDraft();
    const interval = setInterval(checkDraft, 1000);
    return () => clearInterval(interval);
  }, [showAddModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setActiveFilterColumn(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setContextMenu(null);
      setActiveFilterColumn(null);
    };

    document.addEventListener("scroll", handleScroll, true);
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    budgetItems.forEach(item => {
      if (item.status) statuses.add(item.status);
    });
    return Array.from(statuses).sort();
  }, [budgetItems]);

  const uniqueYears = useMemo(() => {
    const years = new Set<number>();
    budgetItems.forEach(item => {
      if (item.year) years.add(item.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [budgetItems]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...budgetItems];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          item.particular.toLowerCase().includes(query) ||
          item.year?.toString().includes(query) ||
          item.status?.toLowerCase().includes(query) ||
          item.totalBudgetAllocated.toString().includes(query) ||
          (item.obligatedBudget?.toString() || "").includes(query) ||
          item.totalBudgetUtilized.toString().includes(query) ||
          item.utilizationRate.toFixed(1).includes(query) ||
          item.projectCompleted.toFixed(1).includes(query) ||
          item.projectDelayed.toFixed(1).includes(query) ||
          item.projectsOnTrack.toFixed(1).includes(query)
        );
      });
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter(item => item.status && statusFilter.includes(item.status));
    }

    if (yearFilter.length > 0) {
      filtered = filtered.filter(item => item.year && yearFilter.includes(item.year));
    }

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc" 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [budgetItems, searchQuery, statusFilter, yearFilter, sortField, sortDirection]);

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

  const getStatusColor = (status?: "done" | "pending" | "ongoing"): string => {
    if (!status) return "text-zinc-600 dark:text-zinc-400";
    if (status === "done") return "text-green-600 dark:text-green-400";
    if (status === "ongoing") return "text-blue-600 dark:text-blue-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const handleRowClick = (item: BudgetItem, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    router.push(`/dashboard/budget/${encodeURIComponent(item.particular)}`);
  };

  const handleContextMenu = (e: React.MouseEvent, item: BudgetItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const handleEdit = (item: BudgetItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
    setContextMenu(null);
  };

  const handleDelete = (item: BudgetItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
    setContextMenu(null);
  };

  const handlePin = async (item: BudgetItem) => {
    try {
      if (item.isPinned) {
        await unpinBudgetItem({ id: item.id as Id<"budgetItems"> });
        toast.success("Budget item unpinned");
      } else {
        await pinBudgetItem({ id: item.id as Id<"budgetItems"> });
        toast.success("Budget item pinned to top");
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to pin/unpin item");
    }
    setContextMenu(null);
  };

  const handleSave = (formData: Omit<BudgetItem, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOnTrack">) => {
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleYearFilter = (year: number) => {
    setYearFilter(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setYearFilter([]);
    setSortField(null);
    setSortDirection(null);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      clearAllFilters();
    }
  };

  const hasActiveFilters = searchQuery || statusFilter.length > 0 || yearFilter.length > 0 || sortField;

  const handlePrint = () => {
    window.print();
  };

  const totals = filteredAndSortedItems.reduce(
    (acc, item) => ({
      totalBudgetAllocated: acc.totalBudgetAllocated + item.totalBudgetAllocated,
      obligatedBudget: acc.obligatedBudget + (item.obligatedBudget || 0),
      totalBudgetUtilized: acc.totalBudgetUtilized + item.totalBudgetUtilized,
      projectCompleted: acc.projectCompleted + item.projectCompleted,
      projectDelayed: acc.projectDelayed + item.projectDelayed,
      projectsOnTrack: acc.projectsOnTrack + item.projectsOnTrack,
    }),
    {
      totalBudgetAllocated: 0,
      obligatedBudget: 0,
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUp className="w-3.5 h-3.5" />;
    return <ArrowDown className="w-3.5 h-3.5" />;
  };

  return (
    <>
      <div className="print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4 no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Budget Items
            </h3>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  title="Share & Manage Access"
                >
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </div>
                  {pendingRequestsCount !== undefined && pendingRequestsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                    </span>
                  )}
                </button>
              )}
              {expandButton}
              <button
                onClick={toggleSearch}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md ${
                  isSearchVisible 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500' 
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                }`}
                title={isSearchVisible ? "Hide Search" : "Show Search"}
              >
                <div className="cursor-pointer flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </div>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                title="Print"
              >
                <div className="cursor-pointer flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
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

          {isSearchVisible && (
            <div className="space-y-4 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by particular, year, status, or any value..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{ 
                      '--tw-ring-color': accentColorValue,
                    } as React.CSSProperties}
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>

              {(statusFilter.length > 0 || yearFilter.length > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Active filters:</span>
                  {statusFilter.map(status => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      Status: {status}
                      <button
                        onClick={() => toggleStatusFilter(status)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {yearFilter.map(year => (
                    <span
                      key={year}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    >
                      Year: {year}
                      <button
                        onClick={() => toggleYearFilter(year)}
                        className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <th className="px-4 sm:px-6 py-4 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("particular")}
                    className="group flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Particulars
                    </span>
                    <SortIcon field="particular" />
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-4 text-center sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setActiveFilterColumn(activeFilterColumn === "year" ? null : "year")}
                      className="group flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                        Year
                      </span>
                      <Filter className={`w-3.5 h-3.5 ${yearFilter.length > 0 ? 'text-blue-600' : 'opacity-50'}`} />
                    </button>
                    
                    {activeFilterColumn === "year" && (
                      <div
                        ref={filterMenuRef}
                        className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-50 min-w-[150px]"
                      >
                        <div className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 mb-1">
                          Filter by Year
                        </div>
                        {uniqueYears.length > 0 ? (
                          uniqueYears.map(year => (
                            <button
                              key={year}
                              onClick={() => toggleYearFilter(year)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between ${
                                yearFilter.includes(year) ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {year}
                              {yearFilter.includes(year) && (
                                <span className="text-blue-600 dark:text-blue-400">✓</span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                            No years available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 sm:px-6 py-4 text-center sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setActiveFilterColumn(activeFilterColumn === "status" ? null : "status")}
                      className="group flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                        Status
                      </span>
                      <Filter className={`w-3.5 h-3.5 ${statusFilter.length > 0 ? 'text-blue-600' : 'opacity-50'}`} />
                    </button>
                    
                    {activeFilterColumn === "status" && (
                      <div
                        ref={filterMenuRef}
                        className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-50 min-w-[150px]"
                      >
                        <div className="px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 mb-1">
                          Filter by Status
                        </div>
                        {uniqueStatuses.length > 0 ? (
                          uniqueStatuses.map(status => (
                            <button
                              key={status}
                              onClick={() => toggleStatusFilter(status)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between ${
                                statusFilter.includes(status) ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                              {statusFilter.includes(status) && (
                                <span className="text-blue-600 dark:text-blue-400">✓</span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                            No statuses available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("totalBudgetAllocated")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Budget Allocated
                    </span>
                    <SortIcon field="totalBudgetAllocated" />
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("obligatedBudget")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Obligated Budget
                    </span>
                    <SortIcon field="obligatedBudget" />
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("totalBudgetUtilized")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Budget Utilized
                    </span>
                    <SortIcon field="totalBudgetUtilized" />
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("utilizationRate")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Utilization Rate
                    </span>
                    <SortIcon field="utilizationRate" />
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("projectCompleted")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Completed
                    </span>
                    <SortIcon field="projectCompleted" />
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("projectDelayed")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Delayed
                    </span>
                    <SortIcon field="projectDelayed" />
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-4 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("projectsOnTrack")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Ongoing
                    </span>
                    <SortIcon field="projectsOnTrack" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        No results found
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredAndSortedItems.map((item) => (
                    <tr
                      key={item.id}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      onClick={(e) => handleRowClick(item, e)}
                      className={`
                        border-b border-zinc-200 dark:border-zinc-800 
                        hover:bg-zinc-50 dark:hover:bg-zinc-800/50 
                        transition-colors cursor-pointer
                        ${item.isPinned ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                      `}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {item.particular}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {item.year || "-"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "-"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          ₱{item.totalBudgetAllocated.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.obligatedBudget ? `₱${item.obligatedBudget.toLocaleString()}` : "-"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          ₱{item.totalBudgetUtilized.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className={`text-sm font-semibold ${getUtilizationColor(item.utilizationRate)}`}>
                          {item.utilizationRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
  <span className={`text-sm font-medium ${getProjectStatusColor(item.projectCompleted)}`}>
    {Math.round(item.projectCompleted)} {/* Changed: removed .toFixed(1) and % */}
  </span>
</td>
<td className="px-4 sm:px-6 py-4 text-right">
  <span className={`text-sm font-medium ${getProjectStatusColor(item.projectDelayed)}`}>
    {Math.round(item.projectDelayed)} {/* Changed: removed .toFixed(1) and % */}
  </span>
</td>
<td className="px-4 sm:px-6 py-4 text-right">
  <span className={`text-sm font-medium ${getProjectStatusColor(item.projectsOnTrack)}`}>
    {Math.round(item.projectsOnTrack)} {/* Changed: removed .toFixed(1) and % */}
  </span>
</td>

                    </tr>
                  ))}
                <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 font-semibold">
  <td className="px-4 sm:px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
    TOTAL
  </td>

  <td className="px-4 sm:px-6 py-4"></td>
  <td className="px-4 sm:px-6 py-4"></td>

  <td className="px-4 sm:px-6 py-4 text-right text-sm text-zinc-900 dark:text-zinc-100">
    ₱{totals.totalBudgetAllocated.toLocaleString()}
  </td>

  <td className="px-4 sm:px-6 py-4 text-right text-sm text-zinc-900 dark:text-zinc-100">
    ₱{totals.obligatedBudget.toLocaleString()}
  </td>

  <td className="px-4 sm:px-6 py-4 text-right text-sm text-zinc-900 dark:text-zinc-100">
    ₱{totals.totalBudgetUtilized.toLocaleString()}
  </td>

  <td className="px-4 sm:px-6 py-4 text-right">
    <span
      className={`text-sm font-semibold ${getUtilizationColor(
        totalUtilizationRate
      )}`}
    >
      {totalUtilizationRate.toFixed(1)}%
    </span>
  </td>
<td className="px-4 sm:px-6 py-4 text-right text-sm text-zinc-900 dark:text-zinc-100">
  {Math.round(totals.projectCompleted)}
</td>
<td className="px-4 sm:px-6 py-4 text-right text-sm text-zinc-900 dark:text-zinc-100">
  {Math.round(totals.projectDelayed)}
</td>
<td className="px-4 sm:px-6 py-4 text-right text-sm text-zinc-900 dark:text-zinc-100">
  {Math.round(totals.projectsOnTrack)}
</td>
</tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-50 min-w-[180px]"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <button
            onClick={() => handlePin(contextMenu.item)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-3"
          >
            {contextMenu.item.isPinned ? (
              <><PinOff className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /><span className="text-zinc-700 dark:text-zinc-300">Unpin</span></>
            ) : (
              <><Pin className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /><span className="text-zinc-700 dark:text-zinc-300">Pin to top</span></>
            )}
          </button>
          {onEdit && (
            <button
              onClick={() => handleEdit(contextMenu.item)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-3"
            >
              <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-zinc-700 dark:text-zinc-300">Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => handleDelete(contextMenu.item)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">Delete</span>
            </button>
          )}
        </div>
      )}

      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedItem(null);
          }}
          title="Add Budget Item"
          size="xl"
        >
          <BudgetItemForm
            onSave={handleSave}
            onCancel={() => {
              setShowAddModal(false);
              setSelectedItem(null);
            }}
          />
        </Modal>
      )}

      {showEditModal && selectedItem && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          title="Edit Budget Item"
          size="xl"
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
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {showShareModal && (
        <BudgetShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}