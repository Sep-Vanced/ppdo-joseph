// app/dashboard/budget/[particularId]/[projectId]/components/FinancialBreakdownTabs.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type React from "react"
import { useState, type ReactNode } from "react"
import { Remark } from "../../../types"
import { getRemarksByProject } from "../data"

// --- Interfaces & Types ---
interface FinancialBreakdownItem {
  id: string
  code?: string
  description: string
  appropriation: number
  obligation: number
  balance: number
  level: number
  children?: FinancialBreakdownItem[]
}

interface FinancialBreakdownTabsProps {
  projectId: string
}

interface StatCardProps {
  label: string
  amount: number
}

interface TransactionCardProps {
  amount: number
  name: string
  email: string
  type: string
}

interface StatItem {
  label: string
  amount: number
}

interface CardProps {
  children: ReactNode
  className?: string
}

interface BarChartItemProps {
  label: string
  value: number
  color: string
  isDashed?: boolean
}

interface OverviewContentProps {
  stats: StatItem[]
  transactions: TransactionCardProps[]
}

interface InspectionContentProps {
  data: FinancialBreakdownItem[]
}

interface InspectionItem {
  id: string
  programNumber: string
  title: string
  category: string
  date: string
  remarks: string
  status: string
  images: string[]
  views: string
}

interface NewInspectionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: InspectionFormData) => void
}

interface InspectionDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inspection: InspectionItem | null
}

interface InspectionFormData {
  programNumber: string
  title: string
  date: string
  remarks: string
  images: File[]
}

interface RemarkItem {
  id: string
  author: string
  authorRole: string
  date: string
  content: string
  category: string
  priority: "Low" | "Medium" | "High"
}

interface RemarksContentProps {
  projectId: string
}

// --- Utility Components ---
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-900 ${className}`}>{children}</div>
)

const StatCard: React.FC<StatCardProps> = ({ label, amount }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        ₱{amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

const TransactionCard: React.FC<TransactionCardProps> = ({ amount, name, email, type }) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0 break-words">
            ₱{amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

// --- Inspection Details Modal ---
const InspectionDetailsModal: React.FC<InspectionDetailsModalProps> = ({ open, onOpenChange, inspection }) => {
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
    if (!inspection.images) return
    
    if (direction === "next") {
      const newIndex = (currentImageIndex + 1) % inspection.images.length
      setCurrentImageIndex(newIndex)
      setSelectedImage(inspection.images[newIndex])
    } else {
      const newIndex = (currentImageIndex - 1 + inspection.images.length) % inspection.images.length
      setCurrentImageIndex(newIndex)
      setSelectedImage(inspection.images[newIndex])
    }
  }

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
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                inspection.status === "Completed" 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : inspection.status === "In Progress"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }`}>
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

      {/* Fullscreen Image Modal */}
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

// --- New Inspection Form Component ---
const NewInspectionForm: React.FC<NewInspectionFormProps> = ({ open, onOpenChange, onSubmit }) => {
  const [formData, setFormData] = useState<InspectionFormData>({
    programNumber: "",
    title: "",
    date: new Date().toISOString().split('T')[0],
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
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    
    // Revoke the URL and remove preview
    URL.revokeObjectURL(imagePreviews[index])
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    
    // Reset form
    setFormData({
      programNumber: "",
      title: "",
      date: new Date().toISOString().split('T')[0],
      remarks: "",
      images: []
    })
    
    // Clean up preview URLs
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImagePreviews([])
    
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
          {/* Program Number */}
          <div className="space-y-2">
            <Label htmlFor="programNumber" className="text-sm font-medium">
              Program Number
            </Label>
            <Input
              id="programNumber"
              name="programNumber"
              type="text"
              placeholder="e.g., 12"
              value={formData.programNumber}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Inspection Title
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="e.g., Community Women Empowerment Workshop"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Inspection Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium">
              Remarks
            </Label>
            <Textarea
              id="remarks"
              name="remarks"
              placeholder="Enter detailed remarks about the inspection..."
              value={formData.remarks}
              onChange={handleInputChange}
              required
              rows={5}
              className="w-full resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="images" className="text-sm font-medium">
              Upload Images
            </Label>
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
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
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
              onClick={() => onOpenChange(false)}
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

// --- Mock Data ---
const mockFinancialBreakdown: FinancialBreakdownItem[] = [
  {
    id: "a",
    code: "A",
    description: "Crime Prevention and law enforcement activities",
    appropriation: 10200000,
    obligation: 950000,
    balance: 9250000,
    level: 0,
    children: [
      {
        id: "a1",
        code: "A.1",
        description: "Provision of equipage, supplies and materials...",
        appropriation: 5200000,
        obligation: 0,
        balance: 5200000,
        level: 1,
      },
      {
        id: "a2",
        code: "A.2",
        description: "Provision of fuel, oil and lubricants...",
        appropriation: 3000000,
        obligation: 950000,
        balance: 2050000,
        level: 1,
      },
    ],
  },
  {
    id: "b",
    code: "B",
    description: "Aid and/or capability development/trainings...",
    appropriation: 13835000,
    obligation: 5551645.23,
    balance: 8283354.77,
    level: 0,
    children: [
      {
        id: "b1",
        code: "B.1",
        description: "Providing subsidy and equipage for personnel...",
        appropriation: 4035000,
        obligation: 0,
        balance: 4035000,
        level: 1,
      },
      {
        id: "b2",
        code: "B.2",
        description: "Grants, subsidies and contribution to LEA",
        appropriation: 3450000,
        obligation: 1885040,
        balance: 1564960,
        level: 1,
      },
    ],
  },
  {
    id: "c",
    code: "C",
    description: "Program for anti-illegal drug, illegal gambling...",
    appropriation: 105820000,
    obligation: 85110003.49,
    balance: 20709996.51,
    level: 0,
    children: [
      {
        id: "c1",
        code: "C.1",
        description: "Programs against illegal drugs and surrenderers",
        appropriation: 6044657,
        obligation: 1566998.94,
        balance: 4477658.06,
        level: 1,
      },
      {
        id: "c2",
        code: "C.2",
        description: "Support to LGUs for various peace and order programs",
        appropriation: 38848744,
        obligation: 29428400,
        balance: 9420344,
        level: 1,
      },
    ],
  },
]

const mockInspections: InspectionItem[] = [
  {
    id: "1",
    programNumber: "12",
    title: "Community Women Empowerment Workshop - Phase 1",
    category: "Skill Development",
    date: "2024-12-03",
    remarks: "Community engagement activities focused on women's empowerment and development. Participants engaged in various skill-building workshops and collaborative projects aimed at fostering economic independence and social cohesion within the community.\n\nKey achievements:\n- 45 participants trained in entrepreneurship\n- 3 new community businesses established\n- 100% satisfaction rate from participants",
    status: "Completed",
    images: [
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800",
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800",
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
    ],
    views: "1.2K views",
  },
  {
    id: "2",
    programNumber: "08",
    title: "Agricultural Training Program for Rural Communities",
    category: "Economic Development",
    date: "2024-11-28",
    remarks: "Comprehensive agricultural training program focusing on modern farming techniques and sustainable agriculture practices. The program covered crop rotation, organic farming methods, and efficient water management systems.",
    status: "Completed",
    images: [
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800",
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800",
    ],
    views: "856 views",
  },
  {
    id: "3",
    programNumber: "15",
    title: "Youth Leadership Forum 2025",
    category: "Leadership",
    date: "2024-11-21",
    remarks: "Annual youth leadership forum bringing together young leaders from different sectors. The forum included workshops on public speaking, project management, and community organizing.",
    status: "In Progress",
    images: [
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    ],
    views: "2.4K views",
  },
  {
    id: "4",
    programNumber: "22",
    title: "Health and Wellness Program for Seniors",
    category: "Healthcare",
    date: "2024-11-15",
    remarks: "Monthly health screening and wellness program for senior citizens. Includes free medical checkups, health education sessions, and distribution of maintenance medications.",
    status: "Completed",
    images: [],
    views: "1.5K views",
  },
  {
    id: "5",
    programNumber: "19",
    title: "Environmental Conservation Awareness Campaign",
    category: "Environment",
    date: "2024-11-05",
    remarks: "Large-scale environmental awareness campaign focusing on waste management, tree planting, and coastal cleanup activities. Over 200 volunteers participated in the initiative.",
    status: "Completed",
    images: [
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800",
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800",
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800",
    ],
    views: "945 views",
  },
  {
    id: "6",
    programNumber: "31",
    title: "Digital Literacy Program for Seniors",
    category: "Technology",
    date: "2024-10-28",
    remarks: "Training program designed to teach senior citizens basic computer skills, internet navigation, and social media usage. The program aims to bridge the digital divide and keep seniors connected with their families.",
    status: "Pending",
    images: [
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800",
    ],
    views: "1.8K views",
  },
]

const mockRemarks: RemarkItem[] = [
  {
    id: "1",
    author: "Maria Santos",
    authorRole: "Budget Officer",
    date: "2024-12-04",
    content: "The utilization rate for Section A (Crime Prevention) remains critically low at 9.31%. We need to expedite the procurement process for law enforcement equipment to avoid budget realignment at year-end. Suggest coordinating with the procurement office for immediate action.",
    category: "Budget Utilization",
    priority: "High",
  },
  {
    id: "2",
    author: "Juan Dela Cruz",
    authorRole: "Project Manager",
    date: "2024-12-03",
    content: "Community Women Empowerment Workshop Phase 1 exceeded expectations with 45 participants completing the program. Recommend allocating additional budget for Phase 2 expansion to accommodate the waiting list of 30+ applicants.",
    category: "Program Implementation",
    priority: "Medium",
  },
  {
    id: "3",
    author: "Dr. Rosa Martinez",
    authorRole: "Health Program Coordinator",
    date: "2024-12-02",
    content: "The Health and Wellness Program for Seniors has shown remarkable impact. Medical screenings revealed early detection of 12 cases requiring immediate intervention. Request budget augmentation for expanded screening capacity.",
    category: "Healthcare Services",
    priority: "High",
  },
  {
    id: "4",
    author: "Carlos Reyes",
    authorRole: "Finance Analyst",
    date: "2024-12-01",
    content: "Quarterly review indicates strong performance in Section C programs with 80.4% utilization rate. However, Indigency Fund (C.3) shows near-complete depletion at 98.7%. Recommend monitoring for potential additional allocation needs in Q1 2025.",
    category: "Financial Analysis",
    priority: "Medium",
  },
  {
    id: "5",
    author: "Ana Lopez",
    authorRole: "Environmental Officer",
    date: "2024-11-30",
    content: "Environmental Conservation Campaign achieved outstanding community participation with 200+ volunteers. The coastal cleanup collected 2.5 tons of waste. Suggest institutionalizing this as a monthly program with dedicated budget allocation.",
    category: "Environment",
    priority: "Low",
  },
  {
    id: "6",
    author: "Roberto Fernandez",
    authorRole: "IT Coordinator",
    date: "2024-11-28",
    content: "Digital Literacy Program showing slower than expected enrollment. Only 15 of 50 slots filled. Recommend enhanced marketing campaign and partnership with barangay offices to increase senior citizen participation.",
    category: "Technology Programs",
    priority: "Medium",
  },
  {
    id: "7",
    author: "Isabel Cruz",
    authorRole: "Audit Officer",
    date: "2024-11-25",
    content: "Audit findings for Q3 show complete compliance with disbursement procedures. However, noted delays in liquidation reports for 3 projects. Implementing officers reminded of 30-day submission deadline.",
    category: "Audit & Compliance",
    priority: "Low",
  },
  {
    id: "8",
    author: "Miguel Santos",
    authorRole: "Agricultural Extension Officer",
    date: "2024-11-20",
    content: "Agricultural Training Program received excellent feedback from participants. 85% reported implementing at least one new technique learned. Request follow-up training budget for advanced modules in organic farming.",
    category: "Agriculture",
    priority: "Medium",
  },
]

const RemarksContent: React.FC<RemarksContentProps> = ({ projectId }) => {
  const [remarks, setRemarks] = useState<Remark[]>(getRemarksByProject(projectId))
  const [isAdding, setIsAdding] = useState(false)
  const [newRemarkContent, setNewRemarkContent] = useState("")
  const [currentUser] = useState("Current User") // In production, get from auth context

  const handleAddRemark = () => {
    if (newRemarkContent.trim()) {
      const newRemark: Remark = {
        id: `rem-${Date.now()}`,
        projectId: projectId,
        content: newRemarkContent,
        createdBy: currentUser,
        createdAt: new Date(),
        updatedBy: currentUser,
        updatedAt: new Date(),
      }
      setRemarks([newRemark, ...remarks])
      setNewRemarkContent("")
      setIsAdding(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Remarks</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Project notes and updates ({remarks.length})
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-[#15803D] hover:bg-[#166534] text-white"
          >
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
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-sm">No remarks yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Add your first remark to get started
            </p>
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
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-medium">
                      {remark.createdBy.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {remark.createdBy}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created {formatDateShort(remark.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  {remark.createdAt.getTime() !== remark.updatedAt.getTime() && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Updated</span>
                      <span>{formatDate(remark.updatedAt)}</span>
                      <span>by {remark.updatedBy}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {remark.content}
              </p>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formatDate(remark.createdAt)}</span>
                </div>
                {remark.createdAt.getTime() !== remark.updatedAt.getTime() && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Last edited {formatDate(remark.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// --- Tab Content Components ---
const OverviewContent: React.FC<OverviewContentProps> = ({ stats, transactions }) => (
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

const BarChartItem: React.FC<BarChartItemProps> = ({ label, value, color, isDashed = false }) => (
  <div className="flex flex-col items-center mx-2 h-full justify-end">
    <div
      className={`w-6 rounded-t-md transition-all duration-500 ease-out ${color} ${isDashed ? "border-2 border-dashed border-gray-400 bg-transparent" : ""}`}
      style={{ height: `${value}%` }}
    ></div>
    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-semibold">{label}</div>
  </div>
)

const AnalyticsContent: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Utilization & Trend Analysis</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg h-96 flex flex-col justify-center items-center bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Expense Category Breakdown</h3>
        <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-lg">
          <div
            className="absolute inset-0 bg-yellow-400"
            style={{ clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)" }}
          ></div>
          <div
            className="absolute inset-0 bg-red-600"
            style={{ clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)" }}
          ></div>
          <div
            className="absolute inset-0 bg-teal-500"
            style={{ clipPath: "polygon(50% 50%, 50% 100%, 0% 100%, 0% 50%)" }}
          ></div>
          <div
            className="absolute inset-0 bg-purple-500"
            style={{ clipPath: "polygon(50% 50%, 0% 50%, 0% 0%, 50% 0%)" }}
          ></div>
        </div>
        <div className="flex justify-center flex-wrap gap-4 mt-6 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span> Personnel (25%)
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-red-600 mr-2"></span> MOOE (25%)
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

const InspectionContent: React.FC<InspectionContentProps> = ({ data }) => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<InspectionItem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleFormSubmit = (data: InspectionFormData) => {
    console.log("New inspection submitted:", data)
    alert(`Inspection created successfully!\nProgram: ${data.programNumber}\nTitle: ${data.title}`)
  }

  const handleViewDetails = (inspection: InspectionItem) => {
    setSelectedInspection(inspection)
    setIsDetailsOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="p-6">
      {/* New Inspection Form Dialog */}
      <NewInspectionForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSubmit={handleFormSubmit}
      />

      {/* Inspection Details Modal */}
      <InspectionDetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        inspection={selectedInspection}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inspections</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mockInspections.length} total inspections
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#15803D] hover:bg-[#166534] text-white"
        >
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
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(inspection)}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                {inspection.images && inspection.images.length > 0 ? (
                  <img
                    src={inspection.images[0] || "/placeholder.svg"}
                    alt={inspection.title}
                    className="w-full lg:w-40 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full lg:w-40 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {inspection.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Program #{inspection.programNumber} • {inspection.category}
                    </p>
                  </div>
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
                    <span>{new Date(inspection.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
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
                      <span>{inspection.images.length} image{inspection.images.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0 flex lg:flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full lg:w-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewDetails(inspection)
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {mockInspections.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">No inspections found</p>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#15803D] hover:bg-[#166534] text-white"
          >
            Create Your First Inspection
          </Button>
        </div>
      )}
    </div>
  )
}

const ReportContent: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
      Quarterly Financial Report Summary (Q4 2024)
    </h2>
    <div className="bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-lg border-l-4 border-l-teal-500">
      <h3 className="text-lg font-semibold mb-3 text-teal-600 dark:text-teal-400">Executive Summary</h3>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        The fourth quarter has seen significant financial activity, with total obligations reaching $85.11 million
        against an appropriation of $105.82 million in the "Program for anti-illegal drug, illegal gambling,
        counter-insurgency" category. This represents an 80% utilization rate for this critical program.
      </p>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
        Overall, the department maintains a healthy $38.2 million balance across all major accounts. A key finding is
        the low obligation rate in the 'Crime Prevention and law enforcement' category (9.3%), indicating potential
        delays in procurement or implementation which should be inspected.
      </p>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        <p>
          <strong>Status:</strong> Approved & Filed
        </p>
        <p>
          <strong>Date:</strong> 2024-12-31
        </p>
        <p>
          <strong>Prepared by:</strong> J. Dela Cruz
        </p>
      </div>
    </div>
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Recommendations</h3>
      <div className="space-y-3">
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-[#15803D] font-bold">1.</span>
          <p className="text-gray-700 dark:text-gray-300">
            Immediately review procurement schedules for Section A (Crime Prevention) to address the low obligation
            rate.
          </p>
        </div>
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-[#15803D] font-bold">2.</span>
          <p className="text-gray-700 dark:text-gray-300">
            Allocate $2 million from the existing surplus to a reserve fund for unallocated capital expenditures.
          </p>
        </div>
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-[#15803D] font-bold">3.</span>
          <p className="text-gray-700 dark:text-gray-300">
            Implement stricter spending controls on MOOE in the first quarter to ensure budget conservation.
          </p>
        </div>
      </div>
    </div>
  </div>
)

// --- Main Component ---
export default function FinancialBreakdownTabs({ projectId }: FinancialBreakdownTabsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Analytics" },
    { id: "inspection", label: "Inspection" },
    { id: "remarks", label: "Remarks" },
    { id: "report", label: "Report" },
  ]

  const stats: StatItem[] = [
    { label: "Total Appropriation", amount: mockFinancialBreakdown.reduce((sum, item) => sum + item.appropriation, 0) },
    { label: "Total Obligated", amount: mockFinancialBreakdown.reduce((sum, item) => sum + item.obligation, 0) },
    { label: "Remaining Balance", amount: mockFinancialBreakdown.reduce((sum, item) => sum + item.balance, 0) },
  ]

  const transactions: TransactionCardProps[] = [
    { amount: 1566998.94, name: "Project C.1", email: "drugs@gov.ph", type: "Drug Programs" },
    { amount: 29428400.0, name: "Project C.2", email: "lgu_support@gov.ph", type: "LGU Support" },
    { amount: 5551645.23, name: "Project B", email: "training@gov.ph", type: "Capability Dev" },
    { amount: 950000.0, name: "Project A.2", email: "logistics@gov.ph", type: "Fuel & Oil" },
    { amount: 60082199.04, name: "Project C.3", email: "propoor@gov.ph", type: "Indigency Fund" },
    { amount: 1885040.0, name: "Project B.2", email: "grants@gov.ph", type: "Grants & Subsidies" },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewContent stats={stats} transactions={transactions} />
      case "analytics":
        return <AnalyticsContent />
      case "inspection":
        return <InspectionContent data={mockFinancialBreakdown} />
      case "remarks":
        return <RemarksContent projectId={projectId} /> // Now using the prop
      case "report":
        return <ReportContent />
      default:
        return <InspectionContent data={mockFinancialBreakdown} />
    }
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-all relative
                            ${
                              activeTab === tab.id
                                ? "text-[#15803D] dark:text-[#15803D] bg-white dark:bg-gray-900"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#15803D]"></div>}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 rounded-b-lg">{renderContent()}</div>
    </Card>
  )
}