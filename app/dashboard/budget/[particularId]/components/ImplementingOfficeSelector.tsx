// app/dashboard/budget/[particularId]/components/ImplementingOfficeSelector.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, AlertCircle, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useDebounce } from "@/app/hooks/use-debounce";

interface ImplementingOfficeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

type SelectionMode = "agency" | "department" | null;

const ITEMS_PER_PAGE = 20;

export function ImplementingOfficeSelector({
  value,
  onChange,
  disabled,
  error,
}: ImplementingOfficeSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectionMode, setSelectionMode] = React.useState<SelectionMode>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [displayedCount, setDisplayedCount] = React.useState(ITEMS_PER_PAGE);

  // Debounce search query for validation
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch all implementing agencies
  const allAgencies = useQuery(api.implementingAgencies.list, {
    includeInactive: false,
  });

  // Fetch all departments
  const allDepartments = useQuery(api.departments.list, {
    includeInactive: false,
  });

  // Check if code is available for agencies
  const isAgencyCodeAvailable = useQuery(
    api.implementingAgencies.isCodeAvailable,
    debouncedSearch && debouncedSearch.length > 0 && selectionMode === "agency"
      ? { code: debouncedSearch.toUpperCase() }
      : "skip"
  );

  // Check if code is available for departments
  const isDepartmentCodeAvailable = useQuery(
    api.departments.list,
    selectionMode === "department" ? { includeInactive: false } : "skip"
  );

  // Create mutations
  const createAgency = useMutation(api.implementingAgencies.create);
  const createDepartment = useMutation(api.departments.create);

  // Determine which list to use based on selection mode
  const currentList = React.useMemo(() => {
    if (!selectionMode) return [];
    
    if (selectionMode === "agency") {
      return allAgencies || [];
    } else {
      return allDepartments?.map(dept => ({
        _id: dept._id,
        code: dept.code,
        fullName: dept.name,
        type: "department" as const,
        category: "Department",
        isActive: dept.isActive,
      })) || [];
    }
  }, [selectionMode, allAgencies, allDepartments]);

  // Filter based on search
  const filteredList = React.useMemo(() => {
    if (!searchQuery) return currentList;

    const query = searchQuery.toLowerCase();
    return currentList.filter(
      (item) =>
        item.code.toLowerCase().includes(query) ||
        item.fullName.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query))
    );
  }, [currentList, searchQuery]);

  // Display only a subset for performance
  const displayedItems = filteredList.slice(0, displayedCount);
  const hasMore = displayedCount < filteredList.length;

  // Get selected item details
  const selectedItem = React.useMemo(() => {
    // Check in agencies
    const agency = allAgencies?.find((a) => a.code === value);
    if (agency) return { ...agency, sourceType: "agency" as const };

    // Check in departments
    const dept = allDepartments?.find((d) => d.code === value);
    if (dept) {
      return {
        code: dept.code,
        fullName: dept.name,
        type: "department" as const,
        category: "Department",
        sourceType: "department" as const,
      };
    }

    return null;
  }, [allAgencies, allDepartments, value]);

  // Validate if search query can be a new code
  const canCreateNew = React.useMemo(() => {
    if (!searchQuery || searchQuery.length === 0 || !selectionMode) return false;

    const upperSearch = searchQuery.toUpperCase();

    if (selectionMode === "agency") {
      // Check format for agency (uppercase alphanumeric, spaces, and underscores)
      const validFormat = /^[A-Z0-9_ ]+$/.test(upperSearch);
      if (!validFormat) return false;

      // Check if already exists
      const exists = allAgencies?.some((a) => a.code.toUpperCase() === upperSearch);
      if (exists) return false;

      return true;
    } else {
      // Check format for department (uppercase alphanumeric and underscores)
      const validFormat = /^[A-Z0-9_]+$/.test(upperSearch);
      if (!validFormat) return false;

      // Check if already exists
      const exists = allDepartments?.some((d) => d.code.toUpperCase() === upperSearch);
      if (exists) return false;

      return true;
    }
  }, [searchQuery, selectionMode, allAgencies, allDepartments]);

  // Handle creating new item
  const handleCreateNew = async () => {
    if (!canCreateNew || !selectionMode) return;
    const code = searchQuery.toUpperCase();

    try {
      setIsCreating(true);

      if (selectionMode === "agency") {
        await createAgency({
          code,
          fullName: code,
          type: "external",
          description: `Custom implementing agency: ${code}`,
          category: "Custom",
        });

        toast.success("Implementing agency created!", {
          description: `"${code}" has been added. You can edit details in Settings.`,
        });
      } else {
        await createDepartment({
          name: code,
          code,
          description: `Custom department: ${code}`,
          isActive: true,
        });

        toast.success("Department created!", {
          description: `"${code}" has been added. You can edit details in Settings.`,
        });
      }

      // Select the newly created item
      onChange(code);
      setSearchQuery("");
      setSelectionMode(null);
      setOpen(false);
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error(`Failed to create ${selectionMode}`, {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Load more items
  const loadMore = () => {
    setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // Handle select
  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue);
    setOpen(false);
    setSearchQuery("");
    setSelectionMode(null);
    setDisplayedCount(ITEMS_PER_PAGE);
  };

  // Reset when search or mode changes
  React.useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectionMode]);

  // Reset mode when closing
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectionMode(null);
      setSearchQuery("");
      setDisplayedCount(ITEMS_PER_PAGE);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100",
              !value && "text-zinc-500 dark:text-zinc-400",
              error && "border-red-500 dark:border-red-500"
            )}
          >
            {value ? (
              <span className="flex items-center gap-2">
                {selectedItem?.sourceType === "department" ? (
                  <Building2 className="h-4 w-4 text-blue-500" />
                ) : (
                  <Users className="h-4 w-4 text-green-500" />
                )}
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {value}
                </span>
                {selectedItem && (
                  <span className="text-sm truncate">{selectedItem.fullName}</span>
                )}
              </span>
            ) : (
              "Select implementing office..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          {!selectionMode ? (
            // Mode Selection View
            <div className="p-4 space-y-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                Select source type:
              </p>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => setSelectionMode("agency")}
              >
                <Users className="h-5 w-5 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">Implementing Agency/Office</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    External agencies, contractors, or custom offices
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => setSelectionMode("department")}
              >
                <Building2 className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Department</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Internal departments and organizational units
                  </div>
                </div>
              </Button>
            </div>
          ) : (
            // Item Selection View
            <Command shouldFilter={false}>
              <div className="flex items-center border-b px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectionMode(null);
                    setSearchQuery("");
                  }}
                  className="mr-2"
                >
                  ← Back
                </Button>
                <div className="flex items-center gap-2 flex-1">
                  {selectionMode === "department" ? (
                    <Building2 className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Users className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium">
                    {selectionMode === "department" ? "Departments" : "Agencies"}
                  </span>
                </div>
              </div>
              <CommandInput
                placeholder={`Search ${selectionMode === "department" ? "departments" : "agencies"}...`}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {allAgencies === undefined || allDepartments === undefined ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    <span className="ml-2 text-sm text-zinc-500">Loading...</span>
                  </div>
                ) : filteredList.length === 0 ? (
                  <CommandEmpty>
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      <AlertCircle className="h-8 w-8 text-zinc-400 mb-2" />
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        No {selectionMode === "department" ? "departments" : "agencies"} found
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Try a different search term or create a new one
                      </p>
                    </div>
                  </CommandEmpty>
                ) : (
                  <>
                    <CommandGroup>
                      {displayedItems.map((item) => (
                        <CommandItem
                          key={item._id}
                          value={item.code}
                          onSelect={() => handleSelect(item.code)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === item.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {selectionMode === "department" ? (
                              <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                            ) : (
                              <Users className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">
                              {item.code}
                            </span>
                            <span className="text-sm truncate flex-1">
                              {item.fullName}
                            </span>
                            {(item as any).usageCount !== undefined &&
                              (item as any).usageCount > 0 && (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                                  ({(item as any).usageCount})
                                </span>
                              )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>

                    {hasMore && (
                      <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={loadMore}
                        >
                          Load more ({filteredList.length - displayedCount} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Create New Section */}
                {searchQuery.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      {canCreateNew && (selectionMode === "agency" ? isAgencyCodeAvailable : true) ? (
                        <CommandItem
                          onSelect={handleCreateNew}
                          disabled={isCreating}
                          className="cursor-pointer bg-blue-50 dark:bg-blue-950/20 aria-selected:bg-blue-100 dark:aria-selected:bg-blue-950/40"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span className="text-sm">Creating...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              <div className="flex flex-col flex-1">
                                <span className="text-sm font-medium">
                                  Create "{searchQuery.toUpperCase()}"
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  Add as new {selectionMode === "department" ? "department" : "implementing agency"}
                                </span>
                              </div>
                            </>
                          )}
                        </CommandItem>
                      ) : (
                        !canCreateNew && (
                          <div className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                            {selectionMode === "agency" ? (
                              !/^[A-Z0-9_ ]+$/.test(searchQuery.toUpperCase()) ? (
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Invalid format</p>
                                    <p className="mt-0.5">
                                      Code must contain only uppercase letters, numbers, spaces, and underscores
                                    </p>
                                  </div>
                                </div>
                              ) : allAgencies?.some((a) => a.code.toUpperCase() === searchQuery.toUpperCase()) ? (
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Already exists</p>
                                    <p className="mt-0.5">This agency is already in the list above</p>
                                  </div>
                                </div>
                              ) : null
                            ) : (
                              !/^[A-Z0-9_]+$/.test(searchQuery.toUpperCase()) ? (
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Invalid format</p>
                                    <p className="mt-0.5">
                                      Code must contain only uppercase letters, numbers, and underscores (no spaces)
                                    </p>
                                  </div>
                                </div>
                              ) : allDepartments?.some((d) => d.code.toUpperCase() === searchQuery.toUpperCase()) ? (
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Already exists</p>
                                    <p className="mt-0.5">This department is already in the list above</p>
                                  </div>
                                </div>
                              ) : null
                            )}
                          </div>
                        )
                      )}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>

      {/* Display selected item info */}
      {selectedItem && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <span className="font-medium">Type:</span>
          <span>
            {selectedItem.sourceType === "department" ? "Department" : "Implementing Agency"}
          </span>
          {selectedItem.category && selectedItem.sourceType !== "department" && (
            <>
              <span className="mx-1">•</span>
              <span>{selectedItem.category}</span>
            </>
          )}
          {(selectedItem as any).usageCount !== undefined && (selectedItem as any).usageCount > 0 && (
            <>
              <span className="mx-1">•</span>
              <span>Used in {(selectedItem as any).usageCount} project(s)</span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}