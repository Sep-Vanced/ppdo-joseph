import { ReactNode } from "react";

export type ActivityLogType = "breakdown" | "project" | "budget";

export type UnifiedActivityLog = {
  _id: string;
  action: string;
  performedByName: string;
  timestamp: number;
  reason?: string;
  changedFields?: string;
  previousValues?: string;
  newValues?: string;
  projectName?: string;
  municipality?: string;
  particulars?: string;
};

export interface ActivityLogSheetProps {
  type: ActivityLogType;
  entityId?: string;
  budgetItemId?: string;
  projectName?: string;
  implementingOffice?: string;
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}
