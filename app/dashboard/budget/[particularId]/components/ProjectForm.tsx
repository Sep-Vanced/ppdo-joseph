// app/dashboard/budget/[particularId]/components/ProjectForm.tsx

"use client";

import { useEffect } from "react";
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
import { Calculator, AlertCircle, Info } from "lucide-react";
import { Project } from "../../types";

const FORM_STORAGE_KEY = "project_form_draft";

// ⚠️ UPDATED SCHEMA: Removed projectCompleted, projectDelayed, projectsOngoing
// These are now auto-calculated from govtProjectBreakdowns
const projectSchema = z
  .object({
    particulars: z
      .string()
      .min(1, { message: "Particulars is required." })
      .max(200, { message: "Particulars is too long." }),
    implementingOffice: z.string().min(1, { message: "Implementing office is required." }),
    totalBudgetAllocated: z.number().min(0, { message: "Must be 0 or greater." }),
    obligatedBudget: z.number().min(0, { message: "Must be 0 or greater." }).optional(),
    totalBudgetUtilized: z.number().min(0, { message: "Must be 0 or greater." }),
    remarks: z.string().optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    status: z.enum(["done", "pending", "ongoing"]).optional(),
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
  onSave: (project: Omit<Project, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing">) => void;
  onCancel: () => void;
}

export function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const { accentColorValue } = useAccentColor();
  
  // Fetch departments from backend
  const departments = useQuery(api.departments.list, { includeInactive: false });

  // Load saved draft from localStorage (only for new projects)
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

  // Define the form - removed project count fields
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
      status: project?.status || undefined,
    },
  });

  // Watch all form values for auto-save
  const formValues = form.watch();

  // Auto-save draft to localStorage (only for new projects)
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

  // Watch values for utilization rate calculation
  const totalBudgetAllocated = form.watch("totalBudgetAllocated");
  const obligatedBudget = form.watch("obligatedBudget");
  const totalBudgetUtilized = form.watch("totalBudgetUtilized");

  // Calculate utilization rate for preview
  const utilizationRate = totalBudgetAllocated > 0 ? (totalBudgetUtilized / totalBudgetAllocated) * 100 : 0;

  // Check if budget is exceeded
  const isBudgetExceeded = totalBudgetUtilized > totalBudgetAllocated;
  const isObligatedExceeded = obligatedBudget && obligatedBudget > totalBudgetAllocated;

  // Get color based on utilization rate
  const getUtilizationColor = () => {
    if (utilizationRate > 100) return "text-red-600 dark:text-red-400 font-bold";
    if (utilizationRate >= 80) return "text-red-600 dark:text-red-400";
    if (utilizationRate >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  // Define submit handler
  function onSubmit(values: ProjectFormValues) {
    const projectData = {
      ...values,
      remarks: values.remarks || "",
    };

    // Clear draft on successful submit
    if (!project) {
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing form draft:", error);
      }
    }

    onSave(projectData);
  }

  // Handle cancel
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Particulars */}
        <FormField
          name="particulars"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Particulars
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter particulars"
                  className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Implementing Office */}
        <FormField
          name="implementingOffice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-700 dark:text-zinc-300">
                Implementing Office
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={departments === undefined}
              >
                <FormControl>
                  <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                    <SelectValue placeholder={departments === undefined ? "Loading departments..." : "Select implementing office"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments && departments.length > 0 ? (
                    departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept.name}>
                        {dept.name} {dept.code ? `(${dept.code})` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No departments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormDescription className="text-zinc-500 dark:text-zinc-400">
                Select the department responsible for this project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Status (Optional) */}
          <FormField
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Status <span className="text-xs text-zinc-500">(Optional)</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Budget Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Budget Allocated */}
          <FormField
            name="totalBudgetAllocated"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Total Budget Allocated
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
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

        {/* ⚠️ REMOVED PROJECT STATUS FIELDS SECTION */}
        {/* Added info box explaining auto-calculation */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Automatic Project Metrics</p>
            <p className="mt-1 opacity-90">
              Project counts (completed, delayed, ongoing) are automatically calculated from breakdown records you add in the Project Breakdown page.
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
            disabled={departments === undefined}
          >
            {project ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}