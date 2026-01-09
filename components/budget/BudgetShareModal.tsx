// app/dashboard/project/budget/components/BudgetShareModal.tsx

"use client";

import { useState, useRef, useEffect } from "react";
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
  Trash2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getDisplayName, getUserInitials } from "@/lib/utils";

interface BudgetShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedUser {
  userId: Id<"users">;
  name: string;
  email: string;
  departmentName?: string;
  accessLevel: "viewer" | "editor" | "admin";
}

// Updated to include inspector role
type UserFromList = {
  _id: Id<"users">;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nameExtension?: string;
  name?: string;
  email?: string;
  departmentName?: string;
  role?: "super_admin" | "admin" | "inspector" | "user";
  status?: "active" | "inactive" | "suspended";
};

export default function BudgetShareModal({
  isOpen,
  onClose,
}: BudgetShareModalProps) {
  const accessRequests = useQuery(api.accessRequests.list);
  const updateRequestStatus = useMutation(api.accessRequests.updateStatus);
  const allUsers = useQuery(api.userManagement.listAllUsers, { limit: 100 });
  const usersWithAccess = useQuery(api.budgetSharedAccess.listUsersWithAccess);
  const grantAccess = useMutation(api.budgetSharedAccess.grantAccess);
  const revokeAccess = useMutation(api.budgetSharedAccess.revokeAccess);
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [savingAccess, setSavingAccess] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const pendingRequests =
    accessRequests?.filter((req) => req.status === "pending") || [];

  // Filter users based on search query
  const filteredUsers = allUsers?.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return false;
    
    // Don't show already selected users
    if (selectedUsers.some(su => su.userId === user._id)) return false;
    
    // Don't show users who already have access
    if (usersWithAccess?.some(u => u.userId === user._id)) return false;
    
    // Use getDisplayName for consistent name handling
    const displayName = getDisplayName(user);
    const nameMatch = displayName.toLowerCase().includes(query);
    const emailMatch = user.email?.toLowerCase().includes(query);
    const deptMatch = user.departmentName?.toLowerCase().includes(query);
    
    return nameMatch || emailMatch || deptMatch;
  }) || [];

  // Handle clicking outside suggestions to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
    setFocusedSuggestionIndex(-1);
  };

  const handleSelectUser = (user: UserFromList) => {
    const displayName = getDisplayName(user);
    
    setSelectedUsers((prev) => [
      ...prev,
      {
        userId: user._id,
        name: displayName,
        email: user.email || "",
        departmentName: user.departmentName,
        accessLevel: "viewer", // Default access level
      },
    ]);
    setSearchQuery("");
    setShowSuggestions(false);
    setFocusedSuggestionIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleRemoveUser = (userId: Id<"users">) => {
    setSelectedUsers((prev) => prev.filter((u) => u.userId !== userId));
  };

  const handleAccessLevelChange = (userId: Id<"users">, level: "viewer" | "editor" | "admin") => {
    setSelectedUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, accessLevel: level } : u))
    );
  };

  const handleSaveAccess = async () => {
    if (selectedUsers.length === 0) {
      alert("Please add at least one user");
      return;
    }

    try {
      setSavingAccess(true);
      
      // Grant access to all selected users
      for (const user of selectedUsers) {
        await grantAccess({
          userId: user.userId,
          accessLevel: user.accessLevel,
          notes: `Access granted via share dialog`,
        });
      }

      // Clear selected users
      setSelectedUsers([]);
      alert("Access granted successfully!");
    } catch (error) {
      console.error("Error granting access:", error);
      alert(
        error instanceof Error ? error.message : "Failed to grant access"
      );
    } finally {
      setSavingAccess(false);
    }
  };

  const handleRevokeAccess = async (userId: Id<"users">) => {
    if (!confirm("Are you sure you want to revoke access for this user?")) {
      return;
    }

    try {
      await revokeAccess({ userId });
    } catch (error) {
      console.error("Error revoking access:", error);
      alert(
        error instanceof Error ? error.message : "Failed to revoke access"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredUsers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedSuggestionIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < filteredUsers.length) {
          handleSelectUser(filteredUsers[focusedSuggestionIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);
        break;
    }
  };

  // Use getUserInitials from lib/utils instead of local function
  const getInitials = (name: string) => {
    return getUserInitials({ name });
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex-1 pr-4">
            Share "Budget Trackings "
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

        {/* Add people input with autocomplete */}
        <div className="px-6 pb-4 pt-4">
          <div className="relative">
            {/* Selected users chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-full pl-1 pr-3 py-1"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback
                        className={`${getAvatarColor(user.name)} text-white text-xs`}
                      >
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-900 dark:text-zinc-100">
                      {user.name}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(user.userId)}
                      className="hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-gray-600 dark:text-zinc-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <Input
              ref={searchInputRef}
              placeholder="Add people by name or email"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="w-full h-12 text-base bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && filteredUsers.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-[300px] overflow-auto z-50"
              >
                {filteredUsers.map((user, index) => {
                  const displayName = getDisplayName(user);
                  const initials = getUserInitials(user);
                  
                  return (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                        index === focusedSuggestionIndex
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : ""
                      }`}
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback
                          className={`${getAvatarColor(displayName)} text-white`}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                          {displayName}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-zinc-400 truncate">
                          {user.email}
                        </div>
                        {user.departmentName && (
                          <div className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                            {user.departmentName}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No results message */}
            {showSuggestions && searchQuery.trim().length > 0 && filteredUsers.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-4 z-50">
                <p className="text-sm text-gray-500 dark:text-zinc-500 text-center">
                  No users found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>

          {/* Save button for selected users */}
          {selectedUsers.length > 0 && (
            <div className="mt-4">
              <Button
                onClick={handleSaveAccess}
                disabled={savingAccess}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {savingAccess ? "Granting Access..." : `Grant Access to ${selectedUsers.length} User${selectedUsers.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </div>

        {/* Pending Access Requests */}
        {pendingRequests.length > 0 && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
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
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
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

          {/* Users with granted access */}
          {usersWithAccess && usersWithAccess.length > 0 ? (
            <div className="space-y-3">
              {usersWithAccess.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 py-2"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback
                      className={`${getAvatarColor(user.userName)} text-white`}
                    >
                      {getInitials(user.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                      {user.userName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-zinc-400">
                      {user.userEmail}
                    </div>
                    {user.departmentName && (
                      <div className="text-xs text-gray-500 dark:text-zinc-500">
                        {user.departmentName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">
                      {user.accessLevel}
                    </span>
                    <button
                      onClick={() => handleRevokeAccess(user.userId)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                      title="Remove access"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-zinc-500 text-center py-4">
              No users have been granted access yet. Search and add users above.
            </div>
          )}
        </div>

        {/* General access */}
        <div className="px-6 pb-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-4">
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