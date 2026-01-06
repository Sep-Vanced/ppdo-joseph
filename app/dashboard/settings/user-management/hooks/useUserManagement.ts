// app/dashboard/settings/user-management/hooks/useUserManagement.ts

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";
import { UserFormData } from "../../../../../types/user.types";

export function useUserManagement() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const users = useQuery(api.userManagement.listAllUsers, {});
  const departments = useQuery(api.departments.list, {});

  // Mutations
  const createUserMutation = useMutation(api.userManagement.createUser);
  const updateUserRole = useMutation(api.userManagement.updateUserRole);
  const updateUserStatus = useMutation(api.userManagement.updateUserStatus);
  const updateUserDepartment = useMutation(api.userManagement.updateUserDepartment);
  const updateUserProfile = useMutation(api.userManagement.updateUserProfile);
  const deleteUserMutation = useMutation(api.userManagement.deleteUser);

  // Create user
  const handleCreateUser = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      
      await createUserMutation({
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        nameExtension: data.nameExtension,
        email: data.email,
        role: data.role, // ✅ Now includes inspector
        departmentId: data.departmentId,
        position: data.position,
        employeeId: data.employeeId,
        status: data.status,
      });
      
      toast.success("User created successfully");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update role
  const handleUpdateRole = async (
    userId: Id<"users">,
    newRole: "super_admin" | "admin" | "inspector" | "user" // ✅ UPDATED: Added inspector
  ) => {
    try {
      setIsSubmitting(true);
      await updateUserRole({ userId, newRole });
      
      toast.success("User role updated successfully");
      
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (
    userId: Id<"users">,
    newStatus: "active" | "inactive" | "suspended",
    reason?: string
  ) => {
    try {
      setIsSubmitting(true);
      await updateUserStatus({ userId, newStatus, reason });
      
      toast.success("User status updated successfully");
      
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update department
  const handleUpdateDepartment = async (
    userId: Id<"users">,
    departmentId?: Id<"departments">
  ) => {
    try {
      setIsSubmitting(true);
      await updateUserDepartment({ userId, departmentId });
      
      toast.success("User department updated successfully");
      
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update user department");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk update user
  const handleUpdateUser = async (
    userId: Id<"users">,
    data: Partial<UserFormData>
  ) => {
    try {
      setIsSubmitting(true);
      
      // Update profile fields (name components, position, employeeId)
      if (data.firstName || data.lastName || data.middleName !== undefined || data.nameExtension !== undefined || data.position || data.employeeId) {
        await updateUserProfile({
          userId,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          nameExtension: data.nameExtension,
          position: data.position,
          employeeId: data.employeeId,
        });
      }
      
      // Update role if provided (now includes inspector)
      if (data.role) {
        await updateUserRole({ userId, newRole: data.role });
      }
      
      // Update status if provided
      if (data.status) {
        await updateUserStatus({
          userId,
          newStatus: data.status,
          reason: data.suspensionReason,
        });
      }
      
      // Update department if provided
      if (data.departmentId !== undefined) {
        await updateUserDepartment({ userId, departmentId: data.departmentId });
      }
      
      toast.success("User updated successfully");
      
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: Id<"users">) => {
    try {
      setIsSubmitting(true);
      
      await deleteUserMutation({ userId });
      
      toast.success("User deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    users,
    departments,
    isLoading: users === undefined || departments === undefined,
    isSubmitting,
    createUser: handleCreateUser,
    updateRole: handleUpdateRole,
    updateStatus: handleUpdateStatus,
    updateDepartment: handleUpdateDepartment,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
  };
}