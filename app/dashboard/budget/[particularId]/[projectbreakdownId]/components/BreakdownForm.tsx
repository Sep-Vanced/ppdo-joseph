// app/dashboard/budget/[particularId]/[projectbreakdownId]/components/BreakdownForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccentColor } from "../../../../contexts/AccentColorContext";
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
import { ChevronDown, MapPin, FileText } from "lucide-react";
import { ImplementingOfficeSelector } from "./ImplementingOfficeSelector";

// Define the form schema with Zod - matching new backend schema with STRICT 3 statuses
const breakdownSchema = z.object({
  projectName: z.string().min(1, { message: "Project name is required." }),
  implementingOffice: z.string().min(1, { message: "Implementing office is required." }),
  projectTitle: z.string().optional(),
  allocatedBudget: z.number().min(0, { message: "Must be 0 or greater." }).optional(),
  obligatedBudget: z.number().min(0, { message: "Must be 0 or greater." }).optional(),
  budgetUtilized: z.number().min(0, { message: "Must be 0 or greater." }).optional(),
  utilizationRate: z.number().min(0).max(100, { message: "Must be between 0 and 100." }).optional(),
  balance: z.number().optional(),
  dateStarted: z.number().optional(),
  targetDate: z.number().optional(),
  completionDate: z.number().optional(),
  projectAccomplishment: z.number().min(0).max(100, { message: "Must be between 0 and 100." }).optional(),
  // STRICT 3 OPTIONS
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
}

export function BreakdownForm({
  breakdown,
  onSave,
  onCancel,
  defaultProjectName,
  defaultImplementingOffice,
}: BreakdownFormProps) {
  const { accentColorValue } = useAccentColor();
  // Helper to convert date to timestamp
  const dateToTimestamp = (dateString: string): number | undefined => {
    if (!dateString) return undefined;
    return new Date(dateString).getTime();
  };
  // Helper to convert timestamp to date string
  const timestampToDate = (timestamp?: number): string => {
    if (!timestamp) return "";
    return new Date(timestamp).toISOString().split("T")[0];
  };

  // Define the form
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
  // Watch values for validation
  const accomplishmentRate = form.watch("projectAccomplishment");
  const utilizationRate = form.watch("utilizationRate");
  // Define submit handler
  function onSubmit(values: BreakdownFormValues) {
    onSave(values as any);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColorValue }} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Basic Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="hidden">
              <FormField
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                      Project Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Construction of"
                        className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        {...field}
                        readOnly
                        disabled
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                      Linked to current project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project Title */}
            <FormField
              name="projectTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Project Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Multi-Purpose Building in Barangay San Jose"
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Detailed description of the project
                  </FormDescription>
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
                    Implementing Office <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <ImplementingOfficeSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={false}
                      error={form.formState.errors.implementingOffice?.message}
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Select department or implementing agency responsible
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 2: Financial Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColorValue }} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Financial Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Allocated Budget */}
            <FormField
              name="allocatedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Allocated Budget
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Obligated Budget */}
            <FormField
              name="obligatedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Obligated Budget
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget Utilized */}
            <FormField
              name="budgetUtilized"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Budget Utilized
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Utilization Rate */}
            <FormField
              name="utilizationRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Utilization Rate (%)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                      className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ${
                        utilizationRate !== undefined && (utilizationRate < 0 || utilizationRate > 100)
                          ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                          : "border-zinc-300 dark:border-zinc-700"
                      }`}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Balance */}
            <FormField
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Balance
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      step="0.01"
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fund Source */}
            <div className="hidden">
              <FormField
                name="fundSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700 dark:text-zinc-300">
                      Fund Source
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 20% Development Fund"
                        className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Important Dates */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColorValue }} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Important Dates
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date Started */}
            <FormField
              name="dateStarted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Date Started
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      value={timestampToDate(field.value)}
                      onChange={(e) => field.onChange(dateToTimestamp(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Date */}
            <FormField
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Target Date
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      value={timestampToDate(field.value)}
                      onChange={(e) => field.onChange(dateToTimestamp(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Completion Date */}
            <FormField
              name="completionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Completion Date
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      value={timestampToDate(field.value)}
                      onChange={(e) => field.onChange(dateToTimestamp(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 4: Project Progress */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 rounded-full" style={{ backgroundColor: accentColorValue }} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Project Progress
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Accomplishment */}
            <FormField
              name="projectAccomplishment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Project Accomplishment (%)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                      className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ${
                        accomplishmentRate !== undefined && (accomplishmentRate < 0 || accomplishmentRate > 100)
                          ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                          : "border-zinc-300 dark:border-zinc-700"
                      }`}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">
                    Status
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* STRICT 3 OPTIONS */}
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

          {/* Remarks */}
          <FormField
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">
                  Remarks
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., NOA, Contract, NTP under process"
                    rows={3}
                    className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Current status and notes about the project
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Accordion for Additional Information */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="additional-info" className="border rounded-lg px-4">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Additional Information
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <MapPin className="h-3 w-3" />
                  <span>Location</span>
                  <FileText className="h-3 w-3 ml-2" />
                  <span>Metadata</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-6">
              {/* Location Information */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" style={{ color: accentColorValue }} />
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Location Information
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* District */}
                  <FormField
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 dark:text-zinc-300">
                          District
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., First District"
                            className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Municipality */}
                  <FormField
                    name="municipality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 dark:text-zinc-300">
                          Municipality
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Anao"
                            className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Barangay */}
                  <FormField
                    name="barangay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 dark:text-zinc-300">
                          Barangay
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., San Jose North"
                            className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" style={{ color: accentColorValue }} />
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Metadata
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Report Date */}
                  <FormField
                    name="reportDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 dark:text-zinc-300">
                          Report Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            value={timestampToDate(field.value)}
                            onChange={(e) => field.onChange(dateToTimestamp(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                          Date of this report/record
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Batch ID */}
                  <FormField
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 dark:text-zinc-300">
                          Batch ID
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Import_June_2024"
                            className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                          Used to group related import records
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
            type="submit"
            className="text-white"
            style={{ backgroundColor: accentColorValue }}
          >
            {breakdown ? "Update Breakdown" : "Create Breakdown"}
          </Button>
        </div>
      </form>
    </Form>
  );
}