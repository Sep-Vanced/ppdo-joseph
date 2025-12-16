// convex/budgetAccess.ts

import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Check if current user can access budget page
 */
export const canAccess = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { 
        canAccess: false, 
        user: null,
        department: null 
      };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return { 
        canAccess: false, 
        user: null,
        department: null 
      };
    }

    // Check if user is super_admin or admin
    const canAccess = user.role === "super_admin" || user.role === "admin";

    // Get department info if available
    let department = null;
    if (user.departmentId) {
      department = await ctx.db.get(user.departmentId);
    }

    return {
      canAccess,
      user: {
        id: user._id,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        departmentId: user.departmentId,
      },
      department: department ? {
        id: department._id,
        name: department.name,
        code: department.code,
      } : null,
    };
  },
});