// app/dashboard/budget/[particularId]/[projectbreakdownId]/components/BreakdownHistoryTable.tsx

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
}

/* =======================
   DEFAULT COLUMNS
======================= */

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "projectTitle", label: "Project Title", width: 260, type: "text", align: "left" },
  { key: "implementingOffice", label: "Office", width: 180, type: "text", align: "left" },
  { key: "municipality", label: "Location", width: 200, type: "text", align: "left" },
  { key: "allocatedBudget", label: "Allocated", width: 140, type: "currency", align: "right" },
  { key: "budgetUtilized", label: "Utilized", width: 140, type: "currency", align: "right" },
  { key: "projectAccomplishment", label: "%", width: 90, type: "number", align: "right" },
  { key: "status", label: "Status", width: 130, type: "status", align: "center" },
  { key: "dateStarted", label: "Start Date", width: 130, type: "date", align: "left" },
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
}: Props) {
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
      <div className="flex justify-between p-4 border-b shrink-0">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
              <button
                onClick={onPrint}
                className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
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
              onClick={onAdd}
              className="cursor-pointer px-4 py-2 rounded text-white font-medium"
              style={{ backgroundColor: accentColorValue }}
            >
              Add Record
            </button>
          )}
        </div>
      </div>

      {/* SCROLL CONTAINER */}
      <div className="flex-1 overflow-auto">
        {/* HEADER */}
        <div
          className="sticky top-0 z-10 grid border-b bg-zinc-100 dark:bg-zinc-800"
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
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-zinc-400"
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
                    className="grid border-b hover:bg-zinc-50 dark:hover:bg-zinc-800 relative bg-white dark:bg-zinc-900 cursor-context-menu"
                    style={{ gridTemplateColumns, height }}
                  >
                    <div className="text-center border-r text-xs py-2 text-zinc-600 dark:text-zinc-400 relative">
                      {idx + 1}
                      {canEditLayout && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-zinc-400"
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
                          onClick={() => onEdit(r)}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(r._id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-56">
                  {onEdit && (
                    <ContextMenuItem
                      onClick={() => onEdit(r)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Breakdown</span>
                    </ContextMenuItem>
                  )}
                  
                  {onEdit && onDelete && <ContextMenuSeparator />}
                  
                  {onDelete && (
                    <ContextMenuItem
                      onClick={() => onDelete(r._id)}
                      className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Breakdown</span>
                    </ContextMenuItem>
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