import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityLogType } from "./types";

type ActivityLogFiltersProps = {
  searchQuery: string;
  actionFilter: string;
  type: ActivityLogType;
  onSearchChange: (value: string) => void;
  onActionChange: (value: string) => void;
};

export function ActivityLogFilters({
  searchQuery,
  actionFilter,
  type,
  onSearchChange,
  onActionChange,
}: ActivityLogFiltersProps) {
  return (
    <div className="p-3 space-y-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search activity logs"
            className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-8 text-xs"
          />
        </div>
        <Select value={actionFilter} onValueChange={onActionChange}>
          <SelectTrigger className="w-[120px] h-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs">
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
  );
}
