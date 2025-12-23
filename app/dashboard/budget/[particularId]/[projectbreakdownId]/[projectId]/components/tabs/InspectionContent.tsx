// app/dashboard/budget/[particularId]/[projectId]/components/tabs/InspectionContent.tsx

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { NewInspectionForm } from "../modals/NewInspectionForm";
import { InspectionDetailsModal } from "../modals/InspectionDetailsModal";

interface InspectionContentProps {
  data: any[];
  projectId: Id<"projects">; // 🔧 Accept projectId as prop
}

export const InspectionContent: React.FC<InspectionContentProps> = ({ data, projectId }) => {
  const inspections = useQuery(api.inspections.listInspectionsByProject, {
    projectId,
  });
  const createInspection = useMutation(api.inspections.createInspection);
  const incrementViewCount = useMutation(api.inspections.incrementViewCount);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDateShort = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleFormSubmit = (data: any) => {
    createInspection({
      projectId,
      programNumber: data.programNumber,
      title: data.title,
      category: data.category,
      inspectionDate: new Date(data.date).getTime(),
      remarks: data.remarks,
      status: "pending",
      uploadSessionId: data.uploadSessionId,
    })
      .then(() => {
        setIsFormOpen(false);
      })
      .catch((error) => {
        console.error("Error creating inspection:", error);
        alert("Failed to create inspection. Please try again.");
      });
  };

  const handleViewDetails = async (inspection: any) => {
    try {
      await incrementViewCount({ inspectionId: inspection._id });
      setSelectedInspection(inspection);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Error viewing inspection:", error);
    }
  };

  if (!inspections) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading inspections...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <NewInspectionForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSubmit={handleFormSubmit} 
      />
      
      <InspectionDetailsModal 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
        inspection={selectedInspection} 
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inspections</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {inspections.length} total inspection{inspections.length !== 1 ? "s" : ""}
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
      
      {inspections.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No inspections yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Create your first inspection to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((inspection) => (
            <div 
              key={inspection._id} 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-shadow hover:shadow-md cursor-pointer"
              onClick={() => handleViewDetails(inspection)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-4">
                  {inspection.title}
                </h3>
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(inspection.status)}`}
                >
                  {inspection.status.replace("_", " ")}
                </span>
              </div>
              
              {/* Image thumbnails - Facebook style */}
              {inspection.imageCount > 0 && inspection.thumbnails && inspection.thumbnails.length > 0 && (
                <div className="grid grid-cols-4 gap-1 mb-3">
                  {inspection.thumbnails.map((url: string, idx: number) => (
                    <div key={idx} className="aspect-square relative rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img 
                        src={url} 
                        alt={`Inspection ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 3 && inspection.imageCount > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            +{inspection.imageCount - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                {inspection.remarks}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDateShort(new Date(inspection.inspectionDate))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{inspection.viewCount} views</span>
                </div>
                {inspection.imageCount > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{inspection.imageCount} Images</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};