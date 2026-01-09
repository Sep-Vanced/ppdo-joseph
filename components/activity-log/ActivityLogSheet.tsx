"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { History } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ActivityLogCard } from "./ActivityLogCard";
import { ActivityLogEmptyState } from "./ActivityLogEmptyState";
import { ActivityLogFilters } from "./ActivityLogFilters";
import { ActivityLogSkeletonList } from "./ActivityLogSkeletonList";
import { useActivityLogData } from "./useActivityLogData";
import { ActivityLogSheetProps, UnifiedActivityLog } from "./types";
import { useAccentColor } from "@/contexts/AccentColorContext";

export function ActivityLogSheet({
  type,
  entityId,
  budgetItemId,
  projectName,
  implementingOffice,
  trigger,
  isOpen,
  onOpenChange,
  title,
}: ActivityLogSheetProps) {
  const { accentColorValue } = useAccentColor();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [loadedCount, setLoadedCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  const { activities, isLoading, hasMoreToLoad } = useActivityLogData({
    type,
    entityId,
    budgetItemId,
    projectName,
    implementingOffice,
    actionFilter,
    loadedCount,
  });

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (actionFilter !== "all" && type !== "breakdown" && activity.action !== actionFilter) return false;
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const nameMatch = activity.performedByName?.toLowerCase().includes(query) ?? false;
      const reasonMatch = activity.reason?.toLowerCase().includes(query) ?? false;
      const fieldMatch = activity.changedFields?.toLowerCase().includes(query) ?? false;
      const projectMatch = activity.projectName?.toLowerCase().includes(query) ?? false;
      const particularMatch = activity.particulars?.toLowerCase().includes(query) ?? false;

      return nameMatch || reasonMatch || fieldMatch || projectMatch || particularMatch;
    });
  }, [activities, actionFilter, searchQuery, type]);

  const groupedActivities = useMemo(() => groupActivitiesByMonth(filteredActivities), [filteredActivities]);
  const hasFiltersApplied = searchQuery.length > 0 || actionFilter !== "all";

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Store current scroll position before loading more
    const scrollContainer = document.querySelector('[aria-label="Activity log list"] > div');
    if (scrollContainer) {
      scrollPositionRef.current = scrollContainer.scrollTop;
    }
    setLoadedCount((previous) => previous + 5);
    setTimeout(() => setIsLoadingMore(false), 300);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
  };

  // Restore scroll position after items are loaded
  useEffect(() => {
    if (!isLoadingMore && scrollPositionRef.current > 0) {
      const scrollContainer = document.querySelector('[aria-label="Activity log list"] > div');
      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollPositionRef.current;
        });
      }
    }
  }, [isLoadingMore, filteredActivities.length]);

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

      <SheetContent
        aria-label="Activity log panel"
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col min-h-0 full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800  max-h-full overflow-hidden"
      >
        <SheetHeader className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Track changes and updates history</p>
            </div>
          </div>
        </SheetHeader>

        <ActivityLogFilters
          searchQuery={searchQuery}
          actionFilter={actionFilter}
          type={type}
          onSearchChange={setSearchQuery}
          onActionChange={setActionFilter}
        />

        <ScrollArea className="flex-1 min-h-0 px-4" aria-label="Activity log list">
          <div className="py-3 space-y-4">
            {isLoading ? (
              <ActivityLogSkeletonList />
            ) : filteredActivities.length === 0 ? (
              <ActivityLogEmptyState hasFiltersApplied={hasFiltersApplied} onReset={handleResetFilters} />
            ) : (
              <div className="space-y-6">
                {groupedActivities.map(({ label, items }) => (
                  <div key={label} className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                      {label}
                    </h4>
                    <div className="space-y-3">
                      {items.map((activity: UnifiedActivityLog) => (
                        <ActivityLogCard
                          key={activity._id}
                          activity={activity}
                          type={type}
                          implementingOffice={implementingOffice}
                          accentColorValue={accentColorValue}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pb-28" />
              </div>
            )}
          </div>
        </ScrollArea>

        {hasMoreToLoad && filteredActivities.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              size="sm"
              className="w-full gap-1.5 h-8 text-xs"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-3 h-3 rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Load More</>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function groupActivitiesByMonth(activities: UnifiedActivityLog[]) {
  const buckets: Record<string, UnifiedActivityLog[]> = {};
  const order: string[] = [];

  activities.forEach((activity) => {
    const monthYear = new Date(activity.timestamp).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!buckets[monthYear]) {
      buckets[monthYear] = [];
      order.push(monthYear);
    }

    buckets[monthYear].push(activity);
  });

  return order.map((label) => ({ label, items: buckets[label] }));
}
