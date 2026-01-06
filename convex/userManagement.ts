// USER MANAGEMENT FUNCTIONS (CREATE, UPDATE, DELETE, LIST)

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { formatFullName, ensureUserName } from "./lib/nameUtils";

/**
 * Create a new user (admin and super_admin only)
 */
export const createUser = mutation({
  args: {
    // NEW: Individual name components (REQUIRED)
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    nameExtension: v.optional(v.string()),

    // DEPRECATED: Keep for backward compatibility
    name: v.optional(v.string()),

    email: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("inspector"),
      v.literal("user")
    ),
    departmentId: v.optional(v.id("departments")),
    position: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("suspended")
      )
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);

    // Only super_admin and admin can create users
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    // Only super_admin can create other super_admins
    if (args.role === "super_admin" && currentUser.role !== "super_admin") {
      throw new Error("Not authorized - only super_admin can create other super_admins");
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Verify department exists if provided
    if (args.departmentId) {
      const department = await ctx.db.get(args.departmentId);
      if (!department) {
        throw new Error("Department not found");
      }
    }

    const now = Date.now();
    // Generate full name from components for backward compatibility
    const fullName = formatFullName(
      args.firstName,
      args.middleName,
      args.lastName,
      args.nameExtension
    );

    // Create the user
    const userId = await ctx.db.insert("users", {
      // NEW: Individual name fields
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      nameExtension: args.nameExtension,

      // BACKWARD COMPATIBILITY: Auto-generated full name
      name: fullName,

      email: args.email,
      role: args.role,
      departmentId: args.departmentId,
      position: args.position,
      employeeId: args.employeeId,
      status: args.status || "active",
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      failedLoginAttempts: 0,
    });

    // Log the action
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: userId,
      action: "user_created",
      newValues: JSON.stringify({
        firstName: args.firstName,
        lastName: args.lastName,
        middleName: args.middleName,
        nameExtension: args.nameExtension,
        fullName: fullName,
        email: args.email,
        role: args.role,
        departmentId: args.departmentId,
        status: args.status || "active",
      }),
      timestamp: now,
    });

    return { userId, success: true };
  },
});

/**
 * Update user profile information (admin and super_admin only, or self-update)
 * UPDATED: Now includes image upload support
 */
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    // NEW: Individual name components (all optional for updates)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    nameExtension: v.optional(v.string()),
    // DEPRECATED: Keep for backward compatibility
    name: v.optional(v.string()),
    position: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    // NEW: Image upload support
    imageStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check authorization:
    // - Users can update their own profile
    // - Admins can update profiles (except super_admin profiles)
    // - Super_admins can update any profile
    const isSelfUpdate = currentUserId === args.userId;
    const isAdmin = currentUser.role === "admin";
    const isSuperAdmin = currentUser.role === "super_admin";

    if (!isSelfUpdate && !isAdmin && !isSuperAdmin) {
      throw new Error("Not authorized - cannot modify other users' profiles");
    }

    // Admin cannot update super_admin profiles
    if (isAdmin && !isSuperAdmin && targetUser.role === "super_admin") {
      throw new Error("Not authorized - cannot modify super_admin profile");
    }

    const now = Date.now();
    const updateData: any = {
      updatedAt: now,
    };

    // Handle name updates - prioritize individual components
    let nameUpdated = false;
    if (args.firstName !== undefined) {
      updateData.firstName = args.firstName;
      nameUpdated = true;
    }
    if (args.lastName !== undefined) {
      updateData.lastName = args.lastName;
      nameUpdated = true;
    }
    if (args.middleName !== undefined) {
      updateData.middleName = args.middleName;
      nameUpdated = true;
    }
    if (args.nameExtension !== undefined) {
      updateData.nameExtension = args.nameExtension;
      nameUpdated = true;
    }

    // If any name component was updated, regenerate full name
    if (nameUpdated) {
      const firstName = args.firstName ?? targetUser.firstName ?? "";
      const lastName = args.lastName ?? targetUser.lastName ?? "";
      const middleName = args.middleName ?? targetUser.middleName;
      const nameExtension = args.nameExtension ?? targetUser.nameExtension;

      // Only generate full name if we have at least firstName or lastName
      if (firstName || lastName) {
        updateData.name = formatFullName(firstName, middleName, lastName, nameExtension);
      }
    } else if (args.name !== undefined) {
      // Fallback: if only old 'name' field is provided
      updateData.name = args.name;
    }

    if (args.position !== undefined) updateData.position = args.position;
    if (args.employeeId !== undefined) updateData.employeeId = args.employeeId;

    // Handle image upload
    if (args.imageStorageId !== undefined) {
      // Get the URL for the uploaded image
      const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
      if (imageUrl) {
        updateData.image = imageUrl;
        updateData.imageStorageId = args.imageStorageId;
      }
    }

    await ctx.db.patch(args.userId, updateData);

    // Log the action
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: args.userId,
      action: "user_updated",
      previousValues: JSON.stringify({
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        middleName: targetUser.middleName,
        nameExtension: targetUser.nameExtension,
        name: targetUser.name,
        position: targetUser.position,
        employeeId: targetUser.employeeId,
        hasImage: !!targetUser.image,
      }),
      newValues: JSON.stringify(updateData),
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Delete a user (admin and super_admin only)
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    const currentUser = await ctx.db.get(currentUserId);

    // Only super_admin and admin can delete users
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    // Cannot delete yourself
    if (currentUserId === args.userId) {
      throw new Error("Cannot delete your own account");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Admin cannot delete super_admin
    if (currentUser.role === "admin" && targetUser.role === "super_admin") {
      throw new Error("Not authorized - cannot delete super_admin");
    }

    const now = Date.now();
    // Generate full name for logging - handle optional fields
    let fullName = targetUser.name;
    if (!fullName && (targetUser.firstName || targetUser.lastName)) {
      fullName = formatFullName(
        targetUser.firstName ?? "",
        targetUser.middleName,
        targetUser.lastName ?? "",
        targetUser.nameExtension
      );
    }

    // Log the action before deletion
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: args.userId,
      action: "user_deleted",
      previousValues: JSON.stringify({
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        middleName: targetUser.middleName,
        nameExtension: targetUser.nameExtension,
        name: fullName,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
      }),
      timestamp: now,
    });

    // Delete related sessions
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete related accounts
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
      .collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // Delete user permissions
    const userPermissions = await ctx.db
      .query("userPermissions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const permission of userPermissions) {
      await ctx.db.delete(permission._id);
    }

    // Delete device fingerprints
    const devices = await ctx.db
      .query("deviceFingerprints")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const device of devices) {
      await ctx.db.delete(device._id);
    }

    // Delete login locations
    const locations = await ctx.db
      .query("loginLocations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const location of locations) {
      await ctx.db.delete(location._id);
    }

    // Finally, delete the user
    await ctx.db.delete(args.userId);
    return { success: true };
  },
});

/**
 * Update user role (super_admin or admin only)
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("inspector"),
      v.literal("user")
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }
    if (args.newRole === "super_admin" && currentUser.role !== "super_admin") {
      throw new Error("Not authorized - only super_admin can create other super_admins");
    }
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      role: args.newRole,
      updatedAt: now,
    });
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: args.userId,
      action: "role_changed",
      previousValues: JSON.stringify({ role: targetUser.role }),
      newValues: JSON.stringify({ role: args.newRole }),
      timestamp: now,
    });
    return { success: true };
  },
});

/**
 * Update user status (super_admin or admin only)
 */
export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    newStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    if (currentUser.role === "admin" && targetUser.role === "super_admin") {
      throw new Error("Not authorized - cannot modify super_admin status");
    }
    const now = Date.now();
    const updateData: any = {
      status: args.newStatus,
      updatedAt: now,
    };
    if (args.newStatus === "suspended") {
      updateData.suspensionReason = args.reason;
      updateData.suspendedBy = currentUserId;
      updateData.suspendedAt = now;
    } else {
      updateData.suspensionReason = undefined;
      updateData.suspendedBy = undefined;
      updateData.suspendedAt = undefined;
    }
    await ctx.db.patch(args.userId, updateData);
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: args.userId,
      action: "status_changed",
      previousValues: JSON.stringify({ status: targetUser.status }),
      newValues: JSON.stringify({
        status: args.newStatus,
        reason: args.reason
      }),
      timestamp: now,
    });
    return { success: true };
  },
});

/**
 * Update user department
 */
export const updateUserDepartment = mutation({
  args: {
    userId: v.id("users"),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    if (args.departmentId) {
      const department = await ctx.db.get(args.departmentId);
      if (!department) {
        throw new Error("Department not found");
      }
    }
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      departmentId: args.departmentId,
      updatedAt: now,
    });
    await ctx.db.insert("userAuditLog", {
      performedBy: currentUserId,
      targetUserId: args.userId,
      action: "department_assigned",
      previousValues: JSON.stringify({ departmentId: targetUser.departmentId }),
      newValues: JSON.stringify({ departmentId: args.departmentId }),
      timestamp: now,
    });
    return { success: true };
  },
});

/**
 * List all users (super_admin or admin only)
 */
export const listAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const currentUser = await ctx.db.get(userId);
    // Only super_admin and admin can list users
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }
    const limit = args.limit || 100;
    let users;
    if (args.departmentId) {
      // Filter by department
      users = await ctx.db
        .query("users")
        .withIndex("departmentId", (q) => q.eq("departmentId", args.departmentId))
        .order("desc")
        .take(limit);
    } else if (currentUser.role === "admin" && currentUser.departmentId) {
      // Admins can only see users in their department (unless they're super_admin)
      users = await ctx.db
        .query("users")
        .withIndex("departmentId", (q) => q.eq("departmentId", currentUser.departmentId))
        .order("desc")
        .take(limit);
    } else {
      // Super_admin can see all users
      users = await ctx.db
        .query("users")
        .order("desc")
        .take(limit);
    }
    // Get department info for each user and ensure names exist
    const usersWithDepartments = await Promise.all(
      users.map(async (user) => {
        let department = null;
        if (user.departmentId) {
          department = await ctx.db.get(user.departmentId);
        }
        // Ensure user has name field
        const userWithName = ensureUserName(user);

        return {
          _id: userWithName._id,
          name: userWithName.name,
          firstName: userWithName.firstName,
          lastName: userWithName.lastName,
          middleName: userWithName.middleName,
          nameExtension: userWithName.nameExtension,
          email: userWithName.email,
          role: userWithName.role,
          status: userWithName.status,
          lastLogin: userWithName.lastLogin,
          createdAt: userWithName.createdAt,
          suspensionReason: userWithName.suspensionReason,
          departmentId: userWithName.departmentId,
          departmentName: department?.name,
          position: userWithName.position,
          employeeId: userWithName.employeeId,
        };
      })
    );
    return usersWithDepartments;
  },
});

/**
 * Get user audit log (super_admin or admin only)
 */
export const getUserAuditLog = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    const currentUser = await ctx.db.get(currentUserId);
    // Only super_admin and admin can view audit logs
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }
    const limit = args.limit || 50;
    let logs;
    if (args.userId) {
      logs = await ctx.db
        .query("userAuditLog")
        .withIndex("targetUserId", (q) => q.eq("targetUserId", args.userId!))
        .order("desc")
        .take(limit);
    } else {
      logs = await ctx.db
        .query("userAuditLog")
        .order("desc")
        .take(limit);
    }
    // Enrich logs with user information
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const performedByUser = await ctx.db.get(log.performedBy);
        const performedByWithName = performedByUser ? ensureUserName(performedByUser) : null;
        // Handle optional targetUserId
        let targetUser = null;
        let targetUserEmail = null;
        let targetUserName = null;

        if (log.targetUserId) {
          targetUser = await ctx.db.get(log.targetUserId);
          if (targetUser) {
            const targetWithName = ensureUserName(targetUser);
            targetUserEmail = targetWithName.email;
            targetUserName = targetWithName.name;
          }
        }

        return {
          ...log,
          performedByEmail: performedByWithName?.email,
          performedByName: performedByWithName?.name,
          targetUserEmail,
          targetUserName,
        };
      })
    );
    return enrichedLogs;
  },
});