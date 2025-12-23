// app/dashboard/budget/[particularId]/[projectId]/components/FinancialBreakdownCard.tsx

"use client";

import { useState } from "react";
import { TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Doc } from "@/convex/_generated/dataModel";

interface FinancialBreakdownCardProps {
  breakdown: Doc<"govtProjectBreakdowns">;
  project: Doc<"projects">;
}

export function FinancialBreakdownCard({ breakdown, project }: FinancialBreakdownCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Use breakdown data
  const description = breakdown.projectTitle || breakdown.projectName;
  const appropriation = breakdown.allocatedBudget || 0;
  const obligation = breakdown.budgetUtilized || 0;
  const balance = breakdown.balance || 0;
  const utilizationRate = breakdown.utilizationRate?.toFixed(2) || "0.00";
  
  // Calculate percentages
  const obligatedPercentage = appropriation > 0 
    ? ((obligation / appropriation) * 100).toFixed(1) 
    : "0.0";
  const remainingPercentage = appropriation > 0 
    ? ((balance / appropriation) * 100).toFixed(1) 
    : "0.0";

  return (
    <Card className="group relative overflow-hidden border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardContent className="space-y-4 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {description}
        </p>

        {/* Financial Details */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Appropriation
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ₱{appropriation.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Obligation
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ₱{obligation.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Balance
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ₱{balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Utilization Rate
            </p>
            <div className="flex items-center gap-3">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {utilizationRate}%
              </p>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(Number(utilizationRate), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Obligated: {obligatedPercentage}%</span>
          </div>

          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>Remaining: {remainingPercentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}