// components/modals/InspectionDetailsModal.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { type InspectionDetailsModalProps } from "../types"
import { getStatusColor } from "../utils"

export const InspectionDetailsModal: React.FC<InspectionDetailsModalProps> = ({ open, onOpenChange, inspection }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!inspection) return null

  const openImage = (url: string, index: number) => {
    setSelectedImage(url)
    setCurrentImageIndex(index)
  }

  const closeImage = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction: "next" | "prev") => {
    if (!inspection.images || inspection.images.length < 2) return
    const len = inspection.images.length
    
    let newIndex: number
    if (direction === "next") {
      newIndex = (currentImageIndex + 1) % len
    } else {
      newIndex = (currentImageIndex - 1 + len) % len
    }

    setCurrentImageIndex(newIndex)
    setSelectedImage(inspection.images[newIndex])
  }

  // Determine status color using the utility
  const statusClasses = getStatusColor(inspection.status)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {inspection.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Program Number: {inspection.programNumber} • {inspection.date}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses}`}>
                {inspection.status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{inspection.category}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">• {inspection.views}</span>
            </div>

            {/* Images Gallery */}
            {inspection.images && inspection.images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {inspection.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer overflow-hidden rounded-lg group aspect-video"
                      onClick={() => openImage(image, index)}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Inspection ${index + 1}`}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Remarks</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {inspection.remarks}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button className="bg-[#15803D] hover:bg-[#166534] text-white">
                Edit Inspection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Modal - No style or logic changes */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center p-4"
          onClick={closeImage}
        >
          <button
            onClick={closeImage}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {inspection.images && inspection.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateImage("prev")
                }}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateImage("next")
                }}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Fullscreen view"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {inspection.images?.length || 0}
            </div>
          </div>
        </div>
      )}
    </>
  )
}