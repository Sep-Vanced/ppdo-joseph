// convex/schema/misc.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const miscTables = {
  numbers: defineTable({
    value: v.number(),
  }),
};