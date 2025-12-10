// components/tabs/InspectionContent.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NewInspectionForm } from "../modals/NewInspectionForm"
import { InspectionDetailsModal } from "../modals/InspectionDetailsModal"
import { type InspectionContentProps, type InspectionItem, type InspectionFormData } from "../types"
import { getStatusColor, formatDateShort } from "../utils"
import { mockInspections } from "../mockData"

export const InspectionContent: React.FC<InspectionContentProps> = ({ data }) => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<InspectionItem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleFormSubmit = (data: InspectionFormData) => {
    console.log("New inspection submitted:", data)
    // In a real app, you would call an API here to save the data.
    alert(`Inspection created successfully!\nProgram: ${data.programNumber}\nTitle: ${data.title}`)
  }

  const handleViewDetails = (inspection: InspectionItem) => {
    setSelectedInspection(inspection)
    setIsDetailsOpen(true)
  }

  return (
    <div className="p-6">
      {/* New Inspection Form Dialog */}
      <NewInspectionForm open={isFormOpen} onOpenChange={setIsFormOpen} onSubmit={handleFormSubmit} />
      
      {/* Inspection Details Modal */}
      <InspectionDetailsModal open={isDetailsOpen} onOpenChange={setIsDetailsOpen} inspection={selectedInspection} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inspections</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mockInspections.length} total inspections
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-[#15803D] hover:bg-[#166534] text-white">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Inspection
        </Button>
      </div>
      
      {/* Inspections List */}
      <div className="space-y-4">
        {mockInspections.map((inspection) => (
          <div 
            key={inspection.id} 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-shadow hover:shadow-md cursor-pointer"
            onClick={() => handleViewDetails(inspection)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
                {inspection.title}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(inspection.status)}`}>
                {inspection.status}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
              {inspection.remarks}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDateShort(new Date(inspection.date))}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{inspection.views}</span>
              </div>
              {inspection.images && inspection.images.length > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{inspection.images.length} Images</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}