// convex/govtProjects.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Log a Government Project Update (The Migration Tool).
 * * Logic:
 * 1. Checks if a Project with this name already exists in the main 'projects' table.
 * 2. If NO: Creates a new 'project' entry automatically.
 * 3. If YES: Uses the existing ID.
 * 4. Inserts the detailed snapshot into 'govtProjectBreakdowns'.
 * 5. Updates the main 'project' table with the latest numbers (syncing).
 */
export const logProjectReport = mutation({
  args: {
    // Identity
    projectName: v.string(), // "Construction of Multi-Purpose Building"
    departmentId: v.id("departments"), // Who manages this?
    
    // Report Context
    reportDate: v.number(), // Timestamp of "As Of" date
    batchId: v.optional(v.string()),

    // Location Data
    district: v.string(),
    municipality: v.string(),
    barangay: v.optional(v.string()),

    // Data Points
    fundSource: v.optional(v.string()),
    appropriation: v.number(),
    accomplishmentRate: v.number(),
    remarksRaw: v.string(),
    statusCategory: v.union(
      v.literal("pre_procurement"),
      v.literal("procurement"),
      v.literal("implementation"),
      v.literal("completed"),
      v.literal("suspended"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    // 1. FIND OR CREATE THE PARENT PROJECT
    let projectId;
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("projectName", (q) => q.eq("projectName", args.projectName))
      .first();

    if (existingProject) {
      projectId = existingProject._id;
      
      // Update the parent project with the latest stats from this report
      // Only update if this report is newer than what's currently there (optional logic)
      await ctx.db.patch(projectId, {
        projectAccomplishment: args.accomplishmentRate,
        allocatedBudget: args.appropriation, // Update budget to match report
        remarks: args.remarksRaw,
        updatedAt: now,
        updatedBy: userId
      });

    } else {
      // Create new Parent Project
      // We map the statusCategory to the simpler 'status' in projects table
      let mainStatus = "on_track";
      if (args.statusCategory === "completed") mainStatus = "completed";
      if (args.statusCategory === "suspended") mainStatus = "on_hold";
      if (args.statusCategory === "cancelled") mainStatus = "cancelled";
      
      projectId = await ctx.db.insert("projects", {
        projectName: args.projectName,
        departmentId: args.departmentId,
        allocatedBudget: args.appropriation,
        totalBudgetUtilized: 0, // Default for new
        utilizationRate: 0,
        balance: args.appropriation,
        dateStarted: args.reportDate, // Approximation
        projectAccomplishment: args.accomplishmentRate,
        status: mainStatus as any,
        remarks: args.remarksRaw,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        isPinned: false
      });
    }

    // 2. INSERT THE DETAILED BREAKDOWN (The History Log)
    const breakdownId = await ctx.db.insert("govtProjectBreakdowns", {
      projectId: projectId,
      reportDate: args.reportDate,
      batchId: args.batchId,
      
      district: args.district,
      municipality: args.municipality,
      barangay: args.barangay,
      
      fundSource: args.fundSource,
      
      appropriation: args.appropriation,
      accomplishmentRate: args.accomplishmentRate,
      
      remarksRaw: args.remarksRaw,
      statusCategory: args.statusCategory,
      
      createdBy: userId,
      createdAt: now,
    });

    return { projectId, breakdownId };
  },
});

/**
 * Get the History Timeline for a specific project.
 * Useful for graphing "Slippage" or progress over time.
 */
export const getProjectHistory = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Sort by report date (oldest to newest)
    return history.sort((a, b) => a.reportDate - b.reportDate);
  },
});

/**
 * Get Breakdown Stats by Municipality
 * (e.g., How much budget is allocated to Anao vs Tarlac City?)
 */
export const getStatsByMunicipality = query({
  args: {
     // Optional filter by date range or fund source could go here
  },
  handler: async (ctx) => {
    // Note: In a real app with thousands of rows, you might want to aggregate this 
    // differently or use a dedicated aggregation table.
    const allBreakdowns = await ctx.db.query("govtProjectBreakdowns").collect();

    // We only want the *latest* report for each project to avoid double counting
    // Group by projectId first
    const latestByProject = new Map();
    
    for (const record of allBreakdowns) {
      const existing = latestByProject.get(record.projectId);
      if (!existing || record.reportDate > existing.reportDate) {
        latestByProject.set(record.projectId, record);
      }
    }

    // Now aggregate the unique latest records by municipality
    const stats: Record<string, { count: number, totalBudget: number }> = {};
    
    latestByProject.forEach((record) => {
      const muni = record.municipality;
      if (!stats[muni]) {
        stats[muni] = { count: 0, totalBudget: 0 };
      }
      stats[muni].count += 1;
      stats[muni].totalBudget += record.appropriation;
    });

    return stats;
  }
});