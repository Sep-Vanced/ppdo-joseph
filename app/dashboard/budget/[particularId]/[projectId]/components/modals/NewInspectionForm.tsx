// components/modals/NewInspectionForm.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type InspectionFormData, type NewInspectionFormProps } from "../types"

const getDefaultDate = () => new Date().toISOString().split('T')[0]

export const NewInspectionForm: React.FC<NewInspectionFormProps> = ({ open, onOpenChange, onSubmit }) => {
  const [formData, setFormData] = useState<InspectionFormData>({
    programNumber: "",
    title: "",
    date: getDefaultDate(),
    remarks: "",
    images: []
  })

  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Update formData with new File objects
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    // Revoke the URL and remove preview
    URL.revokeObjectURL(imagePreviews[index])
    setImagePreviews(prev => prev.filter((_, i) => i !== index))

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const resetForm = () => {
    // Clean up preview URLs
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImagePreviews([])
    
    // Reset form data
    setFormData({
      programNumber: "",
      title: "",
      date: getDefaultDate(),
      remarks: "",
      images: []
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            New Inspection
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Fill in the details for the new inspection report. All fields are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Form Fields: Program Number, Title, Date, Remarks */}
          {/* ... (The existing form layout and inputs are preserved) ... */}

          <div className="space-y-2">
            <Label htmlFor="programNumber" className="text-sm font-medium">Program Number</Label>
            <Input id="programNumber" name="programNumber" type="text" placeholder="e.g., 12" value={formData.programNumber} onChange={handleInputChange} required className="w-full" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Inspection Title</Label>
            <Input id="title" name="title" type="text" placeholder="e.g., Community Women Empowerment Workshop" value={formData.title} onChange={handleInputChange} required className="w-full" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">Inspection Date</Label>
            <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required className="w-full" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium">Remarks</Label>
            <Textarea id="remarks" name="remarks" placeholder="Enter detailed remarks about the inspection..." value={formData.remarks} onChange={handleInputChange} required rows={5} className="w-full resize-none" />
          </div>

          {/* Image Upload Area (Preserved original styles and logic) */}
          <div className="space-y-2">
            <Label htmlFor="images" className="text-sm font-medium">Upload Images</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#15803D] transition-colors">
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="images"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload images or drag and drop
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  PNG, JPG, JPEG up to 10MB
                </span>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#15803D] hover:bg-[#166534] text-white"
            >
              Create Inspection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}