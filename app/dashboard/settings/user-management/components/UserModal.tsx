// app/dashboard/settings/user-management/components/UserModal.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Id } from "../../../../../convex/_generated/dataModel";
import { User, UserFormData } from "../../../../../types/user.types";

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<UserFormData>) => Promise<boolean>;
  user?: User | null;
  departments?: Department[];
  isSubmitting?: boolean;
  currentUserRole?: "super_admin" | "admin" | "inspector" | "user"; // ✅ UPDATED: Added inspector
}

export function UserModal({
  open,
  onClose,
  onSubmit,
  user,
  departments = [],
  isSubmitting = false,
  currentUserRole,
}: UserModalProps) {
  const [formData, setFormData] = useState<Partial<UserFormData>>({
    firstName: "",
    lastName: "",
    middleName: "",
    nameExtension: "",
    email: "",
    role: "user",
    departmentId: undefined,
    position: "",
    employeeId: "",
    status: "active",
    suspensionReason: "",
  });
  const isEditing = !!user;
  const isSuperAdmin = currentUserRole === "super_admin";

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        middleName: user.middleName || "",
        nameExtension: user.nameExtension || "",
        email: user.email || "",
        role: user.role || "user",
        departmentId: user.departmentId,
        position: user.position || "",
        employeeId: user.employeeId || "",
        status: user.status || "active",
        suspensionReason: user.suspensionReason || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        middleName: "",
        nameExtension: "",
        email: "",
        role: "user",
        departmentId: undefined,
        position: "",
        employeeId: "",
        status: "active",
        suspensionReason: "",
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const updateField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user information and permissions."
              : "Create a new user account with role and department assignment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Juan"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Dela Cruz"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Middle Name and Name Extension */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => updateField("middleName", e.target.value)}
                placeholder="Santos"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameExtension">Extension</Label>
              <Input
                id="nameExtension"
                value={formData.nameExtension}
                onChange={(e) => updateField("nameExtension", e.target.value)}
                placeholder="Jr., Sr., III"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="juan.delacruz@tarlac.gov.ph"
              required
              disabled={isSubmitting || isEditing}
            />
            {isEditing && (
              <p className="text-xs text-zinc-500">
                Email cannot be changed after creation
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => updateField("role", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="inspector">Inspector</SelectItem> {/* ✅ ADDED */}
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => updateField("status", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) =>
                updateField(
                  "departmentId",
                  value === "none" ? undefined : (value as Id<"departments">)
                )
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Department</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => updateField("position", e.target.value)}
                placeholder="e.g. Manager"
                disabled={isSubmitting}
              />
            </div>

            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => updateField("employeeId", e.target.value)}
                placeholder="e.g. EMP-001"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Suspension Reason */}
          {formData.status === "suspended" && (
            <div className="space-y-2">
              <Label htmlFor="suspensionReason">Suspension Reason</Label>
              <Textarea
                id="suspensionReason"
                value={formData.suspensionReason}
                onChange={(e) => updateField("suspensionReason", e.target.value)}
                placeholder="Reason for suspension..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}