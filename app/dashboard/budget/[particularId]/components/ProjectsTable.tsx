// app/dashboard/budget/[particularId]/components/ProjectsTable.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Project } from "../../types";
import { useAccentColor } from "../../../contexts/AccentColorContext";
import { Modal } from "../../components/Modal";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { ProjectForm } from "./ProjectForm";
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
  FileText,
  History
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { ActivityLogSheet } from "@/app/dashboard/components/ActivityLogSheet";

interface ProjectsTableProps {
  projects: Project[];
  particularId: string;
  budgetItemId?: string; // 🔧 ADD THIS PROP
  onAdd?: (project: Omit<Project, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing">) => void;
  onEdit?: (id: string, project: Omit<Project, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing">) => void;
  onDelete?: (id: string) => void;
}

type SortDirection = "asc" | "desc" | null;
type SortField = keyof Project | null;

export function ProjectsTable({
  projects,
  particularId,
  budgetItemId, // 🔧 DESTRUCTURE THE PROP
  onAdd,
  onEdit,
  onDelete,
}: ProjectsTableProps) {
  const { accentColorValue } = useAccentColor();
  const router = useRouter();
  const togglePinProject = useMutation(api.projects.togglePin);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    project: Project;
  } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [officeFilter, setOfficeFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<number[]>([]);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
 
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [selectedLogProject, setSelectedLogProject] = useState<Project | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // 🔧 ADD DEBUG LOG TO VERIFY budgetItemId IS RECEIVED
  useEffect(() => {
    console.log("🎯 [ProjectsTable] Received Props:", {
      budgetItemId,
      hasBudgetItemId: !!budgetItemId,
      budgetItemIdType: typeof budgetItemId,
      particularId,
    });
  }, [budgetItemId, particularId]);

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
    projects.forEach(project => { if (project.status) statuses.add(project.status); });
    return Array.from(statuses).sort();
  }, [projects]);

  const uniqueOffices = useMemo(() => {
    const offices = new Set<string>();
    projects.forEach(project => { if (project.implementingOffice) offices.add(project.implementingOffice); });
    return Array.from(offices).sort();
  }, [projects]);

  const uniqueYears = useMemo(() => {
    const years = new Set<number>();
    projects.forEach(project => { if (project.year) years.add(project.year); });
    return Array.from(years).sort((a, b) => b - a);
  }, [projects]);

  const createSlug = (text: string): string => {
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const createProjectSlug = (departmentName: string, projectId: string): string => {
    return `${createSlug(departmentName)}-${projectId}`;
  };

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter.length > 0 || officeFilter.length > 0 || yearFilter.length > 0 || sortField !== null;

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => {
        return (
          project.particulars.toLowerCase().includes(query) ||
          project.implementingOffice.toLowerCase().includes(query) ||
          project.status?.toLowerCase().includes(query) ||
          project.totalBudgetAllocated.toString().includes(query) ||
          (project.obligatedBudget && project.obligatedBudget.toString().includes(query)) ||
          project.totalBudgetUtilized.toString().includes(query) ||
          project.utilizationRate.toFixed(1).includes(query) ||
          project.projectCompleted.toString().includes(query) ||
          project.projectDelayed.toString().includes(query) ||
          project.projectsOngoing.toString().includes(query) ||
          (project.remarks && project.remarks.toLowerCase().includes(query)) ||
          (project.year && project.year.toString().includes(query))
        );
      });
    }

    

    if (statusFilter.length > 0) {
      filtered = filtered.filter(project => project.status && statusFilter.includes(project.status));
    }

    if (officeFilter.length > 0) {
      filtered = filtered.filter(project => officeFilter.includes(project.implementingOffice));
    }

    if (yearFilter.length > 0) {
      filtered = filtered.filter(project => project.year && yearFilter.includes(project.year));
    }

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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewLogs = (project: Project) => {
      setSelectedLogProject(project);
      setLogSheetOpen(true);
      setContextMenu(null);
    };

  const formatPercentage = (value: number): string => `${value.toFixed(1)}%`;

  const formatNumber = (value: number): string => {
    return Math.round(value).toString();
  };

  const getUtilizationColor = (rate: number): string => {
    if (rate >= 80) return "text-red-600 dark:text-red-400";
    if (rate >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  const getAccomplishmentColor = (rate: number): string => {
    if (rate >= 80) return "text-green-600 dark:text-green-400";
    if (rate >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  const getStatusColor = (status?: string): string => {
      if (!status) return "text-zinc-600 dark:text-zinc-400";
      
      if (status === "completed") return "text-green-600 dark:text-green-400";
      if (status === "ongoing") return "text-blue-600 dark:text-blue-400";
      if (status === "delayed") return "text-red-600 dark:text-red-400";
      
      return "text-zinc-600 dark:text-zinc-400";
  };

  const handleRowClick = (project: Project, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const projectSlug = createProjectSlug(project.implementingOffice, project.id);
    router.push(`/dashboard/budget/${encodeURIComponent(particularId)}/${projectSlug}`);
  };

  const handleContextMenu = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, project });
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setShowEditModal(true);
    setContextMenu(null);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
    setContextMenu(null);
  };

  const handlePin = async (project: Project) => {
    try {
      const isPinned = 'isPinned' in project ? (project as any).isPinned : false;
      await togglePinProject({ id: project.id as Id<"projects"> });
      toast.success(isPinned ? "Project unpinned" : "Project pinned to top");
    } catch (error) {
      toast.error("Failed to pin/unpin project");
    }
    setContextMenu(null);
  };

  const handleSave = (formData: Omit<Project, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing">) => {
    if (selectedProject && onEdit) {
      onEdit(selectedProject.id, formData);
    } else if (onAdd) {
      onAdd(formData);
    }
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedProject(null);
  };

  const handleConfirmDelete = () => {
    if (selectedProject && onDelete) onDelete(selectedProject.id);
    setSelectedProject(null);
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

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const toggleOfficeFilter = (office: string) => {
    setOfficeFilter(prev => prev.includes(office) ? prev.filter(o => o !== office) : [...prev, office]);
  };

  const toggleYearFilter = (year: number) => {
    setYearFilter(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setOfficeFilter([]);
    setYearFilter([]);
    setSortField(null);
    setSortDirection(null);
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
    { 
      totalBudgetAllocated: 0, 
      obligatedBudget: 0,
      totalBudgetUtilized: 0, 
      utilizationRate: 0, 
      projectCompleted: 0, 
      projectDelayed: 0, 
      projectsOngoing: 0 
    }
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };

  return (
    <>
      <div className="print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4 no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Projects</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSearchVisible(!isSearchVisible)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSearchVisible ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'}`}><div className="flex items-center gap-2"><Search className="w-4 h-4" />Search</div></button>
              <button onClick={() => window.print()} className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"><div className="flex items-center gap-2"><FileText className="w-4 h-4" />Print</div></button>
              {onAdd && <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: accentColorValue }}>Add New Project</button>}
            </div>
          </div>
          {isSearchVisible && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" style={{ '--tw-ring-color': accentColorValue } as any} /></div>
                {hasActiveFilters && <button onClick={clearAllFilters} className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2"><X className="w-4 h-4" />Clear</button>}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto max-h-[600px] relative">
          <table className="w-full">
            {/* Table headers - keeping original code */}
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <th className="px-3 py-3 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("particulars")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Particulars <SortIcon field="particulars" /></button></th>
                <th className="px-3 py-3 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => setActiveFilterColumn(activeFilterColumn === "office" ? null : "office")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Implementing Office <Filter className="w-3.5 h-3.5 opacity-50" /></button></th>
                <th className="px-3 py-3 text-center sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => setActiveFilterColumn(activeFilterColumn === "year" ? null : "year")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Year <Filter className="w-3.5 h-3.5 opacity-50" /></button></th>
                <th className="px-3 py-3 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => setActiveFilterColumn(activeFilterColumn === "status" ? null : "status")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Status <Filter className="w-3.5 h-3.5 opacity-50" /></button></th>
                <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("totalBudgetAllocated")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Budget Allocated <SortIcon field="totalBudgetAllocated" /></button></th>
                <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("obligatedBudget")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Obligated Budget <SortIcon field="obligatedBudget" /></button></th>
                <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("totalBudgetUtilized")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Budget Utilized <SortIcon field="totalBudgetUtilized" /></button></th>
                <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("utilizationRate")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Utilization Rate (%) <SortIcon field="utilizationRate" /></button></th>
                <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("projectCompleted")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Completed <SortIcon field="projectCompleted" /></button></th>
                <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("projectDelayed")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Delayed <SortIcon field="projectDelayed" /></button></th>
                <th className="px-3 py-3 text-right sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10"><button onClick={() => handleSort("projectsOngoing")} className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wide">Ongoing <SortIcon field="projectsOngoing" /></button></th>
                <th className="px-3 py-3 text-left sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10 text-xs font-semibold uppercase tracking-wide">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {/* Table body - keeping original code */}
              {filteredAndSortedProjects.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-zinc-500">No projects found matching your criteria.</td></tr>
              ) : (
                <>
                  {filteredAndSortedProjects.map((project) => (
                    <tr
                      key={project.id}
                      onContextMenu={(e) => handleContextMenu(e, project)}
                      onClick={(e) => handleRowClick(project, e)}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer ${
                        'isPinned' in project && (project as any).isPinned
                          ? 'bg-amber-50 dark:bg-amber-950/20'
                          : ''
                      }`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {('isPinned' in project && (project as any).isPinned) && (
                            <Pin className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span className="text-sm font-medium">
                            {project.particulars}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-zinc-600">{project.implementingOffice}</td>
                      <td className="px-3 py-3 text-sm text-center">{project.year || "-"}</td>
                      <td className="px-3 py-3 text-sm">
                        <span className={`font-medium ${getStatusColor(project.status)}`}>
                          {project.status ? project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ') : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium">{formatCurrency(project.totalBudgetAllocated)}</td>
                      <td className="px-3 py-3 text-right text-sm">{project.obligatedBudget ? formatCurrency(project.obligatedBudget) : "-"}</td>
                      <td className="px-3 py-3 text-right text-sm font-medium">{formatCurrency(project.totalBudgetUtilized)}</td>
                      <td className="px-3 py-3 text-right text-sm font-semibold">
                        <span className={getUtilizationColor(project.utilizationRate)}>{formatPercentage(project.utilizationRate)}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm">
                        <span className={getAccomplishmentColor(project.projectCompleted)}>{Math.round(project.projectCompleted)}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm">{Math.round(project.projectDelayed)}</td>
                      <td className="px-3 py-3 text-right text-sm">{Math.round(project.projectsOngoing)}</td>
                      <td className="px-3 py-3 text-sm text-zinc-500 truncate max-w-[150px]">{project.remarks || "-"}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 font-semibold">
                    <td className="px-3 py-3" colSpan={4}><span className="text-sm text-zinc-900">TOTAL</span></td>
                    <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{formatCurrency(totals.totalBudgetAllocated)}</td>
                    <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{formatCurrency(totals.obligatedBudget)}</td>
                    <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{formatCurrency(totals.totalBudgetUtilized)}</td>
                    <td className="px-3 py-3 text-right text-sm">
                      <span className={getUtilizationColor(totals.utilizationRate)}>{formatPercentage(totals.utilizationRate)}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{formatNumber(totals.projectCompleted)}</td>
                    <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{totals.projectDelayed}</td>
                    <td className="px-3 py-3 text-right text-sm" style={{ color: accentColorValue }}>{formatNumber(totals.projectsOngoing)}</td>
                    <td className="px-3 py-3 text-sm text-zinc-400 text-center">-</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {contextMenu && (
        <div ref={contextMenuRef} className="fixed bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 py-1 z-50 min-w-[180px]" style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}>
          <button onClick={() => handlePin(contextMenu.project)} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 flex items-center gap-3">
            {('isPinned' in contextMenu.project && (contextMenu.project as any).isPinned) ? <><PinOff className="w-4 h-4" />Unpin</> : <><Pin className="w-4 h-4" />Pin to top</>}
          </button>
          
          {/* [NEW] View Activity Log Option */}
          <button 
            onClick={() => handleViewLogs(contextMenu.project)} 
            className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 flex items-center gap-3 text-zinc-700 dark:text-zinc-300"
          >
            <History className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            Activity Log
          </button>

          {onEdit && <button onClick={() => handleEdit(contextMenu.project)} className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 flex items-center gap-3"><Edit className="w-4 h-4" />Edit</button>}
          {onDelete && <button onClick={() => handleDelete(contextMenu.project)} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3"><Trash2 className="w-4 h-4" />Delete</button>}
        </div>
      )}

      {/* [NEW] Render the Log Sheet when triggered */}
      {selectedLogProject && (
        <ActivityLogSheet
          type="project"
          entityId={selectedLogProject.id}
          title={`Project History: ${selectedLogProject.particulars}`}
          isOpen={logSheetOpen}
          onOpenChange={(open) => {
            setLogSheetOpen(open);
            if (!open) setSelectedLogProject(null);
          }}
        />
      )}

      {/* 🔧 FIX: Pass budgetItemId to ProjectForm */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Project" size="xl">
          <ProjectForm 
            budgetItemId={budgetItemId}
            onSave={handleSave} 
            onCancel={() => setShowAddModal(false)} 
          />
        </Modal>
      )}
      
      {/* 🔧 FIX: Pass budgetItemId to ProjectForm when editing too */}
      {showEditModal && selectedProject && (
        <Modal 
          isOpen={showEditModal} 
          onClose={() => { 
            setShowEditModal(false); 
            setSelectedProject(null); 
          }} 
          title="Edit Project" 
          size="xl"
        >
          <ProjectForm 
            project={selectedProject}
            budgetItemId={budgetItemId}
            onSave={handleSave} 
            onCancel={() => { 
              setShowEditModal(false); 
              setSelectedProject(null); 
            }} 
          />
        </Modal>
      )}
      
      {showDeleteModal && selectedProject && (
        <ConfirmationModal 
          isOpen={showDeleteModal} 
          onClose={() => { 
            setShowDeleteModal(false); 
            setSelectedProject(null); 
          }} 
          onConfirm={handleConfirmDelete} 
          title="Delete Project" 
          message={`Are you sure you want to delete "${selectedProject.particulars}"?`} 
          confirmText="Delete" 
          variant="danger" 
        />
      )}
    </>
  );
}