// app/dashboard/project/budget/[particularId]/components/ProjectForm.tsx

"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAccentColor } from "@/contexts/AccentColorContext";
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
import { Calculator, AlertCircle, Info, AlertTriangle, PlusCircle, MinusCircle } from "lucide-react";
import { Project } from "../../../../../../types/types";
import { ProjectParticularCombobox } from "./ProjectParticularCombobox";
import { ImplementingOfficeSelector } from "./ImplementingOfficeSelector";
import { ProjectCategoryCombobox } from "./ProjectCategoryCombobox";
import { BudgetViolationModal } from "@/components/budget/BudgetViolationModal";

const FORM_STORAGE_KEY = "project_form_draft";

// ✅ UPDATED: Strict code validation matching backend
const particularCodeString = z
  .string()
  .min(1, { message: "This field is required." })
  .refine((val) => val.trim().length > 0, {
    message: "Cannot be empty or only whitespace.",
  })
  // Allow accented characters like "ô" while keeping existing allowed symbols
  .refine((val) => /^[\p{L}0-9_%\s,\.\-@]+$/u.test(val), {
    message: "Only letters (including accents), numbers, underscores, percentage signs, spaces, commas, periods, hyphens, and @ are allowed.",
  })
  .transform((val) => val.trim());

const projectSchema = z
  .object({
    particulars: particularCodeString,
    implementingOffice: z.string().min(1, { message: "Implementing office is required." }),
    categoryId: z.string().optional(),
    totalBudgetAllocated: z.number().min(0, { message: "Must be 0 or greater." }),
    obligatedBudget: z.number().min(0).optional().or(z.literal(0)),
    totalBudgetUtilized: z.number().min(0), 
    remarks: z.string().optional(),
    year: z.number().int().min(2000).max(2100).optional(),
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
  onSave: (project: Omit<Project, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing" | "status"> & { categoryId?: string }) => void;
  onCancel: () => void;
}

// ✅ Helpers
const formatNumberWithCommas = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts.length > 1) return parts[0] + '.' + parts[1].slice(0, 2);
  return parts[0];
};

const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const formatNumberForDisplay = (value: number): string => {
  if (value === 0) return '';
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

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

  const [showViolationModal, setShowViolationModal] = useState(false);
  const [pendingValues, setPendingValues] = useState<ProjectFormValues | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  const [displayAllocated, setDisplayAllocated] = useState("");
  const [displayObligated, setDisplayObligated] = useState("");
  const [displayUtilized, setDisplayUtilized] = useState("");

  const getSavedDraft = () => {
    if (project) return null;
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
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
      categoryId: project?.categoryId || undefined,
      totalBudgetAllocated: project?.totalBudgetAllocated || 0,
      obligatedBudget: project?.obligatedBudget || undefined,
      totalBudgetUtilized: project?.totalBudgetUtilized || 0,
      remarks: project?.remarks || "",
      year: project?.year || undefined,
    },
  });

  const formValues = form.watch();

  // Initialize display values
  useEffect(() => {
    const allocated = form.getValues("totalBudgetAllocated");
    const obligated = form.getValues("obligatedBudget");
    const utilized = form.getValues("totalBudgetUtilized");
    
    if (allocated > 0) setDisplayAllocated(formatNumberForDisplay(allocated));
    if (obligated && obligated > 0) setDisplayObligated(formatNumberForDisplay(obligated));
    if (utilized && utilized > 0) setDisplayUtilized(formatNumberForDisplay(utilized));
  }, []);
  
  // Save draft
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
  const totalBudgetUtilized = form.watch("totalBudgetUtilized");
  const obligatedBudget = form.watch("obligatedBudget");
  
  const utilizationRate =
    totalBudgetAllocated > 0
      ? (totalBudgetUtilized / totalBudgetAllocated) * 100
      : 0;

  const isBudgetExceeded = totalBudgetUtilized > totalBudgetAllocated;
  const isObligatedExceeded = obligatedBudget && obligatedBudget > totalBudgetAllocated;
  
  // Calculate Available Budget from Parent
  const budgetAvailability = (() => {
    if (!shouldFetchParent || !parentBudgetItem || !siblingProjects) {
      return { available: 0, isOverBudget: false, overBudgetAmount: 0, parentTotal: 0, siblingTotal: 0, percentage: 0, isLoading: true };
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
    };
  })();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getUtilizationColor = () => {
    if (utilizationRate > 100) return "text-red-600 dark:text-red-400 font-bold";
    if (utilizationRate >= 80) return "text-red-600 dark:text-red-400";
    if (utilizationRate >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  function onSubmit(values: ProjectFormValues) {
    const isOverParent = budgetAvailability.isOverBudget;
    const isOverSelf = values.totalBudgetUtilized > values.totalBudgetAllocated;

    if (isOverParent || isOverSelf) {
      setPendingValues(values);
      setShowViolationModal(true);
      return;
    }
    
    proceedWithSave(values);
  }
  
  const proceedWithSave = (values: ProjectFormValues) => {
    const projectData = {
      ...values,
      remarks: values.remarks || "",
      categoryId: values.categoryId || undefined,
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

          <FormField
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Project Category <span className="text-xs text-zinc-500">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <ProjectCategoryCombobox
                    value={field.value as Id<"projectCategories"> | undefined}
                    onChange={(value) => field.onChange(value || undefined)}
                    disabled={false}
                    error={form.formState.errors.categoryId?.message}
                  />
                </FormControl>
                <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Categorize your project for better organization and reporting
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="grid grid-cols-1 gap-4">
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
                              <Info className="w-4 h-4 text-zinc-400 hover:text-zinc-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Available: {formatCurrency(budgetAvailability.available)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                        ₱
                      </span>
                      <Input
                        placeholder="0"
                        className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 pl-8 ${
                          budgetAvailability.isOverBudget
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                        value={displayAllocated}
                        onChange={(e) => {
                          const value = e.target.value;
                          const formatted = formatNumberWithCommas(value);
                          setDisplayAllocated(formatted);
                          const numericValue = parseFormattedNumber(formatted);
                          field.onChange(numericValue);
                        }}
                        onBlur={() => {
                          const numericValue = parseFormattedNumber(displayAllocated);
                          if (numericValue > 0) {
                            setDisplayAllocated(formatNumberForDisplay(numericValue));
                          } else {
                            setDisplayAllocated("");
                          }
                          field.onChange(numericValue);
                        }}
                      />
                    </div>
                  </FormControl>
                  {budgetAvailability.isOverBudget && (
                    <div className="flex items-start gap-1 mt-1 text-xs text-red-600 font-medium animate-in slide-in-from-top-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Warning: Amount exceeds parent budget availability ({formatCurrency(budgetAvailability.available)})
                      </span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const nextState = !showManualInput;
                        setShowManualInput(nextState);
                        if (!nextState) {
                            form.setValue("obligatedBudget", 0);
                            form.setValue("totalBudgetUtilized", 0);
                            setDisplayObligated("");
                            setDisplayUtilized("");
                        }
                    }}
                    className="text-xs flex items-center gap-2 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-700 dark:text-orange-400"
                >
                    {showManualInput ? (
                        <><MinusCircle className="w-3 h-3" /> Hide Manual Inputs</>
                    ) : (
                        <><PlusCircle className="w-3 h-3" /> Input Utilized and Obligated Budget</>
                    )}
                </Button>
            </div>

            {showManualInput && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 border border-orange-200 dark:border-orange-800/50 rounded-lg p-4 bg-orange-50/50 dark:bg-orange-950/10">
                    <div className="flex items-start gap-2 text-xs text-orange-700 dark:text-orange-300 mb-4">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>
                            This feature is under development, the entire system auto calculation may be not true, better use the project breakdown page to input the specific obligated and utilized budget.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            name="obligatedBudget"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                                    Obligated Budget <span className="text-xs text-zinc-500">(Optional)</span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                                        ₱
                                      </span>
                                      <Input
                                        placeholder="0"
                                        className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 pl-8 ${
                                          isObligatedExceeded
                                            ? "border-red-500 focus-visible:ring-red-500"
                                            : "border-zinc-300 dark:border-zinc-700"
                                        }`}
                                        value={displayObligated}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          const formatted = formatNumberWithCommas(value);
                                          setDisplayObligated(formatted);
                                          const numericValue = parseFormattedNumber(formatted);
                                          field.onChange(numericValue > 0 ? numericValue : undefined);
                                        }}
                                        onBlur={() => {
                                          const numericValue = parseFormattedNumber(displayObligated);
                                          if (numericValue > 0) {
                                            setDisplayObligated(formatNumberForDisplay(numericValue));
                                          } else {
                                            setDisplayObligated("");
                                          }
                                          field.onChange(numericValue > 0 ? numericValue : undefined);
                                        }}
                                      />
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="totalBudgetUtilized"
                            render={({ field }) => (
                                <FormItem>
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
                                          isBudgetExceeded
                                            ? "border-orange-500 focus-visible:ring-orange-500"
                                            : "border-zinc-300 dark:border-zinc-700"
                                        }`}
                                        value={displayUtilized}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          const formatted = formatNumberWithCommas(value);
                                          setDisplayUtilized(formatted);
                                          const numericValue = parseFormattedNumber(formatted);
                                          field.onChange(numericValue);
                                        }}
                                        onBlur={() => {
                                          const numericValue = parseFormattedNumber(displayUtilized);
                                          if (numericValue > 0) {
                                            setDisplayUtilized(formatNumberForDisplay(numericValue));
                                          } else {
                                            setDisplayUtilized("");
                                          }
                                          field.onChange(numericValue);
                                        }}
                                      />
                                    </div>
                                </FormControl>
                                {isBudgetExceeded && (
                                    <p className="text-xs text-orange-500 mt-1">
                                        ⚠️ Warning: Utilized budget exceeds allocated budget.
                                    </p>
                                )}
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            )}
          </div>

          <FormField
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Remarks <span className="text-xs text-zinc-500">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional notes or comments..."
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none"
                    rows={3}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {totalBudgetAllocated > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Utilization Rate:
                </span>
                <span className={`text-sm font-semibold ${getUtilizationColor()}`}>
                  {utilizationRate.toFixed(2)}%
                </span>
              </div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="formula" className="border-none">
                  <AccordionTrigger className="px-4 pb-3 pt-0 hover:no-underline">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Calculation details</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="bg-white dark:bg-zinc-900 rounded p-2.5 font-mono text-xs border">
                      (₱{formatNumberForDisplay(totalBudgetUtilized)} ÷ ₱{formatNumberForDisplay(totalBudgetAllocated)}) × 100 = {utilizationRate.toFixed(2)}%
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              onClick={handleCancel}
              variant="ghost"
              className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
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

      <BudgetViolationModal
        isOpen={showViolationModal}
        onClose={() => {
            setShowViolationModal(false);
            setPendingValues(null);
        }}
        onConfirm={() => {
            if(pendingValues) proceedWithSave(pendingValues);
            setShowViolationModal(false);
            setPendingValues(null);
        }}
        allocationViolation={{
            hasViolation: budgetAvailability.isOverBudget,
            message: "The budget you are allocating for this project exceeds the available budget from the parent budget item.",
            details: [{
                label: "Parent Available",
                amount: pendingValues?.totalBudgetAllocated || 0,
                limit: budgetAvailability.available,
                diff: budgetAvailability.overBudgetAmount
            }]
        }}
        utilizationViolation={{
            hasViolation: (pendingValues?.totalBudgetUtilized || 0) > (pendingValues?.totalBudgetAllocated || 0),
            message: "The utilized budget amount exceeds the allocated budget you have set for this project.",
            details: [{
                label: "Self Allocation",
                amount: pendingValues?.totalBudgetUtilized || 0,
                limit: pendingValues?.totalBudgetAllocated || 0,
                diff: (pendingValues?.totalBudgetUtilized || 0) - (pendingValues?.totalBudgetAllocated || 0)
            }]
        }}
      />
    </>
  );
}