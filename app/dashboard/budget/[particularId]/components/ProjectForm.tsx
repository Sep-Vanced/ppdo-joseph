// app/dashboard/budget/[particularId]/components/ProjectForm.tsx
"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAccentColor } from "../../../contexts/AccentColorContext";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calculator, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Project } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectParticularCombobox } from "./ProjectParticularCombobox";
import { ImplementingOfficeSelector } from "./ImplementingOfficeSelector";

const FORM_STORAGE_KEY = "project_form_draft";

// Custom validation for no whitespace (for particular code)
const noWhitespaceString = z
  .string()
  .min(1, { message: "This field is required." })
  .refine((val) => val.trim().length > 0, {
    message: "Whitespace only is not allowed.",
  })
  .refine((val) => val === val.trim(), {
    message: "Leading or trailing whitespace is not allowed.",
  })
  .refine((val) => !/\s/.test(val), {
    message: "Whitespace is not allowed.",
  });

const projectSchema = z
  .object({
    particulars: noWhitespaceString,
    implementingOffice: z.string().min(1, { message: "Implementing office is required." }),
    totalBudgetAllocated: z.number().min(0, { message: "Must be 0 or greater." }),
    obligatedBudget: z.number().min(0, { message: "Must be 0 or greater." }).optional(),
    totalBudgetUtilized: z.number().min(0, { message: "Must be 0 or greater." }),
    remarks: z.string().optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  })
  .refine((data) => data.totalBudgetUtilized <= data.totalBudgetAllocated, {
    message: "Budget utilized cannot exceed allocated budget.",
    path: ["totalBudgetUtilized"],
  })
  .refine(
    (data) => !data.obligatedBudget || data.obligatedBudget <= data.totalBudgetAllocated,
    {
      message: "Obligated budget cannot exceed allocated budget.",
      path: ["obligatedBudget"],
    }
  );

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project | null;
  budgetItemId?: string;
  onSave: (project: Omit<Project, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing" | "status">) => void;
  onCancel: () => void;
}

export function ProjectForm({ project, budgetItemId, onSave, onCancel }: ProjectFormProps) {
  const { accentColorValue } = useAccentColor();
  const shouldFetchParent = budgetItemId !== undefined && budgetItemId !== null && budgetItemId !== "";

  const parentBudgetItem = useQuery(
    api.budgetItems.get,
    shouldFetchParent ? { id: budgetItemId as any } : "skip"
  );

  const siblingProjects = useQuery(
    api.projects.list,
    shouldFetchParent ? { budgetItemId: budgetItemId as any } : "skip"
  );

  const [showBudgetWarningModal, setShowBudgetWarningModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ProjectFormValues | null>(null);

  const getSavedDraft = () => {
    if (project) return null;
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error loading form draft:", error);
    }
    return null;
  };

  const savedDraft = getSavedDraft();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: savedDraft || {
      particulars: project?.particulars || "",
      implementingOffice: project?.implementingOffice || "",
      totalBudgetAllocated: project?.totalBudgetAllocated || 0,
      obligatedBudget: project?.obligatedBudget || undefined,
      totalBudgetUtilized: project?.totalBudgetUtilized || 0,
      remarks: project?.remarks || "",
      year: project?.year || undefined,
    },
  });

  const formValues = form.watch();
  
  useEffect(() => {
    if (!project) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formValues));
        } catch (error) {
          console.error("Error saving form draft:", error);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formValues, project]);

  const totalBudgetAllocated = form.watch("totalBudgetAllocated");
  const obligatedBudget = form.watch("obligatedBudget");
  const totalBudgetUtilized = form.watch("totalBudgetUtilized");

  const utilizationRate =
    totalBudgetAllocated > 0
      ? (totalBudgetUtilized / totalBudgetAllocated) * 100
      : 0;

  const isBudgetExceeded = totalBudgetUtilized > totalBudgetAllocated;
  const isObligatedExceeded = obligatedBudget && obligatedBudget > totalBudgetAllocated;
  
  const budgetAvailability = (() => {
    if (!shouldFetchParent) {
      return {
        isLoading: false,
        parentTotal: 0,
        siblingTotal: 0,
        available: 0,
        isOverBudget: false,
        overBudgetAmount: 0,
        percentage: 0,
        debugInfo: "No budget item linked",
      };
    }
    
    if (parentBudgetItem === undefined || siblingProjects === undefined) {
      return {
        isLoading: true,
        parentTotal: 0,
        siblingTotal: 0,
        available: 0,
        isOverBudget: false,
        overBudgetAmount: 0,
        percentage: 0,
        debugInfo: "Loading queries",
      };
    }
    
    if (!parentBudgetItem) {
      return {
        isLoading: false,
        parentTotal: 0,
        siblingTotal: 0,
        available: 0,
        isOverBudget: false,
        overBudgetAmount: 0,
        percentage: 0,
        debugInfo: "Parent not found",
      };
    }
    
    if (!siblingProjects) {
      return {
        isLoading: false,
        parentTotal: parentBudgetItem.totalBudgetAllocated,
        siblingTotal: 0,
        available: parentBudgetItem.totalBudgetAllocated,
        isOverBudget: false,
        overBudgetAmount: 0,
        percentage: 0,
        debugInfo: "Siblings not found",
      };
    }
    
    const parentTotal = parentBudgetItem.totalBudgetAllocated;
    const filteredSiblings = project 
      ? siblingProjects.filter(p => p._id !== project.id)
      : siblingProjects;
    
    const siblingTotal = filteredSiblings.reduce((sum, p) => sum + p.totalBudgetAllocated, 0);
    const available = parentTotal - siblingTotal;
    const isOverBudget = totalBudgetAllocated > available;
    const overBudgetAmount = isOverBudget ? totalBudgetAllocated - available : 0;
    const percentage = available > 0 ? (totalBudgetAllocated / available) * 100 : 0;

    return {
      isLoading: false,
      parentTotal,
      siblingTotal,
      available,
      isOverBudget,
      overBudgetAmount,
      percentage,
      debugInfo: "Calculation complete",
    };
  })();

  const getUtilizationColor = () => {
    if (utilizationRate > 100) return "text-red-600 dark:text-red-400 font-bold";
    if (utilizationRate >= 80) return "text-red-600 dark:text-red-400";
    if (utilizationRate >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  const getBudgetWarningColor = () => {
    if (budgetAvailability.isOverBudget) return "text-red-600 dark:text-red-400";
    if (budgetAvailability.percentage >= 90) return "text-orange-600 dark:text-orange-400";
    if (budgetAvailability.percentage >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  function onSubmit(values: ProjectFormValues) {
    if (budgetAvailability.isOverBudget && !project) {
      setPendingFormData(values);
      setShowBudgetWarningModal(true);
      return;
    }
    
    proceedWithSave(values);
  }
  
  const proceedWithSave = (values: ProjectFormValues) => {
    const projectData = {
      ...values,
      remarks: values.remarks || "",
    };

    if (!project) {
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing form draft:", error);
      }
    }

    onSave(projectData);
  };

  const handleConfirmOverBudget = () => {
    if (pendingFormData) {
      proceedWithSave(pendingFormData);
    }
    setShowBudgetWarningModal(false);
    setPendingFormData(null);
  };
  
  const handleCancelOverBudget = () => {
    setShowBudgetWarningModal(false);
    setPendingFormData(null);
  };

  const handleCancel = () => {
    if (!project) {
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing form draft:", error);
      }
    }
    onCancel();
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Particulars - WITH COMBOBOX */}
          <FormField
            name="particulars"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Particulars
                </FormLabel>
                <FormControl>
                  <ProjectParticularCombobox
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!!project}
                    error={form.formState.errors.particulars?.message}
                  />
                </FormControl>
                {project && (
                  <FormDescription className="text-zinc-500 dark:text-zinc-400">
                    Particular cannot be changed after creation
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Implementing Office - NOW WITH NEW SELECTOR */}
          <FormField
            name="implementingOffice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Implementing Office
                </FormLabel>
                <FormControl>
                  <ImplementingOfficeSelector
                    value={field.value}
                    onChange={field.onChange}
                    disabled={false}
                    error={form.formState.errors.implementingOffice?.message}
                  />
                </FormControl>
                <FormDescription className="text-zinc-500 dark:text-zinc-400">
                  Select department or implementing agency responsible for this project
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Year (Optional) */}
          <FormField
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Year <span className="text-xs text-zinc-500">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 2024"
                    min="2000"
                    max="2100"
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      field.onChange(value ? parseInt(value) : undefined);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Budget Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Budget Allocated */}
            <FormField
              name="totalBudgetAllocated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center gap-2">
                      <span>Total Budget Allocated</span>
                      {!budgetAvailability.isLoading && parentBudgetItem && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-2 text-xs">
                                <p className="font-semibold">Parent Budget Item: {parentBudgetItem.particulars}</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-zinc-400">Total Allocated:</span>
                                    <span className="font-medium">{formatCurrency(budgetAvailability.parentTotal)}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-zinc-400">Used by Others:</span>
                                    <span className="font-medium">{formatCurrency(budgetAvailability.siblingTotal)}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 pt-1 border-t border-zinc-600">
                                    <span className="text-zinc-400">Available:</span>
                                    <span className={`font-bold ${budgetAvailability.available > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {formatCurrency(budgetAvailability.available)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ${
                        budgetAvailability.isOverBudget
                          ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                          : "border-zinc-300 dark:border-zinc-700"
                      }`}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(parseFloat(value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Obligated Budget (Optional) */}
            <FormField
              name="obligatedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Obligated Budget <span className="text-xs text-zinc-500">(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ${
                        isObligatedExceeded
                          ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                          : "border-zinc-300 dark:border-zinc-700"
                      }`}
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget Utilized */}
            <FormField
              name="totalBudgetUtilized"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Budget Utilized
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ${
                        isBudgetExceeded
                          ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                          : "border-zinc-300 dark:border-zinc-700"
                      }`}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(parseFloat(value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Parent Budget Availability Warning - INLINE */}
          {!budgetAvailability.isLoading && !project && parentBudgetItem && totalBudgetAllocated > 0 && (
            <div className={`flex items-start gap-2 p-4 rounded-lg border ${
              budgetAvailability.isOverBudget 
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                : budgetAvailability.percentage >= 90
                ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50"
                : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
            }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                budgetAvailability.isOverBudget 
                  ? "text-red-600 dark:text-red-400"
                  : budgetAvailability.percentage >= 90
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-blue-600 dark:text-blue-400"
              }`} />
              <div className="flex-1 space-y-2">
                <p className={`text-sm font-medium ${
                  budgetAvailability.isOverBudget 
                    ? "text-red-600 dark:text-red-400"
                    : budgetAvailability.percentage >= 90
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}>
                  {budgetAvailability.isOverBudget 
                    ? "⚠️ Budget Exceeds Parent Budget Item"
                    : budgetAvailability.percentage >= 90
                    ? "⚠️ High Budget Usage Warning"
                    : "💡 Budget Availability"}
                </p>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Parent Budget Item ({parentBudgetItem.particulars}):
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(budgetAvailability.parentTotal)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Already Allocated by Other Projects:
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(budgetAvailability.siblingTotal)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Available for This Project:
                    </span>
                    <span className={`font-bold ${getBudgetWarningColor()}`}>
                      {formatCurrency(budgetAvailability.available)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      You're Allocating:
                    </span>
                    <span className={`font-bold ${budgetAvailability.isOverBudget ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                      {formatCurrency(totalBudgetAllocated)}
                    </span>
                  </div>
                  
                  {budgetAvailability.isOverBudget && (
                    <div className="flex justify-between text-red-600 dark:text-red-400 font-bold">
                      <span>Over Budget Amount:</span>
                      <span>{formatCurrency(budgetAvailability.overBudgetAmount)}</span>
                    </div>
                  )}
                </div>
                
                {budgetAvailability.isOverBudget && (
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-2 pt-2 border-t border-red-200 dark:border-red-900/50">
                    <strong>Note:</strong> You can still create this project, but it will exceed the parent budget item's allocated budget. You'll be asked to confirm this action before proceeding.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Obligated Budget Exceeded Warning */}
          {isObligatedExceeded && totalBudgetAllocated > 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Obligated Budget Exceeded
                </p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
                  Obligated budget (₱{obligatedBudget?.toFixed(2)}) cannot exceed allocated amount (₱{totalBudgetAllocated.toFixed(2)})
                </p>
              </div>
            </div>
          )}

          {/* Budget Exceeded Warning */}
          {isBudgetExceeded && totalBudgetAllocated > 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Budget Exceeded
                </p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
                  Budget utilized (₱{totalBudgetUtilized.toFixed(2)}) cannot exceed allocated budget (₱{totalBudgetAllocated.toFixed(2)})
                </p>
              </div>
            </div>
          )}

          {/* Utilization Rate Preview */}
          {totalBudgetAllocated > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Utilization Rate (calculated):
                </span>
                <span className={`text-sm font-semibold ${getUtilizationColor()}`}>
                  {utilizationRate.toFixed(2)}%
                </span>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="formula" className="border-none">
                  <AccordionTrigger className="px-4 pb-3 pt-0 hover:no-underline">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>How is this calculated?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                          The utilization rate shows how much of your budget you've used.
                        </p>
                        <div className="bg-white dark:bg-zinc-900 rounded p-2.5 font-mono text-xs border border-zinc-200 dark:border-zinc-700">
                          (Budget Utilized ÷ Budget Allocated) × 100
                        </div>
                      </div>
                      <div>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-2 font-medium">
                          Your calculation:
                        </p>
                        <div className="bg-white dark:bg-zinc-900 rounded p-2.5 font-mono text-xs border border-zinc-200 dark:border-zinc-700">
                          (₱{totalBudgetUtilized.toFixed(2)} ÷ ₱{totalBudgetAllocated.toFixed(2)}) × 100 = {utilizationRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
          
          {/* Info box explaining auto-calculation */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Automatic Project Metrics & Status</p>
              <p className="mt-1 opacity-90">
                Project counts (completed, delayed, ongoing) and status are automatically calculated from breakdown records you add in the Project Breakdown page.
              </p>
              <p className="mt-2 text-xs opacity-75">
                Status calculation priority: Ongoing → Delayed → Completed
              </p>
            </div>
          </div>

          {/* Remarks */}
          <FormField
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Remarks <span className="text-xs text-zinc-500">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional remarks..."
                    rows={3}
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              onClick={handleCancel}
              variant="ghost"
              className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-white"
              style={{ backgroundColor: accentColorValue }}
            >
              {project ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Budget Over-allocation Confirmation Modal */}
      <Dialog open={showBudgetWarningModal} onOpenChange={setShowBudgetWarningModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Budget Allocation Exceeds Parent Budget
            </DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-400">
              The budget you're allocating for this project exceeds the available budget from the parent budget item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Parent Budget Item:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {parentBudgetItem?.particulars}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Total Parent Budget:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(budgetAvailability.parentTotal)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Already Allocated by Others:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(budgetAvailability.siblingTotal)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-600 dark:text-zinc-400">Available Budget:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(budgetAvailability.available)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">You're Allocating:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(pendingFormData?.totalBudgetAllocated || 0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm pt-2 border-t-2 border-red-200 dark:border-red-900">
                <span className="font-bold text-red-600 dark:text-red-400">Over Budget By:</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(budgetAvailability.overBudgetAmount)}
                </span>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-900/50">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                ⚠️ What happens if you proceed:
              </p>
              <ul className="space-y-2 text-sm text-red-600/90 dark:text-red-400/90">
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span>The parent budget item will show as over-allocated by {formatCurrency(budgetAvailability.overBudgetAmount)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span>This may trigger budget compliance warnings in reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span>You may need to adjust other projects or request additional budget allocation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span>Budget administrators will be notified of this over-allocation</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/50">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                💡 Recommendations:
              </p>
              <ul className="space-y-2 text-sm text-blue-600/90 dark:text-blue-400/90">
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span>Consider reducing the budget allocation to {formatCurrency(budgetAvailability.available)} or less</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span>Review and adjust allocations of existing projects if possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span>Request additional budget allocation for the parent budget item</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold mt-0.5">•</span>
                  <span>Consult with budget administrators before proceeding</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 border-2 border-yellow-300 dark:border-yellow-900 mb-4">
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 text-center">
                Are you sure you want to proceed with this over-allocation?
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelOverBudget}
              className="flex-1"
            >
              Cancel & Review
            </Button>
            <Button
              type="button"
              onClick={handleConfirmOverBudget}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}