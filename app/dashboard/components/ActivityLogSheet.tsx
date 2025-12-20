"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { History, Search, Filter, ArrowRight, FileSpreadsheet } from "lucide-react";
import { useAccentColor } from "../contexts/AccentColorContext";

// Define a union type for our logs to normalize data structure
type UnifiedActivityLog = {
  _id: string;
  action: string;
  performedByName: string;
  timestamp: number;
  reason?: string;
  changedFields?: string;
  previousValues?: string;
  newValues?: string;
  projectName?: string; // specific to breakdown
  municipality?: string; // specific to breakdown
  particulars?: string; // specific to project/budget
};

interface ActivityLogSheetProps {
  // Mode selection
  type: "breakdown" | "project" | "budget";
  
  // Identifiers
  entityId?: string; // If provided, filters by specific ID. If missing, fetches ALL (Global mode).
  
  // Legacy identifiers for breakdown (which uses names)
  projectName?: string;
  implementingOffice?: string;
  
  // UI Props
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}

export function ActivityLogSheet({
  type,
  entityId,
  projectName,
  implementingOffice,
  trigger,
  isOpen,
  onOpenChange,
  title
}: ActivityLogSheetProps) {
  const { accentColorValue } = useAccentColor();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  // 1. Fetch Breakdown Logs (Legacy Name-based)
  const breakdownLogs = useQuery(
    api.govtProjectActivities.getAllActivities,
    type === "breakdown" 
      ? { projectName, implementingOffice, action: actionFilter !== "all" ? actionFilter : undefined, pageSize: 50 }
      : "skip"
  );

  // 2. Fetch Project Logs (ID-based)
  const projectLogs = useQuery(
    api.projectActivities.getByProject,
    type === "project" && entityId
      ? { projectId: entityId as Id<"projects">, limit: 50 }
      : "skip"
  );

  // 3. Fetch Budget Logs (ID-based - Single Item)
  const singleBudgetLogs = useQuery(
    api.budgetItemActivities.getByBudgetItem,
    type === "budget" && entityId
      ? { budgetItemId: entityId as Id<"budgetItems">, limit: 50 }
      : "skip"
  );

  // 4. Fetch Global Budget Logs (All Items)
  const allBudgetLogs = useQuery(
    api.budgetItemActivities.getAll,
    type === "budget" && !entityId
      ? { limit: 50 }
      : "skip"
  );

  // Unify the data source
  let activities: UnifiedActivityLog[] = [];
  let isLoading = false;

  if (type === "breakdown") {
    activities = (breakdownLogs?.activities || []) as UnifiedActivityLog[];
    isLoading = breakdownLogs === undefined;
  } else if (type === "project") {
    activities = (projectLogs || []) as UnifiedActivityLog[];
    isLoading = projectLogs === undefined;
  } else if (type === "budget") {
    if (entityId) {
      activities = (singleBudgetLogs || []) as UnifiedActivityLog[];
      isLoading = singleBudgetLogs === undefined;
    } else {
      activities = (allBudgetLogs || []) as UnifiedActivityLog[];
      isLoading = allBudgetLogs === undefined;
    }
  }

  // Client-side search for finer details
  const filteredActivities = activities.filter((activity) => {
    if (actionFilter !== "all" && type !== "breakdown" && activity.action !== actionFilter) return false;
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Safety checks for optional fields
    const nameMatch = activity.performedByName?.toLowerCase().includes(query) ?? false;
    const reasonMatch = activity.reason?.toLowerCase().includes(query) ?? false;
    const fieldMatch = activity.changedFields?.toLowerCase().includes(query) ?? false;
    const projectMatch = activity.projectName?.toLowerCase().includes(query) ?? false;
    const particularMatch = activity.particulars?.toLowerCase().includes(query) ?? false;

    return nameMatch || reasonMatch || fieldMatch || projectMatch || particularMatch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Created</Badge>;
      case "updated":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Updated</Badge>;
      case "deleted":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Deleted</Badge>;
      case "restored":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Restored</Badge>;
      case "bulk_created":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200"><FileSpreadsheet className="w-3 h-3 mr-1"/> Import</Badge>;
      case "bulk_updated":
        return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200"><FileSpreadsheet className="w-3 h-3 mr-1"/> Bulk Edit</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{action.replace("_", " ")}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Activity Log</span>
          </Button>
        </SheetTrigger>
      )}
      
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
        <SheetHeader className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg bg-opacity-10" 
              style={{ backgroundColor: `${accentColorValue}15`, color: accentColorValue }}
            >
              <History className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {title || "Activity Log"}
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Track changes and updates history
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Filters and Search */}
        <div className="p-4 space-y-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-9 text-sm"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[110px] h-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                {type === "breakdown" && <SelectItem value="bulk_created">Imports</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Log List */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-6 space-y-6">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-10 space-y-3">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-400"></div>
                 <p className="text-sm text-zinc-500">Loading history...</p>
               </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
                  <Filter className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No activities found</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px]">
                  {searchQuery || actionFilter !== 'all' 
                    ? "Try adjusting your search or filters." 
                    : "There are no recorded activities yet."}
                </p>
                {(searchQuery || actionFilter !== 'all') && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => { setSearchQuery(""); setActionFilter("all"); }}
                    className="text-blue-500"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity._id} className="relative pl-6 pb-2 border-l-2 border-zinc-200 dark:border-zinc-800 last:border-0 last:pb-0">
                  {/* Timeline Dot */}
                  <div 
                    className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-300 dark:bg-zinc-700"
                    style={{ backgroundColor: activity.action === 'created' ? '#4ade80' : activity.action === 'deleted' ? '#f87171' : accentColorValue }}
                  />

                  <div className="flex flex-col space-y-3 mb-6">
                    {/* Header: User & Time */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6 border border-zinc-200 dark:border-zinc-700">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {getInitials(activity.performedByName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {activity.performedByName}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>

                    {/* Action & Context */}
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        {getActionBadge(activity.action)}
                        
                        {/* Show Badge context if generic */}
                        {type === "breakdown" && activity.municipality && (
                          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {activity.municipality}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                         {activity.action === 'bulk_created' ? (
                           <span>Imported <strong>{JSON.parse(activity.newValues || "{}").length || "multiple"}</strong> records via Excel.</span>
                        ) : (
                           <div>
                             {/* Context display logic */}
                             {type === "breakdown" ? (
                               <span>Processed breakdown for <strong>{implementingOffice}</strong></span>
                             ) : type === "project" ? (
                               <span>Processed project <strong>{activity.particulars}</strong></span>
                             ) : (
                               <span>Processed budget item <strong>{activity.particulars}</strong></span>
                             )}
                             
                             {activity.reason && <div className="mt-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-950/50 rounded border border-zinc-100 dark:border-zinc-800 text-zinc-500 italic">"{activity.reason}"</div>}
                           </div>
                        )}
                      </div>

                      {/* Change Diff Visualization */}
                      {activity.action === 'updated' && activity.previousValues && activity.newValues && (
                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                          {(() => {
                            try {
                              const prev = JSON.parse(activity.previousValues);
                              const curr = JSON.parse(activity.newValues);
                              
                              // Track different fields based on type
                              let trackedFields: string[] = [];
                              if (type === "breakdown") {
                                trackedFields = ['allocatedBudget', 'status', 'projectAccomplishment', 'remarks'];
                              } else if (type === "project") {
                                trackedFields = ['totalBudgetAllocated', 'targetDateCompletion', 'remarks', 'implementingOffice'];
                              } else if (type === "budget") {
                                trackedFields = ['totalBudgetAllocated', 'particulars', 'year', 'notes'];
                              }

                              const changes = trackedFields.filter(key => prev[key] !== curr[key]);
                              
                              if (changes.length === 0) return <div className="text-[10px] text-zinc-400">Updated details</div>;

                              return changes.map(key => (
                                <div key={key} className="text-xs grid grid-cols-[1fr,auto,1fr] gap-2 items-center group">
                                  <span className="text-zinc-500 truncate text-right capitalize group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-zinc-300" />
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                    {typeof curr[key] === 'number' && (key.includes('Budget') || key.includes('Allocated')) 
                                      ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(curr[key])
                                      : String(curr[key] || "Empty")}
                                  </span>
                                </div>
                              ));
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}