import { Skeleton } from "@/components/ui/skeleton";

export function ActivityLogSkeletonList() {
  return (
    <div className="py-6 space-y-5">
      {[1, 2, 3].map((item) => (
        <div key={item} className="relative pl-6">
          <div className="absolute left-1 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-300 dark:bg-zinc-700" />
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-white/60 dark:bg-zinc-900/60">
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
