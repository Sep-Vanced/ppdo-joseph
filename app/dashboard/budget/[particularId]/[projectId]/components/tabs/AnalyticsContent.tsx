// components/tabs/AnalyticsContent.tsx

import type React from "react"
import { type BarChartItemProps } from "../types"

const BarChartItem: React.FC<BarChartItemProps> = ({ label, value, color, isDashed = false }) => (
  <div className="flex flex-col items-center mx-2 h-full justify-end">
    <div 
      className={`w-6 rounded-t-md transition-all duration-500 ease-out ${color} ${isDashed ? "border-2 border-dashed border-gray-400 bg-transparent" : ""}`} 
      style={{ height: `${value}%` }} 
    ></div>
    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-semibold">{label}</div>
  </div>
)

export const AnalyticsContent: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Utilization & Trend Analysis</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Budget Utilization Chart */}
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg h-96 flex flex-col justify-center items-center bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Budget vs. Utilization (YTD)</h3>
        <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-end p-4">
          <BarChartItem label="Approp." value={85} color="bg-blue-500" />
          <BarChartItem label="Oblig." value={65} color="bg-[#15803D]" />
          <BarChartItem label="Balance" value={20} color="bg-green-500" />
          <BarChartItem label="Target" value={75} color="bg-gray-400" isDashed={true} />
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Appropriation
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-[#15803D] mr-2"></span> Obligation
          </div>
        </div>
      </div>
      
      {/* Expenditure Breakdown Chart (Placeholder) */}
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg h-96 flex flex-col justify-center items-center bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Expenditure Breakdown</h3>
        <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-400">
          75%
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Personnel (25%)
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span> Maintenance (25%)
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-teal-500 mr-2"></span> Capital (25%)
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span> Transfers (25%)
          </div>
        </div>
      </div>
    </div>
  </div>
)