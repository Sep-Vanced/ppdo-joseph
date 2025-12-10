// components/tabs/RemarksContent.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Remark } from "../../../../types" // Assuming original path for Remark
import { getRemarksByProject } from "../../data" // Assuming original path for data function
import { formatDateShort, formatDateDetailed } from "../utils"
import { type RemarksContentProps } from "../types"

export const RemarksContent: React.FC<RemarksContentProps> = ({ projectId }) => {
  // Using mock data here, in production this would likely be fetched with a hook
  const [remarks, setRemarks] = useState<Remark[]>(getRemarksByProject(projectId)) 
  const [isAdding, setIsAdding] = useState(false)
  const [newRemarkContent, setNewRemarkContent] = useState("")
  // Mock current user
  const [currentUser] = useState("Current User") 
  const [currentUserRole] = useState("Project Lead")

  const handleAddRemark = () => {
    if (newRemarkContent.trim()) {
      const now = new Date()
      const newRemark: Remark = {
        id: `rem-${Date.now()}`,
        projectId: projectId,
        content: newRemarkContent,
        createdBy: currentUser,
        createdAt: now,
        updatedBy: currentUser,
        updatedAt: now,
        authorRole: currentUserRole, // Adding role for display
      }
      setRemarks([newRemark, ...remarks])
      setNewRemarkContent("")
      setIsAdding(false)
    }
  }

  // NOTE: The original code used a mock `RemarkItem` structure in the mock data 
  // but a different `Remark` structure in the `RemarksContent` component. 
  // For maintainability, I assume the `Remark` type from `../../../types` is the source of truth, 
  // which contains `createdBy` and `createdAt` (Date objects) instead of `author` and `date` (strings). 
  // I will use the `createdBy`/`createdAt` properties for display, and rely on the imported `Remark` type.

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Remarks</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Documentation and updates ({remarks.length})
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-[#15803D] hover:bg-[#166534] text-white">
            Add Remark
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Remark
          </Label>
          <Textarea 
            value={newRemarkContent} 
            onChange={(e) => setNewRemarkContent(e.target.value)} 
            className="w-full resize-none" 
            rows={4} 
            placeholder="Enter your remark here..." 
          />
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={handleAddRemark} 
              disabled={!newRemarkContent.trim()} 
              className="bg-[#15803D] hover:bg-[#166534] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save Remark
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { 
                setIsAdding(false) 
                setNewRemarkContent("") 
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {remarks.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" > 
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> 
            </svg>
            <p className="text-sm">No remarks yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1"> Add your first remark to get started </p>
          </div>
        ) : (
          remarks.map((remark) => (
            <div 
              key={remark.id} 
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Assuming the original remark structure is in use: */}
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-medium">
                      {remark.createdBy.charAt(0).toUpperCase()} 
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {remark.createdBy}
                      </p>
                      {/* Using the utility formatter */}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created {formatDateShort(remark.createdAt)} 
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Priority Badge */}
                {/* Note: In the original mock data, there was a priority field. 
                   I'm adding a badge here as a best-practice assumption to show 
                   data related to the mock RemarkItem, though the final component 
                   in the original code did not render it. If Remark type has 
                   priority, this would be a good addition for maintainability. 
                   Since I can't be sure, I will stick to what the original code 
                   rendered for safety, which is just the author and date. 
                   However, the code below is a faithful reconstruction of 
                   the original code's rendering loop. */}
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line mb-3">
                {remark.content}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                Last updated: {formatDateDetailed(remark.updatedAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}