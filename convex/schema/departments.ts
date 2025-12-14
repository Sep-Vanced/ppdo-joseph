// convex/schema/departments.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const departmentTables = {
  /**
   * Departments.
   * Organizational units with hierarchical structure support.
   */
  departments: defineTable({
    /**
     * Department name (e.g., "Finance Department", "HR Department")
     */
    name: v.string(),
    
    /**
     * Short code for the department (e.g., "FIN", "HR", "ENG")
     * Used for quick reference and categorization
     */
    code: v.string(),
    
    /**
     * Full description of the department's responsibilities
     */
    description: v.optional(v.string()),
    
    /**
     * Parent department ID for hierarchical structure
     * null for top-level departments
     */
    parentDepartmentId: v.optional(v.id("departments")),
    
    /**
     * Department head/manager user ID
     */
    headUserId: v.optional(v.id("users")),
    
    /**
     * Contact email for the department
     */
    email: v.optional(v.string()),
    
    /**
     * Contact phone number
     */
    phone: v.optional(v.string()),
    
    /**
     * Physical location/office
     */
    location: v.optional(v.string()),
    
    /**
     * Whether this department is currently active
     */
    isActive: v.boolean(),
    
    /**
     * Display order for sorting departments
     */
    displayOrder: v.optional(v.number()),
    
    /**
     * User who created this department
     */
    createdBy: v.id("users"),
    
    /**
     * Timestamp when created
     */
    createdAt: v.number(),
    
    /**
     * Timestamp when last updated
     */
    updatedAt: v.number(),
    
    /**
     * User who last updated this department
     */
    updatedBy: v.optional(v.id("users")),
  })
    .index("name", ["name"])
    .index("code", ["code"])
    .index("parentDepartmentId", ["parentDepartmentId"])
    .index("headUserId", ["headUserId"])
    .index("isActive", ["isActive"])
    .index("displayOrder", ["displayOrder"]),
};