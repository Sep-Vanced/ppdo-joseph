// new code unfinished app/dashboard/project/budget/[particularId]/[projectbreakdownId]/components/BreakdownForm.tsx

"use client";

import { useState, useMemo, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAccentColor } from "../../../../../../../contexts/AccentColorContext";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, MapPin, FileText, AlertTriangle, Info, TrendingUp, Package, Eye, EyeOff } from "lucide-react";
import { ImplementingOfficeSelector } from "./ImplementingOfficeSelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BudgetViolationModal } from "@/components/budget/BudgetViolationModal";

// Updated Schema
const breakdownSchema = z.object({
  projectName: z.string().min(1, { message: "Project name is required." }),
  implementingOffice: z.string().min(1, { message: "Implementing office is required." }),
  projectTitle: z.string().optional(),
  allocatedBudget: z.number().min(0, { message: "Must be 0 or greater." }).optional(),
  obligatedBudget: z.number().min(0).optional(),
  budgetUtilized: z.number().min(0).optional(),
  utilizationRate: z.number().min(0).max(100).optional(),
  balance: z.number().optional(),
  dateStarted: z.number().optional(),
  targetDate: z.number().optional(),
  completionDate: z.number().optional(),
  projectAccomplishment: z.number().min(0).max(100).optional(),
  status: z.enum(["completed", "ongoing", "delayed"]).optional(),
  remarks: z.string().optional(),
  district: z.string().optional(),
  municipality: z.string().optional(),
  barangay: z.string().optional(),
  reportDate: z.number().optional(),
  batchId: z.string().optional(),
  fundSource: z.string().optional(),
});

type BreakdownFormValues = z.infer<typeof breakdownSchema>;

interface Breakdown {
  _id: string;
  projectName: string;
  implementingOffice: string;
  projectId?: string;
  projectTitle?: string;
  allocatedBudget?: number;
  obligatedBudget?: number;
  budgetUtilized?: number;
  utilizationRate?: number;
  balance?: number;
  dateStarted?: number;
  targetDate?: number;
  completionDate?: number;
  projectAccomplishment?: number;
  status?: "completed" | "ongoing" | "delayed";
  remarks?: string;
  district?: string;
  municipality?: string;
  barangay?: string;
  reportDate?: number;
  batchId?: string;
  fundSource?: string;
}

interface BreakdownFormProps {
  breakdown?: Breakdown | null;
  onSave: (breakdown: Omit<Breakdown, "_id">) => void;
  onCancel: () => void;
  defaultProjectName?: string;
  defaultImplementingOffice?: string;
  projectId?: string;
}

// ✅ Helper function to format number with commas (real-time)
const formatNumberWithCommas = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Split by decimal point
  const parts = cleaned.split('.');
  
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Rejoin with decimal (limit to 2 decimal places)
  if (parts.length > 1) {
    return parts[0] + '.' + parts[1].slice(0, 2);
  }
  
  return parts[0];
};

// ✅ Helper function to parse formatted number
const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// ✅ Helper function to format number for display (after blur)
const formatNumberForDisplay = (value: number): string => {
  if (value === 0) return '';
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export function BreakdownForm({
  breakdown,
  onSave,
  onCancel,
  defaultProjectName,
  defaultImplementingOffice,
  projectId,
}: BreakdownFormProps) {
  const { accentColorValue } = useAccentColor();
  
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showBudgetOverview, setShowBudgetOverview] = useState(false);
  const [pendingValues, setPendingValues] = useState<BreakdownFormValues | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<{
    show: boolean;
    message: string;
    allocatedTotal: number;
    parentBudget: number;
    difference: number;
  } | null>(null);

  // ✅ Display values for formatted inputs
  const [displayAllocated, setDisplayAllocated] = useState("");
  const [displayObligated, setDisplayObligated] = useState("");
  const [displayUtilized, setDisplayUtilized] = useState("");

  // Helper: Date conversions
  const dateToTimestamp = (dateString: string) => dateString ? new Date(dateString).getTime() : undefined;
  const timestampToDate = (timestamp?: number) => timestamp ? new Date(timestamp).toISOString().split("T")[0] : "";

  // 🔧 FIX 1: Determine effective project ID with proper priority
  const effectiveProjectId = useMemo(() => {
    if (projectId) return projectId;
    if (breakdown?.projectId) return breakdown.projectId;
    return undefined;
  }, [projectId, breakdown?.projectId]);

  // 🔧 FIX 2: Debug log
  useEffect(() => {
    console.log("🔍 Project ID Resolution:", {
      propProjectId: projectId,
      breakdownProjectId: breakdown?.projectId,
      effectiveProjectId: effectiveProjectId,
    });
  }, [projectId, breakdown?.projectId, effectiveProjectId]);

  // 🔧 FIX 3: Ensure queries only run when we have a valid project ID
  const projectData = useQuery(
    api.projects.getForValidation, 
    effectiveProjectId ? { id: effectiveProjectId as Id<"projects"> } : "skip"
  );
  
  const siblings = useQuery(
    api.govtProjects.getProjectBreakdowns,
    effectiveProjectId ? { projectId: effectiveProjectId as Id<"projects"> } : "skip"
  );

  // 🔧 FIX 4: Add detailed loading state tracking
  const dataLoadingState = useMemo(() => {
    const hasProjectId = !!effectiveProjectId;
    const projectDataLoading = hasProjectId && projectData === undefined;
    const siblingsLoading = hasProjectId && siblings === undefined;
    const projectDataLoaded = hasProjectId && projectData !== undefined;
    const siblingsLoaded = hasProjectId && siblings !== undefined;
    
    return {
      hasProjectId,
      projectDataLoading,
      siblingsLoading,
      projectDataLoaded,
      siblingsLoaded,
      isFullyLoaded: projectDataLoaded && siblingsLoaded,
      isLoading: projectDataLoading || siblingsLoading,
    };
  }, [effectiveProjectId, projectData, siblings]);

  // Initialize Form
  const form = useForm<BreakdownFormValues>({
    resolver: zodResolver(breakdownSchema),
    defaultValues: {
      projectName: breakdown?.projectName || defaultProjectName || "",
      implementingOffice: breakdown?.implementingOffice || defaultImplementingOffice || "",
      projectTitle: breakdown?.projectTitle || "",
      allocatedBudget: breakdown?.allocatedBudget || undefined,
      obligatedBudget: breakdown?.obligatedBudget || undefined,
      budgetUtilized: breakdown?.budgetUtilized || undefined,
      utilizationRate: breakdown?.utilizationRate || undefined,
      balance: breakdown?.balance || undefined,
      dateStarted: breakdown?.dateStarted || undefined,
      targetDate: breakdown?.targetDate || undefined,
      completionDate: breakdown?.completionDate || undefined,
      projectAccomplishment: breakdown?.projectAccomplishment || undefined,
      status: breakdown?.status || undefined,
      remarks: breakdown?.remarks || "",
      district: breakdown?.district || "",
      municipality: breakdown?.municipality || "",
      barangay: breakdown?.barangay || "",
      reportDate: breakdown?.reportDate || Date.now(),
      batchId: breakdown?.batchId || "",
      fundSource: breakdown?.fundSource || "",
    },
  });

  // ✅ Initialize display values on mount
  useEffect(() => {
    const allocated = form.getValues("allocatedBudget");
    const obligated = form.getValues("obligatedBudget");
    const utilized = form.getValues("budgetUtilized");
    
    if (allocated && allocated > 0) setDisplayAllocated(formatNumberForDisplay(allocated));
    if (obligated && obligated > 0) setDisplayObligated(formatNumberForDisplay(obligated));
    if (utilized && utilized > 0) setDisplayUtilized(formatNumberForDisplay(utilized));
  }, []);

  // Watch fields for real-time validation calculations
  const currentAllocated = form.watch("allocatedBudget") || 0;
  const currentUtilized = form.watch("budgetUtilized") || 0;
  const currentObligated = form.watch("obligatedBudget") || 0;

  // ✅ Dynamic Utilization Rate Calculation
  useEffect(() => {
    if (currentAllocated > 0) {
        const rate = (currentUtilized / currentAllocated) * 100;
        // Only update if significantly different to avoid infinite loops
        const currentRate = form.getValues("utilizationRate") || 0;
        if (Math.abs(rate - currentRate) > 0.01) {
            form.setValue("utilizationRate", parseFloat(rate.toFixed(2)));
        }
    } else if (currentUtilized === 0) {
        form.setValue("utilizationRate", 0);
    }
  }, [currentAllocated, currentUtilized, form]);

  // 🔧 FIX 5: Enhanced budget allocation calculation
  const budgetAllocationStatus = useMemo(() => {
    if (!effectiveProjectId) {
      return { 
        available: 0, 
        isExceeded: false, 
        difference: 0, 
        parentTotal: 0,
        siblingTotal: 0,
        allocatedTotal: 0,
        siblingCount: 0,
        siblings: [],
        isLoading: false,
        noProjectId: true,
      };
    }

    if (projectData === undefined || siblings === undefined) {
      return { 
        available: 0, 
        isExceeded: false, 
        difference: 0, 
        parentTotal: 0,
        siblingTotal: 0,
        allocatedTotal: 0,
        siblingCount: 0,
        siblings: [],
        isLoading: true,
        noProjectId: false,
      };
    }

    const parentTotal = projectData?.totalBudgetAllocated || 0;
    
    const otherSiblings = breakdown 
      ? siblings.filter(s => s._id !== breakdown._id) 
      : siblings;

    const siblingUsed = otherSiblings.reduce((sum, s) => sum + (s.allocatedBudget || 0), 0);
    const available = parentTotal - siblingUsed;
    const isExceeded = currentAllocated > available;
    const difference = currentAllocated - available;
    
    const allocatedTotal = siblingUsed + currentAllocated;

    return { 
      available, 
      isExceeded, 
      difference,
      parentTotal,
      siblingTotal: siblingUsed,
      allocatedTotal,
      siblingCount: otherSiblings.length,
      siblings: otherSiblings,
      isLoading: false,
      noProjectId: false,
    };
  }, [effectiveProjectId, projectData, siblings, breakdown, currentAllocated]);

  // Update budget warning for Allocation
  useEffect(() => {
    if (!budgetAllocationStatus.isLoading && !budgetAllocationStatus.noProjectId && currentAllocated > 0) {
      if (budgetAllocationStatus.isExceeded) {
        setBudgetWarning({
          show: true,
          message: `Warning: Total allocated budget (${formatCurrency(budgetAllocationStatus.allocatedTotal)}) exceeds parent project budget of ${formatCurrency(budgetAllocationStatus.parentTotal)} by ${formatCurrency(budgetAllocationStatus.difference)}`,
          allocatedTotal: budgetAllocationStatus.allocatedTotal,
          parentBudget: budgetAllocationStatus.parentTotal,
          difference: budgetAllocationStatus.difference
        });
      } else {
        setBudgetWarning(null);
      }
    } else {
      setBudgetWarning(null);
    }
  }, [budgetAllocationStatus, currentAllocated]);

  // Logic: Does this breakdown's utilization exceed its own allocation?
  const isOverSelfUtilized = currentUtilized > currentAllocated;

  // Submit Handler
  function onSubmit(values: BreakdownFormValues) {
    // 1. Check if Allocated Budget exceeds Parent Availability
    const isOverParentAllocation = budgetAllocationStatus.isExceeded;
    
    // 2. Check if Utilized Budget exceeds Self Allocation
    const isOverSelf = (values.budgetUtilized || 0) > (values.allocatedBudget || 0);

    // 3. Check if Obligated Budget exceeds Parent Allocated
    const isObligatedOverParent = (values.obligatedBudget || 0) > budgetAllocationStatus.parentTotal;

    // 4. Check if Utilized Budget exceeds Parent Allocated
    const isUtilizedOverParent = (values.budgetUtilized || 0) > budgetAllocationStatus.parentTotal;

    // If ANY violation exists, interrupt save and show Modal
    if (isOverParentAllocation || isOverSelf || isObligatedOverParent || isUtilizedOverParent) {
        setPendingValues(values);
        setShowViolationModal(true);
        return;
    }

    // If clean, proceed to save
    onSave(values as any);
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePercentageUsed = () => {
    if (budgetAllocationStatus.parentTotal === 0) return 0;
    const used = budgetAllocationStatus.siblingTotal + currentAllocated;
    return (used / budgetAllocationStatus.parentTotal) * 100;
  };

  return (
    <>
      <Form {...form}>
        <div className="space-y-6">
          
          {/* --- SECTION 1: Basic Info --- */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColorValue }} />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Basic Information
              </h3>
            </div>
            
              <FormField
                name="projectTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                      Project Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Multi-Purpose Building..."
                        className="bg-white dark:bg-zinc-900"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              <FormField
                name="implementingOffice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                      Implementing Office <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <ImplementingOfficeSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          </div>

          {/* --- SECTION 2: Financial Information --- */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColorValue }} />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Financial Information
                    </h3>
                </div>
                {/* Trigger Button to Toggle Budget Overview */}
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-8 text-zinc-600 dark:text-zinc-400"
                    onClick={() => setShowBudgetOverview(!showBudgetOverview)}
                >
                    {showBudgetOverview ? (
                        <><EyeOff className="w-3.5 h-3.5 mr-2" /> Hide Budget Context</>
                    ) : (
                        <><Eye className="w-3.5 h-3.5 mr-2" /> View Budget Context</>
                    )}
                </Button>
            </div>

            {/* PARENT PROJECT BUDGET OVERVIEW - CONDITIONALLY RENDERED */}
            {showBudgetOverview && !budgetAllocationStatus.isLoading && !budgetAllocationStatus.noProjectId && projectData && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Parent Project Budget Overview
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Total Budget</p>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(budgetAllocationStatus.parentTotal)}
                        </p>
                      </div>
                      
                      <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Remaining Available</p>
                        <p className={`text-lg font-bold ${
                            budgetAllocationStatus.available <= 0 
                            ? "text-red-600 dark:text-red-400" 
                            : "text-green-600 dark:text-green-400"
                        }`}>
                          {formatCurrency(budgetAllocationStatus.available)}
                        </p>
                      </div>
                      
                      <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Siblings Allocated</p>
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(budgetAllocationStatus.siblingTotal)}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {budgetAllocationStatus.siblingCount} breakdown(s)
                        </p>
                      </div>
                      
                      <div className="bg-white/60 dark:bg-zinc-900/60 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Your Input</p>
                        <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(currentAllocated)}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Current entry
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {budgetAllocationStatus.siblings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                        Sibling Breakdowns ({budgetAllocationStatus.siblings.length})
                      </p>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {budgetAllocationStatus.siblings.map((sibling) => (
                        <div key={sibling._id} className="flex items-center justify-between bg-white/40 dark:bg-zinc-900/40 rounded px-2.5 py-1.5 text-xs border border-blue-100/50 dark:border-blue-900/50">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {sibling.projectTitle || sibling.implementingOffice}
                            </p>
                            <p className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                              {sibling.implementingOffice}
                            </p>
                          </div>
                          <div className="text-right ml-2 shrink-0">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatCurrency(sibling.allocatedBudget || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show message when no project ID */}
            {showBudgetOverview && budgetAllocationStatus.noProjectId && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                      No Parent Project Linked
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                      This breakdown is not linked to a parent project. Budget validation is disabled.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Dynamic Budget Allocation Warning (Always visible if triggered) */}
            {budgetWarning && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Budget Allocation Warning
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {budgetWarning.message}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded border">
                        <p className="text-zinc-500 dark:text-zinc-400">Parent Budget</p>
                        <p className="font-semibold">{formatCurrency(budgetWarning.parentBudget)}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded border border-red-100 dark:border-red-800">
                        <p className="text-red-600 dark:text-red-400">Total Allocated</p>
                        <p className="font-semibold text-red-700 dark:text-red-300">{formatCurrency(budgetWarning.allocatedTotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

              {/* Allocated Budget - With Real-time Comma Formatting */}
              <FormField
                name="allocatedBudget"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-zinc-700 dark:text-zinc-300">
                        Allocated Budget
                      </FormLabel>
                      {!budgetAllocationStatus.isLoading && !budgetAllocationStatus.noProjectId && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-zinc-400 hover:text-zinc-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">
                                Parent project budget: {formatCurrency(budgetAllocationStatus.parentTotal)}<br />
                                Sibling allocations: {formatCurrency(budgetAllocationStatus.siblingTotal)}<br />
                                Available: {formatCurrency(budgetAllocationStatus.available)}<br />
                                {budgetAllocationStatus.siblingCount} sibling breakdown(s)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                          ₱
                        </span>
                        <Input
                          placeholder="0"
                          className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 pl-8 ${
                            budgetAllocationStatus.isExceeded 
                              ? "border-red-500 focus-visible:ring-red-500 pr-10" 
                              : "border-zinc-300 dark:border-zinc-700"
                          }`}
                          value={displayAllocated}
                          onChange={(e) => {
                            const value = e.target.value;
                            const formatted = formatNumberWithCommas(value);
                            setDisplayAllocated(formatted);
                            const numericValue = parseFormattedNumber(formatted);
                            field.onChange(numericValue > 0 ? numericValue : undefined);
                          }}
                          onBlur={() => {
                            const numericValue = field.value || 0;
                            if (numericValue > 0) {
                              setDisplayAllocated(formatNumberForDisplay(numericValue));
                            } else {
                              setDisplayAllocated("");
                            }
                          }}
                          onFocus={() => {
                            if (field.value && field.value > 0) {
                              setDisplayAllocated(formatNumberForDisplay(field.value));
                            }
                          }}
                        />
                        {budgetAllocationStatus.isExceeded && (
                          <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </FormControl>
                    
                    {/* Budget Allocation Status Bar */}
                    {!budgetAllocationStatus.isLoading && budgetAllocationStatus.parentTotal > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Budget Usage: {formatCurrency(budgetAllocationStatus.siblingTotal + currentAllocated)} of {formatCurrency(budgetAllocationStatus.parentTotal)}
                          </span>
                          <span className={`font-medium ${
                              budgetAllocationStatus.isExceeded 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-green-600 dark:text-green-400"
                          }`}>
                            {calculatePercentageUsed().toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                              budgetAllocationStatus.isExceeded 
                                ? "bg-red-500" 
                                : "bg-green-500"
                            }`}
                            style={{ 
                              width: `${Math.min(calculatePercentageUsed(), 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            Available: {formatCurrency(budgetAllocationStatus.available)}
                          </span>
                          {budgetAllocationStatus.isExceeded && (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              Over budget by {formatCurrency(budgetAllocationStatus.difference)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Obligated Budget - With Real-time Comma Formatting */}
              <FormField
                name="obligatedBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                      Obligated Budget
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                          ₱
                        </span>
                        <Input
                          placeholder="0"
                          className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 pl-8"
                          value={displayObligated}
                          onChange={(e) => {
                            const value = e.target.value;
                            const formatted = formatNumberWithCommas(value);
                            setDisplayObligated(formatted);
                            const numericValue = parseFormattedNumber(formatted);
                            field.onChange(numericValue > 0 ? numericValue : undefined);
                          }}
                          onBlur={() => {
                            const numericValue = field.value || 0;
                            if (numericValue > 0) {
                              setDisplayObligated(formatNumberForDisplay(numericValue));
                            } else {
                              setDisplayObligated("");
                            }
                          }}
                          onFocus={() => {
                            if (field.value && field.value > 0) {
                              setDisplayObligated(formatNumberForDisplay(field.value));
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    {/* Warning if obligating more than parent total (per prompt) */}
                    {(field.value || 0) > budgetAllocationStatus.parentTotal && budgetAllocationStatus.parentTotal > 0 && (
                        <p className="text-xs text-orange-500 mt-1">
                            Warning: Obligated budget exceeds parent project total allocated budget.
                        </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              
            {/* Utilized Budget - Hidden by default with Real-time Comma Formatting */}
                <FormField
                    name="budgetUtilized"
                    render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <FormLabel className="text-zinc-700 dark:text-zinc-300">
                          Budget Utilized
                        </FormLabel>
                        <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                            ₱
                          </span>
                          <Input
                              placeholder="0"
                              className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 pl-8 ${
                                isOverSelfUtilized
                                  ? "border-orange-500 focus-visible:ring-orange-500 pr-10"
                                  : "border-zinc-300 dark:border-zinc-700"
                              }`}
                              value={displayUtilized}
                              onChange={(e) => {
                                const value = e.target.value;
                                const formatted = formatNumberWithCommas(value);
                                setDisplayUtilized(formatted);
                                const numericValue = parseFormattedNumber(formatted);
                                field.onChange(numericValue > 0 ? numericValue : undefined);
                              }}
                              onBlur={() => {
                                const numericValue = field.value || 0;
                                if (numericValue > 0) {
                                  setDisplayUtilized(formatNumberForDisplay(numericValue));
                                } else {
                                  setDisplayUtilized("");
                                }
                              }}
                              onFocus={() => {
                                if (field.value && field.value > 0) {
                                  setDisplayUtilized(formatNumberForDisplay(field.value));
                                }
                              }}
                          />
                          {isOverSelfUtilized && (
                            <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        </FormControl>
                        
                        {/* Self Utilization Warning with details */}
                        {isOverSelfUtilized && (
                            <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                              <p className="text-xs text-orange-700 dark:text-orange-300 font-medium flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Utilization Warning
                              </p>
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                Utilized ({formatCurrency(currentUtilized)}) exceeds allocated budget ({formatCurrency(currentAllocated)}) by {formatCurrency(currentUtilized - currentAllocated)}
                              </p>
                            </div>
                        )}
                        {/* Parent Utilization Warning (per prompt) */}
                        {currentUtilized > budgetAllocationStatus.parentTotal && budgetAllocationStatus.parentTotal > 0 && (
                             <p className="text-xs text-red-500 mt-1">
                                Critical Warning: Utilized budget exceeds parent project total allocated budget.
                             </p>
                        )}
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

          </div>

          {/* --- SECTION 3: Progress & Status --- */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColorValue }} />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Status & Progress
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                name="projectAccomplishment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                      Accomplishment (%)
                    </FormLabel>
                    <div className="flex items-center gap-4">
                      {/* Slider Section */}
                      <FormControl>
                        <div className="flex-1 space-y-2">
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[field.value || 0]}
                            onValueChange={(value) => {
                              field.onChange(value[0]);
                            }}
                            className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#4FBA76] [&_[role=slider]]:shadow-md [&_.relative]:bg-zinc-200 [&_.relative]:dark:bg-zinc-700 [&_[role=slider]~span]:bg-[#4FBA76]"
                          />
                          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 px-0.5">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                          </div>
                        </div>
                      </FormControl>
                      
                      {/* Number Input on Right */}
                      <FormControl>
                        <div className="relative w-21">
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="100"
                            step="1"
                            className="bg-white dark:bg-zinc-900 pr-7 text-center font-semibold"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              const numValue = value ? parseFloat(value) : 0;
                              // Clamp value between 0 and 100
                              const clampedValue = Math.min(Math.max(numValue, 0), 100);
                              field.onChange(clampedValue);
                            }}
                            value={field.value ?? ""}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-sm pointer-events-none">
                            %
                          </span>
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                      Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-zinc-900">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* --- Accordion: Additional Info (Dates, Location, etc) --- */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="additional-info" className="border rounded-lg px-4">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Additional Information
                  </span>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <MapPin className="h-3 w-3" /> Location & Dates
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-6">
                
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    name="dateStarted"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Date Started</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={timestampToDate(field.value)}
                            onChange={(e) => field.onChange(dateToTimestamp(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Target Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={timestampToDate(field.value)}
                            onChange={(e) => field.onChange(dateToTimestamp(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="completionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Completion Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={timestampToDate(field.value)}
                            onChange={(e) => field.onChange(dateToTimestamp(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">District</FormLabel>
                        <Input {...field} value={field.value || ""} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="municipality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Municipality</FormLabel>
                        <Input {...field} value={field.value || ""} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="barangay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Barangay</FormLabel>
                        <Input {...field} value={field.value || ""} />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Remarks */}
                <FormField
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Remarks</FormLabel>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        className="resize-none" 
                        rows={2} 
                      />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              className="text-white"
              style={{ backgroundColor: accentColorValue }}
            >
              {breakdown ? "Update Breakdown" : "Create Breakdown"}
            </Button>
          </div>
        </div>
      </Form>

      {/* UNIFIED VIOLATION MODAL */}
      <BudgetViolationModal
        isOpen={showViolationModal}
        onClose={() => {
            setShowViolationModal(false);
            setPendingValues(null);
        }}
        onConfirm={() => {
            if(pendingValues) onSave(pendingValues as any);
            setShowViolationModal(false);
            setPendingValues(null);
        }}
        allocationViolation={{
            hasViolation: budgetAllocationStatus.isExceeded,
            message: "Project Breakdown allocated budget exceeds Parent Project budget availability.",
            details: [{
                label: "Parent Project Available",
                amount: pendingValues?.allocatedBudget || 0,
                limit: budgetAllocationStatus.available,
                diff: budgetAllocationStatus.difference
            }]
        }}
        utilizationViolation={{
            // Check for both Self Utilization Violation and Parent Limit Violations
            hasViolation: (
                (pendingValues?.budgetUtilized || 0) > (pendingValues?.allocatedBudget || 0) ||
                (pendingValues?.budgetUtilized || 0) > budgetAllocationStatus.parentTotal ||
                (pendingValues?.obligatedBudget || 0) > budgetAllocationStatus.parentTotal
            ),
            message: "The budget amounts exceed the allocated budget limits (either self or parent project limits).",
            details: [{
                label: "Violation Details",
                amount: pendingValues?.budgetUtilized || 0,
                limit: pendingValues?.allocatedBudget || 0,
                diff: (pendingValues?.budgetUtilized || 0) - (pendingValues?.allocatedBudget || 0)
            }]
        }}
      />
    </>
  );
}