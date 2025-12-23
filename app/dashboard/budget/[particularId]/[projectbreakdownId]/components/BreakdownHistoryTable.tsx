// app/dashboard/budget/[particularId]/[projectbreakdownId]/components/BreakdownHistoryTable.tsx

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAccentColor } from "../../../../contexts/AccentColorContext";
import { Search, GripVertical, Edit, Trash2, Printer } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

/* =======================
   TYPES
======================= */

interface Breakdown {
  _id: string;
  projectName: string;
  implementingOffice: string;
  projectId?: string; // 🔧 CRITICAL: This must be present in data
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

interface ColumnConfig {
  key: keyof Breakdown;
  label: string;
  width: number;
  type: "text" | "number" | "date" | "status" | "currency";
  align: "left" | "right" | "center";
}

interface Props {
  breakdowns: Breakdown[];
  onPrint: () => void;
  onAdd?: () => void;
  onEdit?: (breakdown: Breakdown) => void;
  onDelete?: (id: string) => void;
  onOpenTrash?: () => void;
}

/* =======================
   DEFAULT COLUMNS
======================= */

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "projectTitle", label: "Project Name", width: 260, type: "text", align: "left" },
  { key: "implementingOffice", label: "Implementing Office", width: 180, type: "text", align: "left" },
  { key: "allocatedBudget", label: "Allocated Budget", width: 140, type: "currency", align: "right" },
  { key: "obligatedBudget", label: "Obligated Budget", width: 140, type: "currency", align: "right" },
  { key: "budgetUtilized", label: "Budget Utilized", width: 140, type: "currency", align: "right" },
  { key: "utilizationRate", label: "Utilization Rate", width: 140, type: "currency", align: "right" },
  { key: "balance", label: "Balance", width: 140, type: "currency", align: "right" },
  { key: "dateStarted", label: "Date Started", width: 130, type: "date", align: "left" },
  { key: "targetDate", label: "Target Date", width: 130, type: "date", align: "left" },
  { key: "completionDate", label: "Completion Date", width: 130, type: "date", align: "left" },
  { key: "projectAccomplishment", label: "Project Accomplishment%", width: 90, type: "number", align: "right" },
  { key: "status", label: "Status", width: 130, type: "status", align: "center" },
  { key: "remarks", label: "Remarks", width: 220, type: "text", align: "left" },
];

/* =======================
   COMPONENT
======================= */

export function BreakdownHistoryTable({
  breakdowns,
  onPrint,
  onAdd,
  onEdit,
  onDelete,
  onOpenTrash,
}: Props) {
  const router = useRouter();
  const params = useParams();
  const { accentColorValue } = useAccentColor();

  const tableIdentifier = "govtProjectBreakdowns";
  const settings = useQuery(api.tableSettings.getSettings, { tableIdentifier });
  const saveSettings = useMutation(api.tableSettings.saveSettings);
  
  // Get current user to check permissions
  const currentUser = useQuery(api.users.current);
  const canEditLayout = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [search, setSearch] = useState("");

  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const defaultRowHeight = 48;

  const [draggedCol, setDraggedCol] = useState<number | null>(null);

  /* =======================
     NAVIGATION HANDLER
     🔧 SIMPLIFIED: Just use the projectId from URL params
  ======================= */
  const handleRowClick = (breakdown: Breakdown, event: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menuitem"]')) {
      return;
    }

    // 🔧 DEBUG: Log the breakdown to see if projectId exists
    console.log('Breakdown clicked:', {
      _id: breakdown._id,
      projectId: breakdown.projectId,
      projectTitle: breakdown.projectTitle,
      allKeys: Object.keys(breakdown)
    });

    // Get current URL params - we're already on the project page!
    const particularId = params.particularId as string;
    const projectbreakdownId = params.projectbreakdownId as string;

    // 🔧 CRITICAL: The projectbreakdownId IS the projectId
    // We need to extract the actual ID from it
    const extractProjectId = (slug: string): string => {
      const parts = slug.split('-');
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.length > 15 && /^[a-z0-9]+$/i.test(part)) {
          return part;
        }
      }
      return parts[parts.length - 1];
    };

    const currentProjectId = extractProjectId(projectbreakdownId);

    // Create slug for the breakdown to use as the new "projectId" segment
    const breakdownSlug = `${(breakdown.projectTitle || breakdown.projectName || 'breakdown')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}-${breakdown._id}`;

    // Navigate to breakdown detail page (3rd level)
    router.push(`/dashboard/budget/${particularId}/${projectbreakdownId}/${breakdownSlug}`);
  };

  /* =======================
     LOAD SETTINGS
  ======================= */

  useEffect(() => {
    if (!settings?.columns) return;

    const merged: ColumnConfig[] = [];
    settings.columns.forEach(c => {
      const def = DEFAULT_COLUMNS.find(d => d.key === c.fieldKey);
      if (def) merged.push({ ...def, width: c.width });
    });

    DEFAULT_COLUMNS.forEach(def => {
      if (!merged.find(c => c.key === def.key)) merged.push(def);
    });

    setColumns(merged);

    if (settings.customRowHeights) {
      try {
        setRowHeights(JSON.parse(settings.customRowHeights));
      } catch {}
    }
  }, [settings]);

  /* =======================
     GRID TEMPLATE
  ======================= */

  const gridTemplateColumns = useMemo(() => {
    return ["48px", ...columns.map(c => `${c.width}px`), "64px"].join(" ");
  }, [columns]);

  /* =======================
     SAVE LAYOUT
  ======================= */

  const saveLayout = useCallback(
    (cols: ColumnConfig[], heights: Record<string, number>) => {
      if (!canEditLayout) return;
      
      saveSettings({
        tableIdentifier,
        columns: cols.map(c => ({
          fieldKey: c.key,
          width: c.width,
          isVisible: true,
        })),
        customRowHeights: JSON.stringify(heights),
      }).catch(console.error);
    },
    [saveSettings, canEditLayout]
  );

  /* =======================
     COLUMN RESIZE
  ======================= */

  const startResizeColumn = (e: React.MouseEvent, index: number) => {
    if (!canEditLayout) return;
    
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = columns[index].width;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setColumns(prev => {
        const next = [...prev];
        next[index] = { ...next[index], width: Math.max(80, startWidth + delta) };
        return next;
      });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setColumns(prev => {
        saveLayout(prev, rowHeights);
        return prev;
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  /* =======================
     ROW RESIZE
  ======================= */

  const startResizeRow = (e: React.MouseEvent, rowId: string) => {
    if (!canEditLayout) return;
    
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startHeight = rowHeights[rowId] ?? defaultRowHeight;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      setRowHeights(prev => ({
        ...prev,
        [rowId]: Math.max(32, startHeight + delta),
      }));
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setRowHeights(prev => {
        saveLayout(columns, prev);
        return prev;
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  /* =======================
     DRAG & DROP
  ======================= */

  const onDragStart = (index: number) => {
    if (!canEditLayout) return;
    setDraggedCol(index);
  };

  const onDrop = (index: number) => {
    if (!canEditLayout) return;
    if (draggedCol === null || draggedCol === index) return;

    setColumns(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedCol, 1);
      next.splice(index, 0, moved);
      saveLayout(next, rowHeights);
      return next;
    });

    setDraggedCol(null);
  };

  /* =======================
     FILTER
  ======================= */

  const rows = useMemo(() => {
    if (!search) return breakdowns;
    const q = search.toLowerCase();
    return breakdowns.filter(r =>
      Object.entries(r).some(([key, value]) => {
        if (key === '_id') return false;
        return String(value).toLowerCase().includes(q);
      })
    );
  }, [breakdowns, search]);

  /* =======================
     FORMAT
  ======================= */

  const format = (val: any, col: ColumnConfig, row: Breakdown) => {
    if (val == null || val === undefined || val === "") return "-";
    
    if (col.type === "currency") {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
      }).format(val);
    }
    
    if (col.type === "date") {
      return new Date(val).toLocaleDateString("en-PH");
    }
    
    if (col.type === "number") {
      return `${parseFloat(val).toFixed(1)}%`;
    }
    
    if (col.key === "municipality") {
      const locationParts = [row.barangay, row.municipality, row.district].filter(Boolean);
      return locationParts.length > 0 ? locationParts.join(", ") : "-";
    }
    
    return val;
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="flex flex-col h-[700px] border rounded-xl bg-white dark:bg-zinc-900">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 p-4 border-b shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onOpenTrash}
            className="cursor-pointer px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:scale-105 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
            title="View Recycle Bin"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Recycle Bin</span>
            </div>
          </button>
          <button
            onClick={onPrint}
            className="cursor-pointer px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            title="Print"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print</span>
            </div>
          </button>
          {onAdd && (
            <button
              onClick={onAdd}
              className="cursor-pointer px-3 sm:px-4 py-2 rounded text-white font-medium flex-1 sm:flex-none"
              style={{ backgroundColor: accentColorValue }}
            >
              <span className="hidden sm:inline">Add Record</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* SCROLL CONTAINER */}
      <div className="flex-1 overflow-auto w-[1920px] md:w-auto">
        {/* HEADER */}
        <div
          className="sticky top-0 z-10 grid outline-1 outline-gray-500/30 border dark:bg-zinc-800"
          style={{ gridTemplateColumns }}
        >
          <div className="text-center py-3 border-r text-xs text-zinc-600 dark:text-zinc-300">#</div>
          {columns.map((c, i) => (
            <div
              key={c.key}
              draggable={canEditLayout}
              onDragStart={() => onDragStart(i)}
              onDragOver={e => canEditLayout && e.preventDefault()}
              onDrop={() => onDrop(i)}
              className={`relative px-3 py-3 border-r flex items-center gap-2 text-zinc-700 dark:text-zinc-300 ${
                canEditLayout ? "cursor-move" : ""
              }`}
            >
              {canEditLayout && <GripVertical className="w-3 h-3 text-zinc-400" />}
              <span className="flex-1 truncate text-sm font-medium">{c.label}</span>
              {canEditLayout && (
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                  onMouseDown={e => startResizeColumn(e, i)}
                />
              )}
            </div>
          ))}
          <div className="text-center py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300">Actions</div>
        </div>

        {/* BODY */}
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
            No breakdown records found
          </div>
        ) : (
          rows.map((r, idx) => {
            const height = rowHeights[r._id] ?? defaultRowHeight;

            return (
              <ContextMenu key={r._id}>
                <ContextMenuTrigger asChild>
                  <div
                    className="grid border-b hover:bg-zinc-50 dark:hover:bg-zinc-800 relative bg-white dark:bg-zinc-900 cursor-pointer transition-colors"
                    style={{ gridTemplateColumns, height }}
                    onClick={(e) => handleRowClick(r, e)}
                  >
                    <div className="text-center border-r text-xs py-2 text-zinc-600 dark:text-zinc-400 relative">
                      {idx + 1}
                      {canEditLayout && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize"
                          onMouseDown={e => startResizeRow(e, r._id)}
                        />
                      )}
                    </div>

                    {columns.map(c => (
                      <div 
                        key={c.key} 
                        className={`px-3 py-2 truncate border-r text-zinc-700 dark:text-zinc-300 ${
                          c.align === 'right' ? 'text-right' : 
                          c.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {format(r[c.key], c, r)}
                      </div>
                    ))}

                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(r);
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(r._id);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-56">
                  <ContextMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(r, e as any);
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View Details</span>
                  </ContextMenuItem>
                  
                  {onEdit && (
                    <>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(r);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Breakdown</span>
                      </ContextMenuItem>
                    </>
                  )}
                  
                  {onDelete && (
                    <>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(r._id);
                        }}
                        className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Move to Trash</span>
                      </ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            );
          })
        )}
      </div>
    </div>
  );
}