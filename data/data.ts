// app/dashboard/project/budget/[particularId]/data.ts

import { Project, BudgetParticular, PARTICULAR_FULL_NAMES } from "../types/types";

// Mock project data - in production, this would come from an API
export function getProjectsByParticular(
  particular: BudgetParticular
): Project[] {
  // Sample data - replace with actual API calls
  // In production, filter by particular from API
  const baseProjects: Project[] = [
    {
      id: "1",
      particulars: "Women's Empowerment Workshop Series",
      implementingOffice: "GAD Office",
      totalBudgetAllocated: 1000000,
      obligatedBudget: 707000,
      totalBudgetUtilized: 500000,
      utilizationRate: 70.7,
      projectCompleted: 65.0,
      projectDelayed: 10.0,
      projectsOngoing: 25.0,
      status: "ongoing",
      remarks: "On track with quarterly milestones",
      year: 2024,
    },
    {
      id: "2",
      particulars: "Gender Sensitivity Training Program",
      implementingOffice: "HRMO",
      totalBudgetAllocated: 500000,
      obligatedBudget: 450000,
      totalBudgetUtilized: 405000,
      utilizationRate: 90.0,
      projectCompleted: 85.0,
      projectDelayed: 5.0,
      projectsOngoing: 10.0,
      status: "ongoing",
      remarks: "Ahead of schedule",
      year: 2024,
    },
    {
      id: "3",
      particulars: "Childcare Support Initiative",
      implementingOffice: "Social Welfare Office",
      totalBudgetAllocated: 750000,
      obligatedBudget: 750000,
      totalBudgetUtilized: 300000,
      utilizationRate: 40.0,
      projectCompleted: 35.0,
      projectDelayed: 15.0,
      projectsOngoing: 50.0,
      status: "ongoing",
      remarks: "Initial phase completed",
      year: 2024,
    },
    {
      id: "4",
      particulars: "Gender-Responsive Budgeting Workshop",
      implementingOffice: "Budget Office",
      totalBudgetAllocated: 300000,
      obligatedBudget: 300000,
      totalBudgetUtilized: 75000,
      utilizationRate: 25.0,
      projectCompleted: 20.0,
      projectDelayed: 30.0,
      projectsOngoing: 50.0,
      status: "ongoing",
      remarks: "Planning phase",
      year: 2024,
    },
    {
      id: "5",
      particulars: "Women's Health Awareness Campaign",
      implementingOffice: "Health Office",
      totalBudgetAllocated: 600000,
      obligatedBudget: 600000,
      totalBudgetUtilized: 300000,
      utilizationRate: 50.0,
      projectCompleted: 45.0,
      projectDelayed: 10.0,
      projectsOngoing: 45.0,
      status: "ongoing",
      remarks: "Mid-implementation",
      year: 2024,
    },
  ];

  // Return different sets of projects based on particular
  // For now, return base projects for all particulars
  // In production, filter by particular from API
  return baseProjects;
}

export function getParticularFullName(particular: string): string {
  return PARTICULAR_FULL_NAMES[particular as BudgetParticular] || particular;
}