// app/dashboard/budget/[particularId]/[projectId]/components/FinancialBreakdownTabs.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { Id, Doc } from "@/convex/_generated/dataModel"
import { OverviewContent } from "./tabs/OverviewContent"
import { AnalyticsContent } from "./tabs/AnalyticsContent"
import { InspectionContent } from "./tabs/InspectionContent"
import { RemarksContent } from "./tabs/RemarksContent"
import { mockFinancialBreakdown } from "./mockData"
import { Card } from "./Card"

interface FinancialBreakdownTabsProps {
  projectId: Id<"projects">;
  breakdown: Doc<"govtProjectBreakdowns">;
  project: Doc<"projects">;
}

const ReportContent: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Report Content Placeholder</h2>
      <p className="text-gray-700 dark:text-gray-300">
        Report data summary and key recommendations would be displayed here.
      </p>
    </div>
  )
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "inspection", label: "Inspections" },
  { id: "remarks", label: "Remarks" },
  { id: "report", label: "Report" },
]

export const FinancialBreakdownTabs: React.FC<FinancialBreakdownTabsProps> = ({ 
  projectId,
  breakdown, 
  project 
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewContent projectId={projectId} />
      case "analytics":
        return <AnalyticsContent />
      case "inspection":
        return <InspectionContent data={mockFinancialBreakdown} projectId={projectId} />
      case "remarks":
        return <RemarksContent projectId={projectId} /> 
      case "report":
        return <ReportContent />
      default:
        return <InspectionContent data={mockFinancialBreakdown} projectId={projectId} />
    }
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-all relative
                            ${
                              activeTab === tab.id
                                ? "text-[#15803D] dark:text-[#15803D] bg-white dark:bg-gray-900"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#15803D]"></div>}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="pt-0">
        {renderContent()}
      </div>
    </Card>
  )
}