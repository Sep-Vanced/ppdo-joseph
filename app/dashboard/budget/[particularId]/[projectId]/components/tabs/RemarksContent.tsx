"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewRemarkModal } from "../modals/NewRemarkModal";

interface RemarksContentProps {
  projectId?: string;
}

export const RemarksContent: React.FC<RemarksContentProps> = ({ projectId: propProjectId }) => {
  const params = useParams();
  const projectIdFromParams = params.projectId as string;
  const projectId = (propProjectId || projectIdFromParams) as Id<"projects">;

  // Queries
  const remarks = useQuery(api.remarks.listRemarksByProject, { projectId });
  const inspections = useQuery(api.inspections.listInspectionsByProject, { projectId });
  const currentUser = useQuery(api.myFunctions.getCurrentUser);

  // Mutations
  const createRemark = useMutation(api.remarks.createRemark);
  const updateRemark = useMutation(api.remarks.updateRemark);
  const deleteRemark = useMutation(api.remarks.deleteRemark);
  const togglePin = useMutation(api.remarks.togglePinRemark);

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"remarks"> | null>(null);
  const [editContent, setEditContent] = useState("");
  
  // Filter state
  const [filterInspection, setFilterInspection] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Format date utilities
  const formatDateShort = (timestamp: number): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(timestamp));
  };

  const formatDateDetailed = (timestamp: number): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  };

  // Get display name for user
  const getDisplayName = (user: any) => {
    return user?.name || user?.email || "Unknown User";
  };

  // Handle create remark (Called from Modal)
  const handleCreateRemark = async (data: {
    content: string;
    inspectionId?: Id<"inspections">;
    category?: string;
    priority?: "high" | "medium" | "low";
  }) => {
    try {
      await createRemark({
        projectId,
        ...data,
      });
    } catch (error) {
      console.error("Error creating remark:", error);
      alert("Failed to create remark. Please try again.");
    }
  };

  // Handle update remark
  const handleUpdateRemark = async (remarkId: Id<"remarks">) => {
    if (!editContent.trim()) return;

    try {
      await updateRemark({
        remarkId,
        content: editContent,
      });
      setEditingId(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating remark:", error);
      alert("Failed to update remark. Please try again.");
    }
  };

  // Handle delete remark
  const handleDeleteRemark = async (remarkId: Id<"remarks">) => {
    if (!confirm("Are you sure you want to delete this remark?")) return;

    try {
      await deleteRemark({ remarkId });
    } catch (error) {
      console.error("Error deleting remark:", error);
      alert("Failed to delete remark. Please try again.");
    }
  };

  // Handle toggle pin
  const handleTogglePin = async (remarkId: Id<"remarks">) => {
    try {
      await togglePin({ remarkId });
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  // Start editing
  const startEditing = (remark: any) => {
    setEditingId(remark._id);
    setEditContent(remark.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  // Get priority badge color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Filter remarks
  const filteredRemarks = remarks?.filter((remark) => {
    // Filter by inspection
    if (filterInspection === "general" && remark.inspectionId !== undefined) return false;
    if (filterInspection !== "all" && filterInspection !== "general" && remark.inspectionId !== filterInspection) return false;
    
    // Filter by category
    if (filterCategory !== "all" && remark.category !== filterCategory) return false;

    // Filter by priority
    if (filterPriority !== "all" && remark.priority !== filterPriority) return false;
    
    return true;
  });

  // Get unique categories from remarks for the filter dropdown
  const categories = Array.from(new Set(remarks?.map((r) => r.category).filter(Boolean) || []));

  if (!remarks || !currentUser) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading remarks...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Remarks</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredRemarks?.length || 0} remark{filteredRemarks?.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-[#15803D] hover:bg-[#166534] text-white"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Remark
        </Button>
      </div>

      <NewRemarkModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateRemark}
        inspections={inspections}
      />

      {/* Filters */}
      {remarks.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Inspection Filter */}
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Inspection
            </Label>
            <Select value={filterInspection} onValueChange={setFilterInspection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Remarks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Remarks</SelectItem>
                <SelectItem value="general">General Remarks Only</SelectItem>
                {inspections?.map((inspection) => (
                  <SelectItem key={inspection._id} value={inspection._id}>
                    {inspection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Category
            </Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat!}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Priority
            </Label>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Remarks List */}
      <div className="space-y-4">
        {filteredRemarks?.length === 0 ? (
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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No remarks yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Add your first remark to get started
            </p>
          </div>
        ) : (
          filteredRemarks?.map((remark) => (
            <div
              key={remark._id}
              className={`p-4 rounded-lg border transition-colors ${
                remark.isPinned
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-medium">
                      {getDisplayName(remark.creator).charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getDisplayName(remark.creator)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created {formatDateShort(remark.createdAt)}
                      </p>
                    </div>

                    {/* Pinned Badge */}
                    {remark.isPinned && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium rounded">
                        📌 Pinned
                      </span>
                    )}

                    {/* Priority Badge */}
                    {remark.priority && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(remark.priority)}`}>
                        {remark.priority.toUpperCase()}
                      </span>
                    )}

                    {/* Category Badge */}
                    {remark.category && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium">
                        {remark.category}
                      </span>
                    )}
                  </div>

                  {/* Inspection Link */}
                  {remark.inspection && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="font-semibold">Linked to: {remark.inspection.title}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(remark._id)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title={remark.isPinned ? "Unpin" : "Pin"}
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => startEditing(remark)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteRemark(remark._id)}
                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content (Edit Mode or Display Mode) */}
              {editingId === remark._id ? (
                <div>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full resize-none mb-3"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateRemark(remark._id)}
                      disabled={!editContent.trim()}
                      className="bg-[#15803D] hover:bg-[#166534] text-white text-sm"
                    >
                      Save
                    </Button>
                    <Button variant="outline" onClick={cancelEditing} className="text-sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line mb-3">
                  {remark.content}
                </p>
              )}

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{formatDateDetailed(remark.createdAt)}</span>
                  </div>
                </div>

                {remark.createdAt !== remark.updatedAt && (
                  <div className="text-right">
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Edited</span>
                    <span className="ml-1">
                      {formatDateDetailed(remark.updatedAt)} by {getDisplayName(remark.updater)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};