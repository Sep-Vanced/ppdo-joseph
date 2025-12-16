// convex/lib/checkBudgetAccess.ts

import { GenericQueryCtx } from "convex/server";
import { DataModel } from "../_generated/dataModel";
import { Doc } from "../_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;

/**
 * Check if user has access to budget page
 * Only super_admin and admin roles are allowed
 */
export async function canAccessBudget(
  ctx: QueryCtx,
  userId: string
): Promise<boolean> {
  const user = await ctx.db.get(userId as any) as Doc<"users"> | null;
  
  if (!user) {
    return false;
  }

  // Only super_admin and admin can access
  return user.role === "super_admin" || user.role === "admin";
}