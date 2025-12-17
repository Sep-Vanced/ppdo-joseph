// convex/schema/govtProjectBreakdowns.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const govtProjectBreakdownTables = {
  /**
   * Govt Project Breakdowns (The "Ledger").
   * This table stores the historical snapshots from the PDF reports.
   * It links to the main 'projects' table via projectId.
   */
  govtProjectBreakdowns: defineTable({
    // --- LINK TO MAIN PROJECT ---
    projectId: v.id("projects"), // The foreign key

    // --- REPORT METADATA ---
    reportDate: v.number(), // The "As of June 15, 2022" date
    batchId: v.optional(v.string()), // Optional: To group uploads (e.g., "Import_June_2022")

    // --- LOCATION BREAKDOWN (From the "@ Location" text) ---
    district: v.string(),        // e.g., "First District"
    municipality: v.string(),    // e.g., "Anao"
    barangay: v.optional(v.string()), // e.g., "San Jose North"
    
    // --- CLASSIFICATION ---
    fundSource: v.optional(v.string()),      // e.g., "20% Development Fund 2022"
    programType: v.optional(v.string()),     // e.g., "Infrastructure", "Social Services"
    implementingAgency: v.optional(v.string()), // e.g., "PEO"

    // --- FINANCIAL SNAPSHOT ---
    appropriation: v.number(),   // The Budget allocated in this report
    obligation: v.optional(v.number()), // Amount obligated so far
    balance: v.optional(v.number()),    // Remaining balance

    // --- PHYSICAL STATUS SNAPSHOT ---
    accomplishmentRate: v.number(), // 0 to 100
    
    // --- STATUS DETAILS ---
    // The raw text from the "Remarks" column (e.g., "NOA, Contract, NTP under process")
    remarksRaw: v.string(), 
    
    // Normalized status for charts
    statusCategory: v.union(
      v.literal("pre_procurement"), // POW/DED
      v.literal("procurement"),     // Bidding/NOA/NTP
      v.literal("implementation"),  // On-going
      v.literal("completed"),
      v.literal("suspended"),
      v.literal("cancelled")
    ),

    // --- SYSTEM METADATA ---
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("projectId", ["projectId"]) // Fast lookup of history for a specific project
    .index("reportDate", ["reportDate"]) // Fast lookup for "Show me all June reports"
    .index("municipality", ["municipality"]) // Filter by town
    .index("statusCategory", ["statusCategory"]) // Filter by status
    .index("projectIdAndDate", ["projectId", "reportDate"]), // Ensure no duplicate reports for same month
};