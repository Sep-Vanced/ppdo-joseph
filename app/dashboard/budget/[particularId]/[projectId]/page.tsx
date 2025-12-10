// app/dashboard/budget/[particularId]/[projectId]/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { FinancialBreakdownTable } from "./components/FinancialBreakdownTable"
import { getFinancialBreakdownByProject, getProjectById } from "./data"
import type { FinancialBreakdownItem, Project } from "../../types"
import { getParticularFullName } from "../data"
import { updateItemInHierarchy, deleteItemFromHierarchy, addItemToHierarchy } from "./utils"
import { FinancialBreakdownCard } from "./components/FinancialBreakdownCard"
import { FinancialBreakdownTabs } from "./components/FinancialBreakdownTabs"

export default function ProjectFinancialBreakdownPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [financialBreakdown, setFinancialBreakdown] = useState<FinancialBreakdownItem[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [particular, setParticular] = useState<string>("")
  const router = useRouter()
  const params = useParams()

  // Extract projectId from params
  const projectId = params.projectId as string
  const particularId = params.particularId as string

  useEffect(() => {
    // Load project data when params are available
    if (projectId && particularId) {
      const projectData = getProjectById(projectId, particularId)
      setProject(projectData)
      setParticular(particularId)
      
      const breakdown = getFinancialBreakdownByProject(projectId)
      setFinancialBreakdown(breakdown)
    }
  }, [projectId, particularId])

  const handleAdd = (item: Omit<FinancialBreakdownItem, "id" | "children">) => {
    // In production, call API
    // For now, add to root level (parentId: null)
    setFinancialBreakdown(addItemToHierarchy(financialBreakdown, null, item))
  }

  const handleEdit = (id: string, item: Omit<FinancialBreakdownItem, "id" | "children">) => {
    // In production, call API
    setFinancialBreakdown(updateItemInHierarchy(financialBreakdown, id, item))
  }

  const handleDelete = (id: string) => {
    // In production, call API
    setFinancialBreakdown(deleteItemFromHierarchy(financialBreakdown, id))
  }

  const particularFullName = getParticularFullName(particular)

  return (
    <>
      {/* Back Button and Page Header */}
      <div className="mb-6 no-print">
        <Link
          href={`/dashboard/budget/${encodeURIComponent(particular)}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {particularFullName}
        </Link>

        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {project?.projectName || "Project Financial Breakdown"}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {particularFullName} - Balances as of{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* User Card - 1 column on large screens */}
        <div className="lg:col-span-1">
          <FinancialBreakdownCard />
        </div>

        {/* Financial Breakdown Table - 3 columns on large screens */}
        <div className="lg:col-span-3">
          <FinancialBreakdownTabs projectId={projectId} />
        </div>
      </div>
    </>
  )
}