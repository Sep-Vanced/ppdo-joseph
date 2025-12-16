// app/dashboard/budget/components/BudgetShareModal.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HelpCircle,
  Settings,
  Copy,
  Mail,
  Lock,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface BudgetShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BudgetShareModal({
  isOpen,
  onClose,
}: BudgetShareModalProps) {
  const accessRequests = useQuery(api.accessRequests.list);
  const updateRequestStatus = useMutation(api.accessRequests.updateStatus);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const pendingRequests =
    accessRequests?.filter((req) => req.status === "pending") || [];

  const handleApprove = async (requestId: Id<"accessRequests">) => {
    try {
      setProcessingId(requestId);
      await updateRequestStatus({
        requestId,
        status: "approved",
        adminNotes: adminNotes[requestId] || undefined,
      });
      // Clear the note after approval
      setAdminNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });
    } catch (error) {
      console.error("Error approving request:", error);
      alert(
        error instanceof Error ? error.message : "Failed to approve request"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: Id<"accessRequests">) => {
    try {
      setProcessingId(requestId);
      await updateRequestStatus({
        requestId,
        status: "rejected",
        adminNotes: adminNotes[requestId] || undefined,
      });
      // Clear the note after rejection
      setAdminNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(
        error instanceof Error ? error.message : "Failed to reject request"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleNoteChange = (requestId: string, note: string) => {
    setAdminNotes((prev) => ({
      ...prev,
      [requestId]: note,
    }));
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const index =
      name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-auto border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-normal text-gray-900 dark:text-zinc-100 flex-1 pr-4">
            Share "Budget Tracking"
          </h2>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title="Help"
            >
              <HelpCircle className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Add people input */}
        <div className="px-6 pb-4 pt-4">
          <Input
            placeholder="Add people, groups, spaces, and calendar events"
            className="w-full h-12 text-base bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
          />
        </div>

        {/* Pending Access Requests */}
        {pendingRequests.length > 0 && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-zinc-100">
                Pending Access Requests ({pendingRequests.length})
              </h3>
            </div>

            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-950"
                >
                  {/* User Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback
                        className={`${getAvatarColor(request.userName)} text-white`}
                      >
                        {getInitials(request.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {request.userName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400">
                        {request.userEmail}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                        {request.departmentName}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500 flex-shrink-0">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="mb-3 pl-13">
                    <div className="text-sm mb-2">
                      <span className="font-medium text-gray-700 dark:text-zinc-300">
                        Access Type:
                      </span>{" "}
                      <span className="text-gray-600 dark:text-zinc-400 capitalize">
                        {request.accessType}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-zinc-300">
                        Reason:
                      </span>
                      <p className="text-gray-600 dark:text-zinc-400 mt-1 text-xs leading-relaxed">
                        {request.reason}
                      </p>
                    </div>
                  </div>

                  {/* Admin Notes Input */}
                  <div className="mb-3 pl-13">
                    <Textarea
                      placeholder="Add notes (optional)"
                      value={adminNotes[request._id] || ""}
                      onChange={(e) =>
                        handleNoteChange(request._id, e.target.value)
                      }
                      className="w-full text-sm min-h-[60px] resize-none bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pl-13">
                    <Button
                      onClick={() => handleApprove(request._id)}
                      disabled={processingId === request._id}
                      className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {processingId === request._id ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleReject(request._id)}
                      disabled={processingId === request._id}
                      variant="outline"
                      className="flex-1 h-9 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {processingId === request._id ? "Processing..." : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* People with access */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-900 dark:text-zinc-100">
              People with access
            </h3>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors">
                <Copy className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors">
                <Mail className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>

          {/* User list placeholder */}
          <div className="space-y-3">
            <div className="text-sm text-gray-500 dark:text-zinc-500 text-center py-4">
              Access management coming soon
            </div>
          </div>
        </div>

        {/* General access */}
        <div className="px-6 pb-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-zinc-100 mb-4">
            General access
          </h3>
          <div className="flex items-start gap-3 py-2">
            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full mt-1">
              <Lock className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            </div>
            <div className="flex-1">
              <Select defaultValue="restricted">
                <SelectTrigger className="w-[160px] h-9 border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 -ml-3 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="anyone">Anyone with the link</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                Only people with access can open with the link
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            variant="outline"
            className="h-10 px-6 bg-transparent border-zinc-300 dark:border-zinc-700"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy link
          </Button>
          <Button
            onClick={onClose}
            className="h-10 px-8 bg-blue-600 hover:bg-blue-700"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}