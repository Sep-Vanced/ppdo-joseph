import { formatDistanceToNow } from "date-fns";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UnifiedActivityLog, ActivityLogType } from "./types";

type ActivityLogCardProps = {
  activity: UnifiedActivityLog;
  type: ActivityLogType;
  implementingOffice?: string;
  accentColorValue: string;
};

const trackedFieldsByType: Record<ActivityLogType, string[]> = {
  breakdown: ["allocatedBudget", "status", "projectAccomplishment", "remarks"],
  project: ["totalBudgetAllocated", "targetDateCompletion", "remarks", "implementingOffice"],
  budget: ["totalBudgetAllocated", "particulars", "year", "notes"],
};

export function ActivityLogCard({
  activity,
  type,
  implementingOffice,
  accentColorValue,
}: ActivityLogCardProps) {
  const timestamp = new Date(activity.timestamp);
  const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });
  const changeRows = buildChangeRows(activity, type);
  const isBulkImport = activity.action === "bulk_created";
  const bulletColor = accentColorValue || "#0f172a";

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
      <div
        className="absolute left-[3px] top-2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-950"
        style={{ backgroundColor: `${bulletColor}cc` }}
      />
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 bg-white/80 dark:bg-zinc-900/70">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {timestamp.toLocaleTimeString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{relativeTime}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Avatar className="w-5 h-5 border border-zinc-200 dark:border-zinc-700">
                <AvatarImage src="" />
                <AvatarFallback className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {getInitials(activity.performedByName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-zinc-700 dark:text-zinc-300">
                {activity.performedByName}
              </span>
            </div>
          </div>
          <div>{getActionBadge(activity.action)}</div>
        </div>

        <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
          {isBulkImport ? (
            <p>
              Imported <strong>{getImportedCount(activity.newValues)}</strong> records via Excel.
            </p>
          ) : (
            <>
              <p>
                {type === "breakdown" ? (
                  <>Processed breakdown for <strong>{implementingOffice}</strong></>
                ) : type === "project" ? (
                  <>Processed project <strong>{activity.particulars}</strong></>
                ) : (
                  <>Processed budget item <strong>{activity.particulars}</strong></>
                )}
              </p>
              {activity.reason && (
                <p className="italic text-zinc-500 dark:text-zinc-500">"{activity.reason}"</p>
              )}
              {activity.action === "updated" && changeRows.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-700 mt-1.5">
                  {changeRows.map((row) => (
                    <div
                      key={row.key}
                      className="text-[11px] grid grid-cols-[1fr,auto,1fr] gap-1 items-center group"
                    >
                      <span className="text-zinc-500 truncate text-right capitalize group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                        {row.label}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-zinc-300 shrink-0" />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getActionBadge(action: string) {
  switch (action) {
    case "created":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Created</Badge>
      );
    case "updated":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Updated</Badge>
      );
    case "deleted":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Deleted</Badge>;
    case "restored":
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Restored</Badge>
      );
    case "bulk_created":
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">
          <FileSpreadsheet className="w-3 h-3 mr-1" /> Import
        </Badge>
      );
    case "bulk_updated":
      return (
        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
          <FileSpreadsheet className="w-3 h-3 mr-1" /> Bulk Edit
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="capitalize">
          {action.replace("_", " ")}
        </Badge>
      );
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((piece) => piece[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function buildChangeRows(activity: UnifiedActivityLog, type: ActivityLogType) {
  if (!activity.previousValues || !activity.newValues) return [];

  try {
    const previous = JSON.parse(activity.previousValues);
    const current = JSON.parse(activity.newValues);
    const trackedFields = trackedFieldsByType[type];
    const changes = trackedFields.filter((key) => previous[key] !== current[key]);

    return changes.map((key) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").trim(),
      value:
        typeof current[key] === "number" && (key.includes("Budget") || key.includes("Allocated"))
          ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(current[key])
          : String(current[key] || "Empty"),
    }));
  } catch (error) {
    return [];
  }
}

function getImportedCount(payload?: string) {
  try {
    const parsed = JSON.parse(payload || "[]");
    return Array.isArray(parsed) ? parsed.length || "multiple" : "multiple";
  } catch (error) {
    return "multiple";
  }
}
