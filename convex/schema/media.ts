// convex/schema/media.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const mediaTables = {
  /**
   * Upload Sessions.
   */
  uploadSessions: defineTable({
    userId: v.id("users"),
    imageCount: v.number(),
    createdAt: v.number(),
    caption: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("createdAt", ["createdAt"])
    .index("userIdAndCreatedAt", ["userId", "createdAt"]),

  /**
   * Media files.
   */
  media: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    userId: v.id("users"),
    sessionId: v.id("uploadSessions"),
    orderInSession: v.number(),
    uploadedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("sessionId", ["sessionId"])
    .index("uploadedAt", ["uploadedAt"])
    .index("type", ["type"])
    .index("userIdAndUploadedAt", ["userId", "uploadedAt"])
    .index("sessionIdAndOrder", ["sessionId", "orderInSession"]),
};