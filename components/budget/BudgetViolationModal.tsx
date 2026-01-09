// app/dashboard/project/budget/components/BudgetViolationModal.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, AlertCircle } from "lucide-react";

interface ViolationData {
  hasViolation: boolean;
  message: string;
  details?: {
    label: string;
    amount: number;
    limit: number;
    diff: number;
  }[];
}

interface BudgetViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  allocationViolation: ViolationData;
  utilizationViolation: ViolationData;
}

export function BudgetViolationModal({
  isOpen,
  onClose,
  onConfirm,
  allocationViolation,
  utilizationViolation,
}: BudgetViolationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Determine initial step based on violations
  useEffect(() => {
    if (isOpen) {
      if (allocationViolation.hasViolation) {
        setStep(1);
      } else if (utilizationViolation.hasViolation) {
        setStep(2);
      }
    }
  }, [isOpen, allocationViolation, utilizationViolation]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  const handleNext = () => {
    if (step === 1 && utilizationViolation.hasViolation) {
      setStep(2);
    } else {
      onConfirm();
    }
  };

  // Content for Step 1: Allocation Violation (Child > Parent)
  const renderAllocationStep = () => (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900/50 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-red-700 dark:text-red-300">
            Allocation Limit Exceeded
          </p>
          <p className="text-red-600 dark:text-red-400 mt-1">
            {allocationViolation.message}
          </p>
        </div>
      </div>

      {allocationViolation.details?.map((detail, idx) => (
        <div
          key={idx}
          className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md text-sm space-y-2 border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex justify-between">
            <span className="text-zinc-500">Available Parent Budget:</span>
            <span className="font-medium">{formatCurrency(detail.limit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">You are Allocating:</span>
            <span className="font-bold text-red-600">{formatCurrency(detail.amount)}</span>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between font-semibold">
            <span className="text-red-600">Exceeded By:</span>
            <span className="text-red-600">{formatCurrency(detail.diff)}</span>
          </div>
        </div>
      ))}
    </div>
  );

  // Content for Step 2: Utilization Violation (Utilized > Allocated)
  const renderUtilizationStep = () => (
    <div className="space-y-4">
      <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-900/50 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-orange-700 dark:text-orange-300">
            Budget Over-Utilization Warning
          </p>
          <p className="text-orange-600 dark:text-orange-400 mt-1">
            {utilizationViolation.message}
          </p>
        </div>
      </div>

      {utilizationViolation.details?.map((detail, idx) => (
        <div
          key={idx}
          className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md text-sm space-y-2 border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex justify-between">
            <span className="text-zinc-500">Allocated Budget:</span>
            <span className="font-medium">{formatCurrency(detail.limit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">You are Utilizing:</span>
            <span className="font-bold text-orange-600">{formatCurrency(detail.amount)}</span>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between font-semibold">
            <span className="text-orange-600">Over Budget By:</span>
            <span className="text-orange-600">{formatCurrency(detail.diff)}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const isLastStep =
    (step === 1 && !utilizationViolation.hasViolation) || step === 2;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 && <AlertTriangle className="w-5 h-5 text-red-500" />}
            {step === 2 && <AlertCircle className="w-5 h-5 text-orange-500" />}
            <span>
              {step === 1 ? "Budget Allocation Warning" : "Utilization Warning"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "This action will exceed the parent budget's available balance."
              : "The utilized amount exceeds the allocated budget you have set."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {step === 1 ? renderAllocationStep() : renderUtilizationStep()}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Cancel & Review
          </Button>
          <Button
            onClick={handleNext}
            className={`w-full sm:w-auto ${
              step === 1 ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"
            } text-white`}
          >
            {isLastStep ? (
              "Confirm & Proceed"
            ) : (
              <span className="flex items-center gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}