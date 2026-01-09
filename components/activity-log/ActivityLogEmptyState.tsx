import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActivityLogEmptyStateProps = {
  hasFiltersApplied: boolean;
  onReset?: () => void;
};

export function ActivityLogEmptyState({ hasFiltersApplied, onReset }: ActivityLogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
        <Filter className="w-6 h-6 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No activities found</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px]">
        {hasFiltersApplied
          ? "Try adjusting your search or filters."
          : "There are no recorded activities yet."}
      </p>
      {hasFiltersApplied && onReset && (
        <Button
          variant="link"
          size="sm"
          onClick={onReset}
          className="text-blue-500"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
