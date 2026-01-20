// ============================================================================
// Notifications Dropdown Component
// File: app/dashboard/components/header/NotificationsDropdown.tsx
// ============================================================================

"use client";

import { useState } from "react";
import { useAccentColor } from "../../contexts/AccentColorContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export function NotificationsDropdown() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Doc<"accessRequests"> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const { accentColorValue } = useAccentColor();

  // Get current user
  const currentUser = useQuery(api.users.current);

  // Mutation for updating request status
  const updateStatus = useMutation(api.accessRequests.updateStatus);

  // Handle notification click
  const handleNotificationClick = (request: Doc<"accessRequests"> | null) => {
    if (!request) return;
    setSelectedRequest(request);
    setAdminNotes("");
    setShowModal(true);
  };

  // Handle status update
  const handleStatusUpdate = async (status: "pending" | "approved" | "rejected") => {
    if (!selectedRequest) return;

    try {
      await updateStatus({
        requestId: selectedRequest._id,
        status,
        adminNotes: adminNotes.trim() || undefined,
      });
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      console.error("Failed to update request status:", error);
    }
  };

  // Get notifications based on role
  const accessRequests = useQuery(
    currentUser?.role === "super_admin" || currentUser?.role === "admin"
      ? api.accessRequests.list
      : api.accessRequests.myRequests
  );

  // Transform access requests into notifications
  const notifications = accessRequests?.map((request) => {
    const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";
    
    let title = "";
    let message = "";
    let isRead = false;

    if (isAdmin) {
      // For admins: show pending access requests
      title = `Access Request from ${request.userName}`;
      message = `${request.userName} from ${request.departmentName} is requesting ${request.accessType} access to ${request.pageRequested}`;
      isRead = request.status !== "pending";
    } else {
      // For users: show status of their requests
      title = `Access Request ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`;
      message = `Your request for ${request.accessType} access to ${request.pageRequested} has been ${request.status}`;
      if (request.adminNotes) {
        message += `. Notes: ${request.adminNotes}`;
      }
      // For users: mark as unread if status changed recently (within last 24 hours)
      // or if it's a new status update (approved/rejected)
      const timeSinceUpdate = Date.now() - request.updatedAt;
      const isRecentUpdate = timeSinceUpdate < (24 * 60 * 60 * 1000); // 24 hours
      isRead = !isRecentUpdate && request.status === "pending";
    }

    // Calculate time ago
    const timeDiff = Date.now() - request.updatedAt;
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let time = "";
    if (days > 0) {
      time = `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      time = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      time = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    return {
      id: request._id,
      title,
      message,
      time,
      isRead,
    };
  }) || [];

  const notificationCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Notifications"
      >
        <svg
          className="w-8 h-8 text-zinc-600 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread indicator dot */}
        {notificationCount > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColorValue }}
          />
        )}
        
        {/* Unread count badge */}
        {notificationCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: accentColorValue }}
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-20 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Notifications
              </h3>
              {notificationCount > 0 && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {notificationCount} unread
                </span>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(accessRequests?.find(r => r._id === notification.id) || null)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        <div
                          className="w-2 h-2 rounded-full mt-2 shrink-0"
                          style={{
                            backgroundColor: notification.isRead
                              ? "transparent"
                              : accentColorValue,
                          }}
                        />
                        
                        {/* Notification content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {notification.title}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-zinc-400 dark:text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No notifications
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {/* Request Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentUser?.role === "super_admin" || currentUser?.role === "admin"
                ? "Access Request Review"
                : "Request Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-semibold text-sm">Request Details</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <strong>User:</strong> {selectedRequest.userName} ({selectedRequest.userEmail})
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <strong>Department:</strong> {selectedRequest.departmentName}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <strong>Page:</strong> {selectedRequest.pageRequested}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <strong>Access Type:</strong> {selectedRequest.accessType}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <strong>Reason:</strong> {selectedRequest.reason}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <strong>Status:</strong> {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </p>
                    {selectedRequest.adminNotes && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        <strong>Admin Notes:</strong> {selectedRequest.adminNotes}
                      </p>
                    )}
                  </div>

                  {(currentUser?.role === "super_admin" || currentUser?.role === "admin") && selectedRequest.status === "pending" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Admin Notes (Optional)</label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes about your decision..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStatusUpdate("approved")}
                          className="flex-1"
                          style={{ backgroundColor: accentColorValue }}
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleStatusUpdate("rejected")}
                          variant="destructive"
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>    </div>
  );
}