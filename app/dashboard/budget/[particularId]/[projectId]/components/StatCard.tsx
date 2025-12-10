// components/components/StatCard.tsx

import type React from "react"
import { type StatCardProps } from "./types" // Import local type

export const StatCard: React.FC<StatCardProps> = ({ label, amount }) => {
  const formattedAmount = amount.toLocaleString("en-US", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })

  return (
    <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        ₱{formattedAmount}
      </p>
    </div>
  )
}