// app/dashboard/budget/types.ts

export interface BudgetItem {
  id: string;
  particular: string;
  totalBudgetAllocated: number;
  obligatedBudget?: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  // These are now READ-ONLY, calculated from child projects
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number; // Backend schema uses projectsOnTrack
  year?: number;
  status?: "done" | "pending" | "ongoing";
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
}

export type SortDirection = "asc" | "desc" | null;
export type SortField = keyof BudgetItem | null;

export interface ColumnFilter {
  field: keyof BudgetItem;
  value: any;
}

export interface BudgetItemFromDB {
  _id: string;
  _creationTime: number;
  particulars: string;
  totalBudgetAllocated: number;
  obligatedBudget?: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  notes?: string;
  year?: number;
  status?: "done" | "pending" | "ongoing";
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  updatedBy?: string;
}

// Updated Project interface with new terminology
export interface Project {
  id: string;
  particulars: string; // Changed from projectName
  budgetItemId?: string; // New field linking to parent budget item
  implementingOffice: string; // Department name for display
  totalBudgetAllocated: number;
  obligatedBudget?: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOngoing: number; // Frontend term for projectsOnTrack
  remarks?: string; // Frontend term for notes
  year?: number;
  status?: "done" | "pending" | "ongoing";
  projectManagerId?: string;
  // Pin fields
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
  targetDateCompletion?: number;
}

export const BUDGET_PARTICULARS = [
  "GAD",
  "LDRRMP",
  "LCCAP",
  "LCPC",
  "SCPD",
  "POPS",
  "CAIDS",
  "LNP",
  "PID",
  "ACDP",
  "LYDP",
  "20%_DF",
] as const;

export type BudgetParticular = (typeof BUDGET_PARTICULARS)[number];

export const PARTICULAR_FULL_NAMES: Record<BudgetParticular, string> = {
  GAD: "GENDER AND DEVELOPMENT",
  LDRRMP: "LOCAL DISASTER RISK REDUCTION AND MANAGEMENT PLAN",
  LCCAP: "LOCAL CLIMATE CHANGE ACTION PLAN",
  LCPC: "LOCAL COUNCIL FOR THE PROTECTION OF CHILDREN",
  SCPD: "SUSTAINABLE COMMUNITY PLANNING AND DEVELOPMENT",
  POPS: "PROVINCIAL OPERATIONS AND PLANNING SERVICES",
  CAIDS: "CLIMATE CHANGE ADAPTATION AND INTEGRATED DISASTER SERVICES",
  LNP: "LOCAL NUTRITION PROGRAM",
  PID: "PROVINCIAL INTEGRATED DEVELOPMENT",
  ACDP: "AGRICULTURAL AND COMMUNITY DEVELOPMENT PROGRAM",
  LYDP: "LOCAL YOUTH DEVELOPMENT PROGRAM",
  "20%_DF": "20% DEVELOPMENT FUND",
};

export interface FinancialBreakdownItem {
  id: string;
  code?: string;
  description: string;
  appropriation: number;
  obligation: number;
  balance: number;
  level: number;
  children?: FinancialBreakdownItem[];
}

export interface Remark {
  id: string;
  projectId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  authorRole?: string;
}