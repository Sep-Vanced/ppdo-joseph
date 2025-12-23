// app/dashboard/budget/[particularId]/[projectbreakdownId]/[projectId]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft } from "lucide-react";
import { FinancialBreakdownCard } from "./components/FinancialBreakdownCard";
import { FinancialBreakdownTabs } from "./components/FinancialBreakdownTabs";

// 🔧 Helper: Extract actual ID from slug
const extractId = (slugWithId: string): string => {
  const parts = slugWithId.split('-');
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part.length > 15 && /^[a-z0-9]+$/i.test(part)) {
      return part;
    }
  }
  return parts[parts.length - 1];
};

export default function BreakdownDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Extract IDs from URL
  const particularId = params.particularId as string;
  const projectbreakdownId = params.projectbreakdownId as string;
  const breakdownSlug = params.projectId as string; // This is actually breakdown slug!
  
  // 🔧 CRITICAL: Extract breakdown ID from the slug
  const breakdownId = extractId(breakdownSlug) as Id<"govtProjectBreakdowns">;
  
  // Fetch the breakdown first
  const breakdown = useQuery(
    api.govtProjects.getProjectBreakdown,
    { breakdownId }
  );
  
  // Then fetch the parent project using the breakdown's projectId
  const project = useQuery(
    api.projects.get,
    breakdown?.projectId ? { id: breakdown.projectId as Id<"projects"> } : "skip"
  );

  const handleBack = () => {
    router.push(`/dashboard/budget/${particularId}/${projectbreakdownId}`);
  };

  if (!breakdown || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="lg:col-span-3 h-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure projectId exists before passing to tabs
  const validProjectId = breakdown.projectId || project._id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Breakdown List</span>
        </button>

        {/* Header */}
        <div className="space-y-2">
          <h1
            className="text-4xl font-bold text-gray-900 dark:text-gray-100"
            style={{ fontFamily: "Cinzel, serif" }}
          >
            {breakdown.projectTitle || breakdown.projectName || "Breakdown Details"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {breakdown.implementingOffice && (
              <span className="font-medium">{breakdown.implementingOffice} • </span>
            )}
            Part of: {project.particulars}
          </p>
        </div>

        {/* Layout Grid - Tabs Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Card - Financial Stats */}
          <div className="lg:col-span-1">
            <FinancialBreakdownCard 
              breakdown={breakdown}
              project={project}
            />
          </div>

          {/* Right Side - Tabs (Overview, Analytics, etc.) */}
          <div className="lg:col-span-3">
            <FinancialBreakdownTabs 
              projectId={validProjectId}
              breakdown={breakdown}
              project={project}
            />
          </div>
        </div>

        {/* Parent Project Info - Moved to bottom for reference */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Parent Project Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Project</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {project.particulars}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Office</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {project.implementingOffice}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                ₱{project.totalBudgetAllocated.toLocaleString("en-PH")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}