// app/dashboard/project/budget/[particularId]/components/ProjectsTable.tsx

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Project } from "../../../../../../types/types";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { ProjectForm } from "./ProjectForm";
import { motion } from "framer-motion";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pin,
  PinOff,
  Edit,
  Trash2,
  Filter,
  X,
  History,
  FolderOpen,
  Printer,
  Layers,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LayoutTemplate
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { ActivityLogSheet } from "@/components/ActivityLogSheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ProjectCategoryCombobox } from "./ProjectCategoryCombobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Shadcn Navigation Menu Imports
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

// Shadcn Dropdown Imports
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/budget/ConfirmationModal";
import { Modal } from "@/components/budget/Modal";

interface ProjectsTableProps {
  projects: Project[];
  particularId: string;
  budgetItemId?: string;
  onAdd?: (project: Omit<Project, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing">) => void | Promise<void>;
  onEdit?: (id: string, project: Omit<Project, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing">) => void;
  onDelete?: (id: string) => void;
  onOpenTrash?: () => void;
  newlyAddedProjectId?: string | null;
}

type SortDirection = "asc" | "desc" | null;
type SortField = keyof Project | null;

const AVAILABLE_COLUMNS = [
  { id: "particulars", label: "Particulars" },
  { id: "implementingOffice", label: "Implementing Office" },
  { id: "year", label: "Year" },
  { id: "status", label: "Status" },
  { id: "totalBudgetAllocated", label: "Budget Allocated" },
  { id: "obligatedBudget", label: "Obligated Budget" },
  { id: "totalBudgetUtilized", label: "Budget Utilized" },
  { id: "utilizationRate", label: "Utilization Rate" },
  { id: "projectCompleted", label: "Completed" },
  { id: "projectDelayed", label: "Delayed" },
  { id: "projectsOngoing", label: "Ongoing" },
  { id: "remarks", label: "Remarks" },
];

export function ProjectsTable({
  projects,
  particularId,
  budgetItemId,
  onAdd,
  onEdit,
  onDelete,
  onOpenTrash,
  newlyAddedProjectId,
}: ProjectsTableProps) {
  const { accentColorValue } = useAccentColor();
  const router = useRouter();
  const newProjectRowRef = useRef<HTMLTableRowElement>(null);
  
  const currentUser = useQuery(api.users.current);
  const togglePinProject = useMutation(api.projects.togglePin);
  const allCategories = useQuery(api.projectCategories.list, {});
  
  const bulkMoveToTrash = useMutation(api.projects.bulkMoveToTrash);
  const bulkUpdateCategory = useMutation(api.projects.bulkUpdateCategory);
  const updateProject = useMutation(api.projects.update);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkCategoryConfirmModal, setShowBulkCategoryConfirmModal] = useState(false);
  const [pendingBulkCategoryId, setPendingBulkCategoryId] = useState<Id<"projectCategories"> | undefined>(undefined);
  const [showSingleCategoryModal, setShowSingleCategoryModal] = useState(false);
  const [selectedCategoryProject, setSelectedCategoryProject] = useState<Project | null>(null);
  const [singleCategoryId, setSingleCategoryId] = useState<Id<"projectCategories"> | undefined>(undefined);
  const [showSearchWarningModal, setShowSearchWarningModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [showHideAllWarning, setShowHideAllWarning] = useState(false);

  // Data States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [officeFilter, setOfficeFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<number[]>([]);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  
  // UI States
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [selectedLogProject, setSelectedLogProject] = useState<Project | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const canManageBulkActions = useMemo(() => {
    return currentUser?.role === "admin" || currentUser?.role === "super_admin";
  }, [currentUser]);

  const getCategoryHeaderStyle = (category?: any) => {
    if (category?.colorCode) {
      return { backgroundColor: category.colorCode, color: "white" };
    }
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
    const id = category?._id || "uncategorized";
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const bg = id === "uncategorized" ? "#71717a" : colors[Math.abs(hash) % colors.length];
    return { backgroundColor: bg, color: "white" };
  };

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

  // Auto-scroll to newly added project
  useEffect(() => {
    if (newlyAddedProjectId && newProjectRowRef.current) {
      setTimeout(() => {
        newProjectRowRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [newlyAddedProjectId]);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => {
        return (
          project.particulars.toLowerCase().includes(query) ||
          project.implementingOffice.toLowerCase().includes(query) ||
          project.status?.toLowerCase().includes(query)
        );
      });
    }
    
    if (statusFilter.length > 0) filtered = filtered.filter(p => p.status && statusFilter.includes(p.status));
    if (officeFilter.length > 0) filtered = filtered.filter(p => officeFilter.includes(p.implementingOffice));
    if (yearFilter.length > 0) filtered = filtered.filter(p => p.year && yearFilter.includes(p.year));

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return filtered.sort((a, b) => {
      const aIsPinned = 'isPinned' in a ? (a as any).isPinned : false;
      const bIsPinned = 'isPinned' in b ? (b as any).isPinned : false;
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    });
  }, [projects, searchQuery, statusFilter, officeFilter, yearFilter, sortField, sortDirection]);

  const groupedProjects = useMemo(() => {
    const groups: Record<string, { category: any, projects: Project[] }> = {};
    groups["uncategorized"] = { category: null, projects: [] };

    filteredAndSortedProjects.forEach(project => {
      if (project.categoryId) {
        if (!groups[project.categoryId]) {
          const cat = allCategories?.find(c => c._id === project.categoryId);
          groups[project.categoryId] = { category: cat, projects: [] };
        }
        groups[project.categoryId].projects.push(project);
      } else {
        groups["uncategorized"].projects.push(project);
      }
    });

    return Object.entries(groups)
      .filter(([_, group]) => group.projects.length > 0)
      .sort((a, b) => {
        if (a[0] === "uncategorized") return 1;
        if (b[0] === "uncategorized") return -1;
        const orderA = a[1].category?.displayOrder || 999;
        const orderB = b[1].category?.displayOrder || 999;
        return orderA - orderB;
      });
  }, [filteredAndSortedProjects, allCategories]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedProjects.map(p => p.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectCategory = (categoryProjects: Project[], checked: boolean) => {
    const newSelected = new Set(selectedIds);
    categoryProjects.forEach(p => {
        if (checked) {
            newSelected.add(p.id);
        } else {
            newSelected.delete(p.id);
        }
    });
    setSelectedIds(newSelected);
  };

  const isAllSelected = filteredAndSortedProjects.length > 0 && selectedIds.size === filteredAndSortedProjects.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredAndSortedProjects.length;

  // ✅ UPDATED: Bulk Move to Trash with detailed response handling
  const handleBulkTrash = async () => {
    try {
      const response: any = await bulkMoveToTrash({ ids: Array.from(selectedIds) as Id<"projects">[] });
      
      if (response.success) {
        // Detailed feedback based on new backend response structure
        const details = response.data?.details || {};
        const successCount = response.data?.processed || 0;
        const failedCount = response.data?.failed || 0;
        
        toast.success(response.message || "Bulk operation completed", {
            description: `Successfully moved: ${successCount}. Failed: ${failedCount}.`,
        });
        setSelectedIds(new Set());
      } else {
        toast.error(response.error?.message || "Failed to move projects to trash");
      }
    } catch (error) {
      toast.error("An unexpected error occurred during bulk delete");
    }
  };

  const handleBulkCategoryChange = (categoryId: Id<"projectCategories"> | undefined) => {
    if (!categoryId) return;
    setPendingBulkCategoryId(categoryId);
    setShowBulkCategoryConfirmModal(true);
  };

  // ✅ UPDATED: Bulk Category Update with detailed response handling
  const confirmBulkCategoryUpdate = async () => {
    if (!pendingBulkCategoryId) return;
    try {
      const response: any = await bulkUpdateCategory({
        ids: Array.from(selectedIds) as Id<"projects">[],
        categoryId: pendingBulkCategoryId
      });

      if (response.success) {
        const successCount = response.data?.processed || 0;
        toast.success(response.message || "Category updated successfully", {
            description: `Updated ${successCount} projects.`,
        });
        setSelectedIds(new Set());
        setPendingBulkCategoryId(undefined);
        setShowBulkCategoryConfirmModal(false);
      } else {
        toast.error(response.error?.message || "Failed to update categories.");
        setShowBulkCategoryConfirmModal(false);
      }
    } catch (error) {
      toast.error("Failed to update categories.");
      setShowBulkCategoryConfirmModal(false);
    }
  };

  const handleSearchFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (selectedIds.size > 0) {
        e.target.blur();
        setShowSearchWarningModal(true);
    }
  };

  const handleConfirmSearchClear = () => {
    setSelectedIds(new Set());
    setShowSearchWarningModal(false);
    setTimeout(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, 50);
  };

  const handleToggleColumn = (columnId: string, isChecked: boolean) => {
    const newHidden = new Set(hiddenColumns);
    if (isChecked) {
      newHidden.delete(columnId);
    } else {
      newHidden.add(columnId);
    }
    setHiddenColumns(newHidden);
  };

  const handleHideAllColumns = () => {
    setShowHideAllWarning(true);
  };

  const confirmHideAll = () => {
    const allColIds = AVAILABLE_COLUMNS.map(c => c.id);
    setHiddenColumns(new Set(allColIds));
    setShowHideAllWarning(false);
  };

  const handleShowAllColumns = () => {
    setHiddenColumns(new Set());
  };

  const handleExportCSV = () => {
    const visibleCols = AVAILABLE_COLUMNS.filter(col => !hiddenColumns.has(col.id));
    if (visibleCols.length === 0) {
      toast.error("No columns are visible to export.");
      return;
    }
    const headers = visibleCols.map(c => c.label).join(",");
    const rows = filteredAndSortedProjects.map(project => {
      return visibleCols.map(col => {
        let val = (project as any)[col.id];
        if (val === undefined || val === null) return "";
        if (col.id === "utilizationRate") return (val as number).toFixed(2);
        if (typeof val === "string") {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",");
    });
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleContextChangeCategory = (project: Project) => {
    setSelectedCategoryProject(project);
    setSingleCategoryId(project.categoryId as Id<"projectCategories"> | undefined);
    setShowSingleCategoryModal(true);
    setContextMenu(null);
  };

  // ✅ UPDATED: Single Category Update via Context Menu
  const saveSingleCategoryChange = async () => {
    if (!selectedCategoryProject) return;
    try {
        const response: any = await updateProject({
            id: selectedCategoryProject.id as Id<"projects">,
            categoryId: singleCategoryId,
            particulars: selectedCategoryProject.particulars,
            implementingOffice: selectedCategoryProject.implementingOffice,
            totalBudgetAllocated: selectedCategoryProject.totalBudgetAllocated,
            totalBudgetUtilized: selectedCategoryProject.totalBudgetUtilized,
            budgetItemId: selectedCategoryProject.budgetItemId as Id<"budgetItems">,
            remarks: selectedCategoryProject.remarks,
            year: selectedCategoryProject.year,
            projectManagerId: selectedCategoryProject.projectManagerId as Id<"users">,
            reason: "Category updated via context menu"
        });

        if (response.success) {
            toast.success(response.message || "Category updated");
            setShowSingleCategoryModal(false);
            setSelectedCategoryProject(null);
        } else {
            toast.error(response.error?.message || "Failed to update category");
        }
    } catch (error) {
        toast.error("An unexpected error occurred");
    }
  };

  const handleRowClick = (project: Project, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[role='checkbox']") || (e.target as HTMLElement).closest(".no-click")) return;
    const projectSlug = `${project.particulars.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${project.id}`;
    router.push(`/dashboard/project/budget/${encodeURIComponent(particularId)}/${projectSlug}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") setSortField(null);
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 }).format(amount);
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };
  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return "text-red-600 dark:text-red-400";
    if (rate >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };
  const getStatusColor = (status?: string) => {
    if (!status) return "text-zinc-600 dark:text-zinc-400";
    if (status === "completed") return "text-green-600 dark:text-green-400";
    if (status === "ongoing") return "text-blue-600 dark:text-blue-400";
    if (status === "delayed") return "text-red-600 dark:text-red-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  const totals = filteredAndSortedProjects.reduce(
    (acc, project) => ({
      totalBudgetAllocated: acc.totalBudgetAllocated + project.totalBudgetAllocated,
      obligatedBudget: acc.obligatedBudget + (project.obligatedBudget || 0),
      totalBudgetUtilized: acc.totalBudgetUtilized + project.totalBudgetUtilized,
      utilizationRate: acc.utilizationRate + project.utilizationRate / (filteredAndSortedProjects.length || 1),
      projectCompleted: acc.projectCompleted + project.projectCompleted,
      projectDelayed: acc.projectDelayed + (project.projectDelayed || 0),
      projectsOngoing: acc.projectsOngoing + project.projectsOngoing,
    }),
    { totalBudgetAllocated: 0, obligatedBudget: 0, totalBudgetUtilized: 0, 
      utilizationRate: 0, projectCompleted: 0, projectDelayed: 0, projectsOngoing: 0 }
  );

  const countVisibleLabelColumns = () => {
    const labels = ["particulars", "implementingOffice", "year", "status"];
    return labels.filter(id => !hiddenColumns.has(id)).length;
  };

  const visibleLabelColSpan = countVisibleLabelColumns();

  return (
    <>
      <div className="print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-visible transition-all duration-300 shadow-sm">
        
        {/* TOOLBAR */}
        <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between no-print gap-4">
          
          <div className="flex items-center gap-3 min-w-[200px]">
            {selectedIds.size > 0 ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 h-7">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        {selectedIds.size} Selected
                    </Badge>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedIds(new Set())}
                        className="text-zinc-500 text-xs h-7 hover:text-zinc-900"
                    >
                        Clear
                    </Button>
                </div>
            ) : (
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Projects</h3>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                ref={searchInputRef}
                onFocus={handleSearchFocus}
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-9 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutTemplate className="w-4 h-4" />
                  Columns 
                  {hiddenColumns.size > 0 && (
                    <span className="ml-0.5 text-xs text-zinc-500">
                       ({hiddenColumns.size} hidden)
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    {AVAILABLE_COLUMNS.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={!hiddenColumns.has(column.id)}
                        onCheckedChange={(checked) => handleToggleColumn(column.id, checked)}
                    >
                        {column.label}
                    </DropdownMenuCheckboxItem>
                    ))}
                </div>
                <DropdownMenuSeparator />
                <div className="p-2 flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleShowAllColumns}
                        className="w-full h-7 text-xs"
                        disabled={hiddenColumns.size === 0}
                    >
                        Show All
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleHideAllColumns}
                        className="w-full h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={hiddenColumns.size === AVAILABLE_COLUMNS.length}
                    >
                        Hide All
                    </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedIds.size > 0 && canManageBulkActions && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 data-[state=open]:bg-blue-100 border border-blue-200 dark:border-blue-800">
                      <Layers className="w-4 h-4 mr-2" />
                      Category
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[300px] p-4 gap-4 flex flex-col bg-white dark:bg-zinc-950">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">
                            Selected Projects by Category
                          </h4>
                          <div className="space-y-2 text-xs">
                            {(() => {
                              const categoryCounts = new Map<string, { name: string; color?: string; count: number }>();
                              
                              Array.from(selectedIds).forEach(id => {
                                const project = projects.find(p => p.id === id);
                                if (project) {
                                  const catId = project.categoryId || "uncategorized";
                                  const existing = categoryCounts.get(catId);
                                  
                                  if (existing) {
                                    existing.count++;
                                  } else {
                                    const cat = allCategories?.find(c => c._id === catId);
                                    categoryCounts.set(catId, {
                                      name: cat?.fullName || "Uncategorized",
                                      color: cat?.colorCode,
                                      count: 1
                                    });
                                  }
                                }
                              });
                              
                              return Array.from(categoryCounts.entries()).map(([key, data]) => (
                                <div key={key} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                  {data.color && (
                                    <div 
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: data.color }}
                                    />
                                  )}
                                  <span>{data.count} selected in "{data.name}"</span>
                                </div>
                              ));
                            })()}
                          </div>
                          
                          <Separator className="my-2" />
                          
                          <p className="text-xs text-zinc-500">Select a new category to move all selected projects:</p>
                          <div className="no-click relative z-50"> 
                            <ProjectCategoryCombobox 
                              value={undefined}
                              onChange={(val) => handleBulkCategoryChange(val as Id<"projectCategories">)}
                              hideInfoText={true}
                            />
                          </div>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button 
              onClick={selectedIds.size > 0 ? handleBulkTrash : onOpenTrash}
              variant={selectedIds.size > 0 ? "destructive" : "outline"}
              size="sm"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {selectedIds.size > 0 ? `To Trash (${selectedIds.size})` : 'Recycle Bin'}
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export / Print
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer">
                        <Printer className="w-4 h-4 mr-2" /> Print PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                        <span className="text-[10px] text-zinc-500 leading-tight block">
                            Note: Exports and prints are based on the currently shown/hidden columns.
                        </span>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {onAdd && (
              <Button 
                onClick={() => setShowAddModal(true)} 
                size="sm"
                className="gap-2 text-white shadow-sm"
                style={{ backgroundColor: accentColorValue }}
              >
                <span className="text-lg leading-none mb-0.5">+</span> 
                Add Project
              </Button>
            )}
          </div>
        </div>
        
        {/* TABLE */}
        <div className="overflow-x-auto max-h-[600px] relative">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                {canManageBulkActions && (
                    <th className="w-10 px-3 py-3 text-center sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-20">
                        <Checkbox 
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                            className={isIndeterminate ? "opacity-50" : ""}
                        />
                    </th>
                )}
                
                {!hiddenColumns.has('particulars') && (
                    <th className="px-3 py-3 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                        <button onClick={() => handleSort("particulars")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Particulars <SortIcon field="particulars" /></button>
                    </th>
                )}
                {!hiddenColumns.has('implementingOffice') && (
                    <th className="px-3 py-3 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                        <button onClick={() => setActiveFilterColumn(activeFilterColumn === "office" ? null : "office")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Implementing Office <Filter className="w-3.5 h-3.5 opacity-50" /></button>
                    </th>
                )}
                {!hiddenColumns.has('year') && (
                    <th className="px-3 py-3 text-center sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                        <button onClick={() => setActiveFilterColumn(activeFilterColumn === "year" ? null : "year")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Year <Filter className="w-3.5 h-3.5 opacity-50" /></button>
                    </th>
                )}
                {!hiddenColumns.has('status') && (
                    <th className="px-3 py-3 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                        <button onClick={() => setActiveFilterColumn(activeFilterColumn === "status" ? null : "status")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Status <Filter className="w-3.5 h-3.5 opacity-50" /></button>
                    </th>
                )}
                {!hiddenColumns.has('totalBudgetAllocated') && (
                    <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("totalBudgetAllocated")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Budget Allocated <SortIcon field="totalBudgetAllocated" /></button></th>
                )}
                {!hiddenColumns.has('obligatedBudget') && (
                    <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("obligatedBudget")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Obligated Budget <SortIcon field="obligatedBudget" /></button></th>
                )}
                {!hiddenColumns.has('totalBudgetUtilized') && (
                    <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("totalBudgetUtilized")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Budget Utilized <SortIcon field="totalBudgetUtilized" /></button></th>
                )}
                {!hiddenColumns.has('utilizationRate') && (
                    <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("utilizationRate")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Utilization Rate (%) <SortIcon field="utilizationRate" /></button></th>
                )}
                {!hiddenColumns.has('projectCompleted') && (
                    <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("projectCompleted")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Completed <SortIcon field="projectCompleted" /></button></th>
                )}
                {!hiddenColumns.has('projectDelayed') && (
                    <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("projectDelayed")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Delayed <SortIcon field="projectDelayed" /></button></th>
                )}
                {!hiddenColumns.has('projectsOngoing') && (
                    <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("projectsOngoing")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Ongoing <SortIcon field="projectsOngoing" /></button></th>
                )}
                {!hiddenColumns.has('remarks') && (
                  <th className="px-3 py-3 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10 text-xs font-semibold uppercase tracking-wide">Remarks</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredAndSortedProjects.length === 0 ?
                (
                <tr><td colSpan={canManageBulkActions ? (12 + 1 - hiddenColumns.size) : (12 - hiddenColumns.size)} className="px-4 py-12 text-center text-sm text-zinc-500">No projects found matching your criteria.</td></tr>
              ) : (
                <>
                   {groupedProjects.map(([key, group]) => {
                    const categoryIds = group.projects.map(p => p.id);
                    const selectedCountInCat = categoryIds.filter(id => selectedIds.has(id)).length;
                    const isCatAllSelected = categoryIds.length > 0 && selectedCountInCat === categoryIds.length;
                    const isCatIndeterminate = selectedCountInCat > 0 && selectedCountInCat < categoryIds.length;
                    const totalVisibleColumns = 12 - hiddenColumns.size;

                    return (
                        <React.Fragment key={key}>
                            {/* Category Header Row */}
                            <tr className="bg-zinc-50 dark:bg-zinc-900 border-t-2 border-zinc-100 dark:border-zinc-800">
                              {canManageBulkActions && (
                                <td 
                                  className="px-3 py-2 text-center"
                                  style={getCategoryHeaderStyle(group.category)}
                                >
                                  <div className="flex justify-center items-center">
                                    <Checkbox 
                                      checked={isCatAllSelected}
                                      onCheckedChange={(checked) => handleSelectCategory(group.projects, checked as boolean)}
                                      className={cn(
                                        "border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black", 
                                        isCatIndeterminate ? "opacity-70" : ""
                                      )}
                                    />
                                  </div>
                                </td>
                              )}
                              
                              <td 
                                colSpan={totalVisibleColumns} 
                                className="px-4 py-2 text-sm font-bold uppercase tracking-wider"
                                style={getCategoryHeaderStyle(group.category)}
                              >
                                  {group.category ? group.category.fullName : "Uncategorized"} 
                                  <span className="opacity-80 ml-2 font-normal normal-case">
                                    ({group.projects.length} project)
                                  </span>
                              </td>
                            </tr>

                            {group.projects.map((project) => {
                              const isNewProject = project.id === newlyAddedProjectId;
                              return (
                                <motion.tr
                                key={project.id}
                                ref={isNewProject ? newProjectRowRef : undefined}
                                initial={isNewProject ? { 
                                  boxShadow: `0 0 0 3px ${accentColorValue}`,
                                  scale: 1.01 
                                } : false}
                                animate={isNewProject ? {
                                  boxShadow: [
                                    `0 0 0 3px ${accentColorValue}`,
                                    `0 0 0 0px ${accentColorValue}00`,
                                  ],
                                  scale: [1.01, 1]
                                } : {}}
                                transition={isNewProject ? { 
                                  duration: 2,
                                  ease: "easeOut"
                                } : {}}
                                onContextMenu={(e) => { e.preventDefault();
                                setContextMenu({ x: e.clientX, y: e.clientY, project }); }}
                                onClick={(e) => handleRowClick(project, e)}
                                className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors ${
                                  'isPinned' in project && (project as any).isPinned ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                                } ${selectedIds.has(project.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                >
                                {canManageBulkActions && (
                                    <td className="px-3 py-3 text-center">
                                        <Checkbox 
                                            checked={selectedIds.has(project.id)}
                                            onCheckedChange={(checked) => handleSelectRow(project.id, checked as boolean)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                )}
                                {!hiddenColumns.has('particulars') && (
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            {('isPinned' in project && (project as any).isPinned) && <Pin className="w-3.5 h-3.5 text-amber-600" />}
                                            <span className="text-sm font-medium">{project.particulars}</span>
                                        </div>
                                    </td>
                                )}
                                {!hiddenColumns.has('implementingOffice') && (
                                    <td className="px-3 py-3 text-sm text-zinc-600">{project.implementingOffice}</td>
                                )}
                                {!hiddenColumns.has('year') && (
                                    <td className="px-3 py-3 text-sm text-center">{project.year || "-"}</td>
                                )}
                                {!hiddenColumns.has('status') && (
                                    <td className="px-3 py-3 text-sm">
                                        <span className={`font-medium ${getStatusColor(project.status)}`}>
                                        {project.status ?
                                        project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ') : '-'}
                                        </span>
                                    </td>
                                )}
                                {!hiddenColumns.has('totalBudgetAllocated') && (
                                    <td className="px-3 py-3 text-right text-sm font-medium">{formatCurrency(project.totalBudgetAllocated)}</td>
                                )}
                                {!hiddenColumns.has('obligatedBudget') && (
                                    <td className="px-3 py-3 text-right text-sm">{project.obligatedBudget ? formatCurrency(project.obligatedBudget) : "-"}</td>
                                )}
                                {!hiddenColumns.has('totalBudgetUtilized') && (
                                    <td className="px-3 py-3 text-right text-sm font-medium">{formatCurrency(project.totalBudgetUtilized)}</td>
                                )}
                                {!hiddenColumns.has('utilizationRate') && (
                                    <td className="px-3 py-3 text-right text-sm font-semibold">
                                        <span className={getUtilizationColor(project.utilizationRate)}>{formatPercentage(project.utilizationRate)}</span>
                                    </td>
                                )}
                                {!hiddenColumns.has('projectCompleted') && (
                                    <td className="px-3 py-3 text-right text-sm"><span className={project.projectCompleted >= 80 ? "text-green-600" : "text-zinc-600"}>{Math.round(project.projectCompleted)}</span></td>
                                )}
                                {!hiddenColumns.has('projectDelayed') && (
                                    <td className="px-3 py-3 text-right text-sm">{Math.round(project.projectDelayed)}</td>
                                )}
                                {!hiddenColumns.has('projectsOngoing') && (
                                    <td className="px-3 py-3 text-right text-sm">{Math.round(project.projectsOngoing)}</td>
                                )}
                                {!hiddenColumns.has('remarks') && (
                                    <td className="px-3 py-3 text-sm text-zinc-500 truncate max-w-[150px]">{project.remarks || "-"}</td>
                                )}
                                </motion.tr>
                              );
                            })}
                        </React.Fragment>
                      );
                   })}

                  {/* Totals Row */}
                  <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 font-semibold sticky bottom-0 z-10">
                    {canManageBulkActions && <td></td>}
                    {visibleLabelColSpan > 0 && (
                        <td className="px-3 py-3" colSpan={visibleLabelColSpan}>
                            <span className="text-sm text-zinc-900">TOTAL</span>
                        </td>
                    )}
                    
                    {!hiddenColumns.has('totalBudgetAllocated') && (
                        <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{formatCurrency(totals.totalBudgetAllocated)}</td>
                    )}
                    {!hiddenColumns.has('obligatedBudget') && (
                        <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{formatCurrency(totals.obligatedBudget)}</td>
                    )}
                    {!hiddenColumns.has('totalBudgetUtilized') && (
                        <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{formatCurrency(totals.totalBudgetUtilized)}</td>
                    )}
                    {!hiddenColumns.has('utilizationRate') && (
                        <td className="px-3 py-3 text-right text-sm"><span className={getUtilizationColor(totals.utilizationRate)}>{formatPercentage(totals.utilizationRate)}</span></td>
                    )}
                    {!hiddenColumns.has('projectCompleted') && (
                        <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{Math.round(totals.projectCompleted)}</td>
                    )}
                    {!hiddenColumns.has('projectDelayed') && (
                        <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{totals.projectDelayed}</td>
                    )}
                    {!hiddenColumns.has('projectsOngoing') && (
                        <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{Math.round(totals.projectsOngoing)}</td>
                    )}
                    {!hiddenColumns.has('remarks') && (
                        <td className="px-3 py-3 text-sm text-zinc-400 text-center">-</td>
                    )}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {contextMenu && (
        <div ref={contextMenuRef} className="fixed bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 py-1 z-50 min-w-[180px]" style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}>
          <button onClick={() => { togglePinProject({ id: contextMenu.project.id as Id<"projects"> }); setContextMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 flex items-center gap-3">
            {('isPinned' in contextMenu.project && (contextMenu.project as any).isPinned) ? <><PinOff className="w-4 h-4" />Unpin</> : <><Pin className="w-4 h-4" />Pin to top</>}
          </button>
          <button onClick={() => { setSelectedLogProject(contextMenu.project); setLogSheetOpen(true); setContextMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
            <History className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /> Activity Log
          </button>
          <button onClick={() => handleContextChangeCategory(contextMenu.project)} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
            <FolderOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /> Move to Category
          </button>
          {onEdit && <button onClick={() => { setSelectedProject(contextMenu.project); setShowEditModal(true); setContextMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 flex items-center gap-3"><Edit className="w-4 h-4" />Edit</button>}
          {onDelete && (
            <button onClick={() => { setSelectedProject(contextMenu.project); setShowDeleteModal(true); setContextMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3 text-red-600 dark:text-red-400 whitespace-nowrap">
              <Trash2 className="w-4 h-4" /> Move to Trash
            </button>
          )}
        </div>
      )}

      {selectedLogProject && (
        <ActivityLogSheet type="project" entityId={selectedLogProject.id} title={`Project History: ${selectedLogProject.particulars}`} isOpen={logSheetOpen} onOpenChange={(open) => { setLogSheetOpen(open); if (!open) setSelectedLogProject(null); }} />
      )}
      {showAddModal && <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Project" size="xl"><ProjectForm budgetItemId={budgetItemId} onSave={(d) => { if (onAdd) onAdd(d); setShowAddModal(false); }} onCancel={() => setShowAddModal(false)} /></Modal>}
      {showEditModal && selectedProject && <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedProject(null); }} title="Edit Project" size="xl"><ProjectForm project={selectedProject} budgetItemId={budgetItemId} onSave={(d) => { if (onEdit) onEdit(selectedProject.id, d); setShowEditModal(false); setSelectedProject(null); }} onCancel={() => { setShowEditModal(false); setSelectedProject(null); }} /></Modal>}
      {showDeleteModal && selectedProject && <ConfirmationModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedProject(null); }} onConfirm={() => { if (onDelete) onDelete(selectedProject.id); setSelectedProject(null); }} title="Move to Trash" message={`Are you sure you want to move "${selectedProject.particulars}" to trash? Associated breakdowns will also be moved.`} confirmText="Move to Trash" variant="danger" />}
      
      {showBulkCategoryConfirmModal && pendingBulkCategoryId && (
        <ConfirmationModal
            isOpen={showBulkCategoryConfirmModal}
            onClose={() => { setShowBulkCategoryConfirmModal(false); setPendingBulkCategoryId(undefined); }}
            onConfirm={confirmBulkCategoryUpdate}
            title="Confirm Bulk Category Update"
            message={`Are you sure you want to move ${selectedIds.size} selected projects to this category? This will update their classification.`}
            confirmText="Yes, Update Projects"
            variant="default"
        />
      )}

      <ConfirmationModal
        isOpen={showSearchWarningModal}
        onClose={() => setShowSearchWarningModal(false)}
        onConfirm={handleConfirmSearchClear}
        title="Clear Selection?"
        message={`${selectedIds.size} ${selectedIds.size === 1 ? 'item' : 'items'} will be unselected. Do you want to proceed?`}
        confirmText="Proceed"
        variant="default"
      />

      <ConfirmationModal
        isOpen={showHideAllWarning}
        onClose={() => setShowHideAllWarning(false)}
        onConfirm={confirmHideAll}
        title="Hide All Columns?"
        message="Are you sure you want to hide all columns? The table will display no data."
        confirmText="Hide All"
        variant="default"
      />

      {showSingleCategoryModal && selectedCategoryProject && (
         <Modal
            isOpen={showSingleCategoryModal} 
            onClose={() => { setShowSingleCategoryModal(false); setSelectedCategoryProject(null); }} 
            title="Move Project to Category"
            size="sm"
         >
            <div className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm font-medium">{selectedCategoryProject.particulars}</p>
                    <p className="text-xs text-zinc-500 mt-1">Current Category: {selectedCategoryProject.categoryId ? allCategories?.find(c => c._id === selectedCategoryProject.categoryId)?.fullName : "Uncategorized"}</p>
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Select New Category</label>
                    <ProjectCategoryCombobox
                        value={singleCategoryId}
                        onChange={(val) => setSingleCategoryId(val)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={() => setShowSingleCategoryModal(false)}>Cancel</Button>
                    <Button onClick={saveSingleCategoryChange} style={{ backgroundColor: accentColorValue }} className="text-white">Update Category</Button>
                </div>
            </div>
         </Modal>
      )}
    </>
  );
}