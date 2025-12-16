// app/dashboard/budget/types.ts

export interface BudgetItem {
  id: string;
  particular: string;
  totalBudgetAllocated: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  year?: number;
  status?: "done" | "pending" | "ongoing";
  targetDateCompletion?: number;
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
  totalBudgetUtilized: number;
  utilizationRate: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  notes?: string;
  year?: number;
  status?: "done" | "pending" | "ongoing";
  targetDateCompletion?: number;
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  updatedBy?: string;
}

export interface Project {
  id: string;
  projectName: string;
  implementingOffice: string;
  allocatedBudget: number;
  revisedBudget: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  balance: number;
  dateStarted: string; // ISO date string for frontend
  completionDate: string; // ISO date string for frontend
  projectAccomplishment: number;
  status?: "on_track" | "delayed" | "completed" | "cancelled" | "on_hold";
  remarks: string;
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
  "20% DF",
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
  "20% DF": "20% DEVELOPMENT FUND",
};

export interface FinancialBreakdownItem {
  id: string;
  code?: string; // e.g., "A", "A.1", "A.1.1"
  description: string;
  appropriation: number;
  obligation: number;
  balance: number;
  level: number; // 0 = main section, 1 = sub-item, 2 = sub-sub-item, etc.
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