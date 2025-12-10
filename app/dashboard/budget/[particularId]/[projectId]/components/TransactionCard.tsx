// components/components/TransactionCard.tsx

import type React from "react"
import { type TransactionCardProps } from "./types" // Import local type

export const TransactionCard: React.FC<TransactionCardProps> = ({ amount, name, email, type }) => {
  const formattedAmount = amount.toLocaleString("en-US", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0 break-words">
            ₱{formattedAmount}
          </p>
          <p className="text-xs text-white font-semibold mt-2 px-2 py-0.5 rounded-full bg-[#15803D] inline-block w-fit">
            {type}
          </p>
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{email}</p>
        </div>
      </div>
    </div>
  )
}