"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Folder, Calendar } from "lucide-react";
import AccessDeniedPage from "@/components/AccessDeniedPage";
import { LoadingState, useBudgetAccess, useBudgetData } from "@/components/budget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccentColor } from "@/contexts/AccentColorContext";

export default function ProjectDashboardLanding() {
  const router = useRouter();
  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useBudgetAccess();
  const { budgetItems, isLoading: isLoadingData } = useBudgetData();
  const { accentColorValue } = useAccentColor();

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const item of budgetItems) {
      if (typeof item.year === "number") set.add(item.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [budgetItems]);

  const handleOpenYear = (year: number) => {
    try {
      localStorage.setItem("budget_selected_year", String(year));
    } catch (_) {
      // Ignore storage failures; user can still filter manually
    }
    router.push("/dashboard/project/budget/");
  };

  if (isLoadingAccess || isLoadingData) {
    return <LoadingState message="Loading available years..." />;
  }

  if (!canAccess) {
    return (
      <AccessDeniedPage
        userName={accessCheck?.user?.name || ""}
        userEmail={accessCheck?.user?.email || ""}
        departmentName={accessCheck?.department?.name || "Not Assigned"}
        pageRequested="Project Budget"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Budget Years</h1>
        <div className="flex items-center gap-2">
          {years.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => handleOpenYear(years[0])}>
              Open Latest
            </Button>
          )}
          <button
            onClick={() => {
              try {
                localStorage.setItem("budget_open_add", "true");
              } catch (_) {}
              router.push("/dashboard/project/budget/");
            }}
            className="cursor-pointer px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md text-white"
            style={{ backgroundColor: accentColorValue }}
            title="Create a new budget item"
          >
            New Item Here
          </button>
        </div>
      </div>

      {years.length === 0 ? (
        <div className="min-h-[300px] flex items-center justify-center text-zinc-600 dark:text-zinc-400">
          No budget data available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {years.map((year) => (
            <Card key={year} className="group relative transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-amber-400">
              <button
                onClick={() => handleOpenYear(year)}
                className="w-full text-left"
                aria-label={`Open budget for year ${year}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Year
                      </div>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {year}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-amber-300/40 to-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
