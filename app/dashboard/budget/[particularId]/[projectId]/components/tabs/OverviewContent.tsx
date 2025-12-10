// components/tabs/OverviewContent.tsx

import type React from "react"
import { type OverviewContentProps } from "../types"
import { StatCard } from "../StatCard"
import { TransactionCard } from "../TransactionCard"

export const OverviewContent: React.FC<OverviewContentProps> = ({ stats, transactions }) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Financial Snapshot</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} label={stat.label} amount={stat.amount} />
      ))}
    </div>
    
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Obligations</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {transactions.map((transaction, index) => (
        <TransactionCard 
          key={index} 
          amount={transaction.amount} 
          name={transaction.name} 
          email={transaction.email} 
          type={transaction.type} 
        />
      ))}
    </div>
  </div>
)