// convex/schema/security.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const securityTables = {
  /**
   * Login Attempts.
   * Complete tracking of all login attempts (success and failure).
   */
  loginAttempts: defineTable({
    /**
     * User ID (null for failed attempts where user doesn't exist)
     */
    userId: v.optional(v.id("users")),
    
    /**
     * Email/username used in login attempt
     */
    identifier: v.string(),
    
    /**
     * Login attempt status
     */
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("suspicious"),
      v.literal("blocked")
    ),
    
    /**
     * Reason for failure (if applicable)
     */
    failureReason: v.optional(v.string()),
    
    /**
     * IP address of the attempt
     */
    ipAddress: v.string(),
    
    /**
     * Geographic location data (JSON string)
     * { city, region, country, coordinates }
     */
    geoLocation: v.optional(v.string()),
    
    /**
     * Device information (JSON string)
     * { type, os, osVersion, brand, model }
     */
    deviceInfo: v.optional(v.string()),
    
    /**
     * Browser/client information (JSON string)
     * { browser, browserVersion, userAgent }
     */
    browserInfo: v.optional(v.string()),
    
    /**
     * Session ID created (only for successful logins)
     */
    sessionId: v.optional(v.id("authSessions")),
    
    /**
     * Timestamp of the attempt
     */
    timestamp: v.number(),
    
    /**
     * Risk score (0-100, higher = more suspicious)
     */
    riskScore: v.optional(v.number()),
    
    /**
     * Risk factors detected (JSON array string)
     * ["unusual_location", "new_device", "impossible_travel", etc.]
     */
    riskFactors: v.optional(v.string()),
    
    /**
     * Whether this was flagged for review
     */
    flaggedForReview: v.optional(v.boolean()),
    
    /**
     * Admin who reviewed (if applicable)
     */
    reviewedBy: v.optional(v.id("users")),
    
    /**
     * Review timestamp
     */
    reviewedAt: v.optional(v.number()),
    
    /**
     * Review notes
     */
    reviewNotes: v.optional(v.string()),
    
    /**
     * Whether this attempt is pinned by admin
     */
    isPinned: v.optional(v.boolean()),
  })
    .index("userId", ["userId"])
    .index("identifier", ["identifier"])
    .index("status", ["status"])
    .index("timestamp", ["timestamp"])
    .index("ipAddress", ["ipAddress"])
    .index("sessionId", ["sessionId"])
    .index("flaggedForReview", ["flaggedForReview"])
    .index("userAndTimestamp", ["userId", "timestamp"])
    .index("statusAndTimestamp", ["status", "timestamp"])
    .index("userAndStatus", ["userId", "status"]),

  /**
   * Device Fingerprints.
   * Track known devices for each user.
   */
  deviceFingerprints: defineTable({
    /**
     * User who owns this device
     */
    userId: v.id("users"),
    
    /**
     * Unique device fingerprint hash
     */
    fingerprint: v.string(),
    
    /**
     * Device nickname (user-provided)
     */
    nickname: v.optional(v.string()),
    
    /**
     * Device information (JSON string)
     */
    deviceInfo: v.string(),
    
    /**
     * Browser information (JSON string)
     */
    browserInfo: v.string(),
    
    /**
     * First seen timestamp
     */
    firstSeen: v.number(),
    
    /**
     * Last seen timestamp
     */
    lastSeen: v.number(),
    
    /**
     * Last IP address used
     */
    lastIpAddress: v.string(),
    
    /**
     * Whether this device is trusted
     */
    isTrusted: v.boolean(),
    
    /**
     * Total login count from this device
     */
    loginCount: v.number(),
    
    /**
     * Whether device is currently active (has valid session)
     */
    isActive: v.boolean(),
  })
    .index("userId", ["userId"])
    .index("fingerprint", ["fingerprint"])
    .index("userAndFingerprint", ["userId", "fingerprint"])
    .index("isTrusted", ["isTrusted"])
    .index("lastSeen", ["lastSeen"]),

  /**
   * Login Locations.
   * Track and manage known login locations.
   */
  loginLocations: defineTable({
    /**
     * User ID
     */
    userId: v.id("users"),
    
    /**
     * City name
     */
    city: v.string(),
    
    /**
     * Region/Province
     */
    region: v.string(),
    
    /**
     * Country
     */
    country: v.string(),
    
    /**
     * Coordinates (JSON string)
     * { lat, lng }
     */
    coordinates: v.optional(v.string()),
    
    /**
     * IP ranges associated with this location (JSON array)
     */
    ipRanges: v.optional(v.string()),
    
    /**
     * First seen timestamp
     */
    firstSeen: v.number(),
    
    /**
     * Last seen timestamp
     */
    lastSeen: v.number(),
    
    /**
     * Whether this location is trusted
     */
    isTrusted: v.boolean(),
    
    /**
     * Total login count from this location
     */
    loginCount: v.number(),
  })
    .index("userId", ["userId"])
    .index("userAndLocation", ["userId", "city", "country"])
    .index("isTrusted", ["isTrusted"]),

  /**
   * Security Alerts.
   * Consolidated security alerts for admins.
   */
  securityAlerts: defineTable({
    /**
     * Alert type
     */
    type: v.union(
      v.literal("suspicious_login"),
      v.literal("multiple_failed_attempts"),
      v.literal("impossible_travel"),
      v.literal("new_device"),
      v.literal("unusual_location"),
      v.literal("account_locked"),
      v.literal("brute_force_attempt")
    ),
    
    /**
     * Severity level
     */
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    
    /**
     * Affected user
     */
    userId: v.optional(v.id("users")),
    
    /**
     * Related login attempt
     */
    loginAttemptId: v.optional(v.id("loginAttempts")),
    
    /**
     * Alert title
     */
    title: v.string(),
    
    /**
     * Alert description
     */
    description: v.string(),
    
    /**
     * Additional metadata (JSON string)
     */
    metadata: v.optional(v.string()),
    
    /**
     * Alert status
     */
    status: v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    
    /**
     * Timestamp when alert was created
     */
    createdAt: v.number(),
    
    /**
     * Admin who is handling this
     */
    assignedTo: v.optional(v.id("users")),
    
    /**
     * Resolution notes
     */
    resolutionNotes: v.optional(v.string()),
    
    /**
     * Resolved timestamp
     */
    resolvedAt: v.optional(v.number()),
    
    /**
     * Resolved by
     */
    resolvedBy: v.optional(v.id("users")),
  })
    .index("type", ["type"])
    .index("severity", ["severity"])
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("createdAt", ["createdAt"])
    .index("assignedTo", ["assignedTo"])
    .index("userAndStatus", ["userId", "status"])
    .index("severityAndStatus", ["severity", "status"]),

  /**
   * Blocked IP Addresses.
   * Track IP addresses that have been blocked from accessing the system.
   */
  blockedIPs: defineTable({
    /**
     * IP address that is blocked
     */
    ipAddress: v.string(),
    
    /**
     * Reason for blocking
     */
    reason: v.string(),
    
    /**
     * Admin who blocked this IP
     */
    blockedBy: v.id("users"),
    
    /**
     * Timestamp when blocked
     */
    blockedAt: v.number(),
    
    /**
     * Whether this block is currently active
     */
    isActive: v.boolean(),
    
    /**
     * Related login attempt (if applicable)
     */
    attemptId: v.optional(v.id("loginAttempts")),
    
    /**
     * Additional notes
     */
    notes: v.optional(v.string()),
    
    /**
     * Optional expiration timestamp
     */
    expiresAt: v.optional(v.number()),
    
    /**
     * Admin who unblocked (if unblocked)
     */
    unblockedBy: v.optional(v.id("users")),
    
    /**
     * Timestamp when unblocked
     */
    unblockedAt: v.optional(v.number()),
  })
    .index("ipAddress", ["ipAddress"])
    .index("isActive", ["isActive"])
    .index("blockedBy", ["blockedBy"])
    .index("blockedAt", ["blockedAt"])
    .index("expiresAt", ["expiresAt"]),

  /**
   * Blocked Email Addresses.
   * Track email addresses that have been blocked from accessing the system.
   */
  blockedEmails: defineTable({
    /**
     * Email address that is blocked
     */
    email: v.string(),
    
    /**
     * Reason for blocking
     */
    reason: v.string(),
    
    /**
     * Admin who blocked this email
     */
    blockedBy: v.id("users"),
    
    /**
     * Timestamp when blocked
     */
    blockedAt: v.number(),
    
    /**
     * Whether this block is currently active
     */
    isActive: v.boolean(),
    
    /**
     * Related login attempt (if applicable)
     */
    attemptId: v.optional(v.id("loginAttempts")),
    
    /**
     * Additional notes
     */
    notes: v.optional(v.string()),
    
    /**
     * Optional expiration timestamp
     */
    expiresAt: v.optional(v.number()),
    
    /**
     * Admin who unblocked (if unblocked)
     */
    unblockedBy: v.optional(v.id("users")),
    
    /**
     * Timestamp when unblocked
     */
    unblockedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("isActive", ["isActive"])
    .index("blockedBy", ["blockedBy"])
    .index("blockedAt", ["blockedAt"])
    .index("expiresAt", ["expiresAt"]),
};