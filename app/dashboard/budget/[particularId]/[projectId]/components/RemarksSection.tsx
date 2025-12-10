// app/dashboard/budget/[particularId]/[projectId]/components/RemarksSection.tsx

"use client";

import { useState } from "react";
import { Remark } from "../../../types";
import { getRemarksByProject, addRemark } from "../data";

interface RemarksSectionProps {
  projectId: string;
}

export default function RemarksSection({ projectId }: RemarksSectionProps) {
  const [remarks, setRemarks] = useState<Remark[]>(getRemarksByProject(projectId));
  const [isAdding, setIsAdding] = useState(false);
  const [newRemarkContent, setNewRemarkContent] = useState("");
  const [currentUser] = useState("Current User"); // In production, get from auth context

  const handleAddRemark = () => {
    if (newRemarkContent.trim()) {
      const newRemark = addRemark(projectId, newRemarkContent, currentUser);
      setRemarks([newRemark, ...remarks]);
      setNewRemarkContent("");
      setIsAdding(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Remarks</h2>
          <p className="text-sm text-gray-500 mt-1">
            Project notes and updates ({remarks.length})
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Add Remark
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Remark
          </label>
          <textarea
            value={newRemarkContent}
            onChange={(e) => setNewRemarkContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Enter your remark here..."
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddRemark}
              disabled={!newRemarkContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Save Remark
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewRemarkContent("");
              }}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {remarks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
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
            <p className="text-xs text-gray-400 mt-1">
              Add your first remark to get started
            </p>
          </div>
        ) : (
          remarks.map((remark) => (
            <div
              key={remark.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {remark.createdBy.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {remark.createdBy}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created {formatDateShort(remark.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {remark.createdAt.getTime() !== remark.updatedAt.getTime() && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-amber-600 font-medium">Updated</span>
                      <span>{formatDate(remark.updatedAt)}</span>
                      <span>by {remark.updatedBy}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {remark.content}
              </p>

              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
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
  );
}