// app/dashboard/project/budget/components/BudgetItemForm.tsx

"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Calculator, AlertCircle, Info, PlusCircle, MinusCircle, AlertTriangle } from "lucide-react";
import { BudgetParticularCombobox } from "./BudgetParticularCombobox";
import { useAccentColor } from "@/contexts/AccentColorContext";

interface BudgetItem {
  id: string;
  particular: string;
  totalBudgetAllocated: number;
  obligatedBudget?: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  year?: number;
  status?: "completed" | "ongoing" | "delayed";
}

const FORM_STORAGE_KEY = "budget_item_form_draft";

// ✅ UPDATED: Allow alphanumeric, underscores, spaces, and percentage signs
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
  .transform((val) => val.trim()); // Trim leading/trailing whitespace but allow internal spaces

// ✅ Updated Schema: removed cross-field refinements here to allow flexible input
const budgetItemSchema = z.object({
  particular: particularCodeString,
  totalBudgetAllocated: z.number().min(0, {
    message: "Must be 0 or greater.",
  }),
  obligatedBudget: z.number().min(0).optional().or(z.literal(0)),
  // ✅ Utilized is optional/0 allowed
  totalBudgetUtilized: z.number().min(0).optional().or(z.literal(0)),
  year: z.number().int().min(2000).max(2100).optional().or(z.literal(0)),
});

type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;

interface BudgetItemFormProps {
  item?: BudgetItem | null;
  onSave: (item: Omit<BudgetItem, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOnTrack" | "status">) => void;
  onCancel: () => void;
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

export function BudgetItemForm({
  item,
  onSave,
  onCancel,
}: BudgetItemFormProps) {
  const { accentColorValue } = useAccentColor();
  
  // ✅ State to toggle manual input for obligated and utilized budget
  const [showManualInput, setShowManualInput] = useState(false);

  // ✅ Display values for formatted inputs
  const [displayAllocated, setDisplayAllocated] = useState("");
  const [displayObligated, setDisplayObligated] = useState("");
  const [displayUtilized, setDisplayUtilized] = useState("");

  const getSavedDraft = () => {
    if (item) return null;
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
  
  const form = useForm<BudgetItemFormValues>({
    resolver: zodResolver(budgetItemSchema),
    defaultValues: savedDraft || {
      particular: item?.particular || "",
      totalBudgetAllocated: item?.totalBudgetAllocated || 0,
      obligatedBudget: item?.obligatedBudget || undefined,
      totalBudgetUtilized: item?.totalBudgetUtilized || 0,
      year: item?.year || undefined,
    },
  });

  const formValues = form.watch();

  // ✅ Initialize display values on mount
  useEffect(() => {
    const allocated = form.getValues("totalBudgetAllocated");
    const obligated = form.getValues("obligatedBudget");
    const utilized = form.getValues("totalBudgetUtilized");
    
    if (allocated > 0) setDisplayAllocated(formatNumberForDisplay(allocated));
    if (obligated && obligated > 0) setDisplayObligated(formatNumberForDisplay(obligated));
    if (utilized && utilized > 0) setDisplayUtilized(formatNumberForDisplay(utilized));
  }, []);

  useEffect(() => {
    if (!item) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formValues));
        } catch (error) {
          console.error("Error saving form draft:", error);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formValues, item]);

  const totalBudgetAllocated = form.watch("totalBudgetAllocated");
  const obligatedBudget = form.watch("obligatedBudget");
  const totalBudgetUtilized = form.watch("totalBudgetUtilized") || 0;
  
  const utilizationRate =
    totalBudgetAllocated > 0
      ? (totalBudgetUtilized / totalBudgetAllocated) * 100
      : 0;

  // ✅ Inline Checks (Visual Only)
  const isBudgetExceeded = totalBudgetUtilized > totalBudgetAllocated;
  const isObligatedExceeded = obligatedBudget && obligatedBudget > totalBudgetAllocated;

  function onSubmit(values: BudgetItemFormValues) {
    const cleanedValues = {
      ...values,
      obligatedBudget: values.obligatedBudget && values.obligatedBudget > 0 ? values.obligatedBudget : undefined,
      totalBudgetUtilized: values.totalBudgetUtilized || 0,
      year: values.year && values.year > 0 ? values.year : undefined,
    };

    if (!item) {
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing form draft:", error);
      }
    }
    onSave(cleanedValues as any);
  }

  const handleCancel = () => {
    if (!item) {
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing form draft:", error);
      }
    }
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="particular"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Particular
              </FormLabel>
              <FormControl>
                <BudgetParticularCombobox
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!!item}
                  error={form.formState.errors.particular?.message}
                />
              </FormControl>
              {item && (
                <FormDescription className="text-zinc-500 dark:text-zinc-400">
                  Particular cannot be changed after creation
                </FormDescription>
              )}
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

        <FormField
          name="totalBudgetAllocated"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Total Budget Allocated
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                    ₱
                  </span>
                  <Input
                    placeholder="0"
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 pl-8"
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Section: Manual Input Toggle with Warning */}
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
                {/* ⚠️ Development Warning */}
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
                                    ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
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
                            Total Budget Utilized
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
                                    ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
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
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>
          )}
        </div>

        {/* Warnings for Validation */}
        {isObligatedExceeded && totalBudgetAllocated > 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Obligated Budget Exceeded
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
                Obligated budget (₱{formatNumberForDisplay(obligatedBudget || 0)}) cannot exceed allocated amount (₱{formatNumberForDisplay(totalBudgetAllocated)})
              </p>
            </div>
          </div>
        )}
        
        {isBudgetExceeded && totalBudgetAllocated > 0 && (
             <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
             <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
             <div className="flex-1">
               <p className="text-sm font-medium text-red-600 dark:text-red-400">
                 Utilized Budget Exceeded
               </p>
               <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
                 Utilized budget (₱{formatNumberForDisplay(totalBudgetUtilized)}) cannot exceed allocated amount (₱{formatNumberForDisplay(totalBudgetAllocated)})
               </p>
             </div>
           </div>
        )}

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Automatic Project Metrics & Status</p>
            <p className="mt-1 opacity-90">
              Project counts and status are automatically calculated from individual projects.
            </p>
          </div>
        </div>

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
            {item ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}