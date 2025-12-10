// components/types.ts

import { type ReactNode } from "react"
// Assuming `Remark` is imported from "../../../types"

// Core Data Structures
export interface FinancialBreakdownItem {
  id: string
  code?: string
  description: string
  appropriation: number
  obligation: number
  balance: number
  level: number
  children?: FinancialBreakdownItem[]
}

export interface InspectionItem {
  id: string
  programNumber: string
  title: string
  category: string
  date: string
  remarks: string
  status: string // "Completed", "In Progress", "Pending", etc.
  images: string[]
  views: string
}

export interface InspectionFormData {
  programNumber: string
  title: string
  date: string
  remarks: string
  images: File[]
}

export interface RemarkItem {
  id: string
  author: string
  authorRole: string
  date: string
  content: string
  category: string
  priority: "Low" | "Medium" | "High"
}


// Component Props
export interface FinancialBreakdownTabsProps {
  projectId: string
}

export interface CardProps {
  children: ReactNode
  className?: string
}

export interface StatCardProps {
  label: string
  amount: number
}

export interface TransactionCardProps {
  amount: number
  name: string
  email: string
  type: string
}

export interface StatItem {
  label: string
  amount: number
}

export interface BarChartItemProps {
  label: string
  value: number
  color: string
  isDashed?: boolean
}

export interface OverviewContentProps {
  stats: StatItem[]
  transactions: TransactionCardProps[]
}

export interface InspectionContentProps {
  data: FinancialBreakdownItem[]
}

export interface RemarksContentProps {
  projectId: string
}

export interface NewInspectionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: InspectionFormData) => void
}

export interface InspectionDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inspection: InspectionItem | null
}