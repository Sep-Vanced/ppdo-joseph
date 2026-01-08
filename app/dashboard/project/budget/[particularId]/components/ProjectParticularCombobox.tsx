// app/dashboard/project/budget/[particularId]/components/ProjectParticularCombobox.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, AlertCircle } from "lucide-react";
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
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useDebounce } from "@/app/hooks/use-debounce";

interface ProjectParticularComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

const ITEMS_PER_PAGE = 20;

export function ProjectParticularCombobox({
  value,
  onChange,
  disabled,
  error,
}: ProjectParticularComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [displayedCount, setDisplayedCount] = React.useState(ITEMS_PER_PAGE);
  
  // Debounce search query for validation
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Fetch all project particulars
  const allParticulars = useQuery(api.projectParticulars.list, {
    includeInactive: false,
  });
  
  // Check if code is available (for validation)
  const isCodeAvailable = useQuery(
    api.projectParticulars.isCodeAvailable,
    debouncedSearch && debouncedSearch.length > 0
      ? { code: debouncedSearch.trim().toUpperCase() }
      : "skip"
  );
  
  // Create mutation
  const createParticular = useMutation(api.projectParticulars.create);
  
  // Filter particulars based on search
  const filteredParticulars = React.useMemo(() => {
    if (!allParticulars) return [];
    
    if (!searchQuery) return allParticulars;
    
    const query = searchQuery.toLowerCase();
    return allParticulars.filter(
      (p) =>
        p.code.toLowerCase().includes(query) ||
        p.fullName.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
    );
  }, [allParticulars, searchQuery]);
  
  // Display only a subset for performance
  const displayedParticulars = filteredParticulars.slice(0, displayedCount);
  const hasMore = displayedCount < filteredParticulars.length;
  
  // Get selected particular details
  const selectedParticular = React.useMemo(() => {
    return allParticulars?.find((p) => p.code === value);
  }, [allParticulars, value]);
  
  // ✅ UPDATED: Validate if search query can be a new code (allows accented letters, spaces, %, commas, periods, hyphens, and @)
  const canCreateNew = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) return false;
    
    const trimmedSearch = searchQuery.trim();
    const upperSearch = trimmedSearch.toUpperCase();
    
    // ✅ UPDATED: Check format using Unicode letters (including accents) and allowed symbols
    const validFormat = /^[\p{L}0-9_%\s,.\-@]+$/u.test(upperSearch);
    if (!validFormat) return false;
    
    // Check if already exists in list
    const exists = allParticulars?.some(
      (p) => p.code.toUpperCase() === upperSearch
    );
    if (exists) return false;
    
    return true;
  }, [searchQuery, allParticulars]);
  
  // Handle creating new particular
  const handleCreateNew = async () => {
    if (!canCreateNew) return;
    
    const code = searchQuery.trim().toUpperCase();
    
    try {
      setIsCreating(true);
      
      // Create with code as both code and full name initially
      await createParticular({
        code,
        fullName: code, // User can edit this later in admin panel
        description: `Custom project particular: ${code}`,
        category: "Custom",
      });
      
      toast.success("Project particular created!", {
        description: `"${code}" has been added. You can edit details in Settings.`,
      });
      
      // Select the newly created item
      onChange(code);
      setSearchQuery("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating particular:", error);
      toast.error("Failed to create particular", {
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
    setDisplayedCount(ITEMS_PER_PAGE);
  };
  
  // Reset display count when search changes
  React.useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery]);
  
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
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
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {value}
                </span>
                {selectedParticular && (
                  <span className="text-sm truncate">
                    {selectedParticular.fullName}
                  </span>
                )}
              </span>
            ) : (
              "Select project particular..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search project particulars..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {allParticulars === undefined ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="ml-2 text-sm text-zinc-500">Loading...</span>
                </div>
              ) : filteredParticulars.length === 0 ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                    <AlertCircle className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      No particulars found
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Try a different search term
                    </p>
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  <CommandGroup>
                    {displayedParticulars.map((particular) => (
                      <CommandItem
                        key={particular._id}
                        value={particular.code}
                        onSelect={() => handleSelect(particular.code)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === particular.code
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">
                            {particular.code}
                          </span>
                          <span className="text-sm truncate flex-1">
                            {particular.fullName}
                          </span>
                          {particular.usageCount !== undefined &&
                            particular.usageCount > 0 && (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                                ({particular.usageCount})
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
                        Load more ({filteredParticulars.length - displayedCount}{" "}
                        remaining)
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
                    {canCreateNew && isCodeAvailable ? (
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
                                Create "{searchQuery.trim().toUpperCase()}"
                              </span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Add as new project particular
                              </span>
                            </div>
                          </>
                        )}
                      </CommandItem>
                    ) : (
                      !canCreateNew && (
                        <div className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                          {/* ✅ UPDATED: Error message for new validation */}
                          {!/^[A-Z0-9_%\s,.\-@]+$/i.test(searchQuery.trim()) ? (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">Invalid format</p>
                                <p className="mt-0.5">
                                  Code can only contain letters, numbers, underscores, percentage signs, spaces, commas, periods, hyphens, and @
                                </p>
                              </div>
                            </div>
                          ) : allParticulars?.some(
                              (p) => p.code.toUpperCase() === searchQuery.trim().toUpperCase()
                            ) ? (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">Already exists</p>
                                <p className="mt-0.5">
                                  This particular is already in the list above
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Display selected particular info */}
      {selectedParticular && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <span className="font-medium">Category:</span>
          <span>{selectedParticular.category || "N/A"}</span>
          {selectedParticular.usageCount !== undefined &&
            selectedParticular.usageCount > 0 && (
              <>
                <span className="mx-1">•</span>
                <span>Used in {selectedParticular.usageCount} project(s)</span>
              </>
            )}
        </div>
      )}
      
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}