// app/dashboard/project/budget/[particularId]/components/ProjectCategoryCombobox.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, AlertCircle, Tag, Sparkles } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useDebounce } from "@/app/hooks/use-debounce";

interface ProjectCategoryComboboxProps {
  value?: Id<"projectCategories">;
  onChange: (value: Id<"projectCategories"> | undefined) => void;
  disabled?: boolean;
  error?: string;
  hideInfoText?: boolean;
}

const ITEMS_PER_PAGE = 20;

export function ProjectCategoryCombobox({
  value,
  onChange,
  disabled,
  error,
  hideInfoText = false,
}: ProjectCategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [displayedCount, setDisplayedCount] = React.useState(ITEMS_PER_PAGE);
  
  // Debounce search query for validation
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Fetch all active project categories
  const allCategories = useQuery(api.projectCategories.list, {});
  
  // Check if code is available (for validation when creating)
  const isCodeAvailable = React.useMemo(() => {
    if (!debouncedSearch || debouncedSearch.trim().length === 0) return false;
    if (!allCategories) return false;
    
    const trimmedSearch = debouncedSearch.trim();
    const upperSearch = trimmedSearch.toUpperCase();
    const exists = allCategories.some(
      (c) => c.code.toUpperCase() === upperSearch || 
             c.fullName.toUpperCase() === upperSearch
    );
    
    return !exists;
  }, [debouncedSearch, allCategories]);
  
  // Create mutation
  const createCategory = useMutation(api.projectCategories.create);
  
  // Filter categories based on search
  const filteredCategories = React.useMemo(() => {
    if (!allCategories) return [];
    
    if (!searchQuery) return allCategories;
    
    const query = searchQuery.toLowerCase();
    return allCategories.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.fullName.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
    );
  }, [allCategories, searchQuery]);
  
  // Display only a subset for performance
  const displayedCategories = filteredCategories.slice(0, displayedCount);
  const hasMore = displayedCount < filteredCategories.length;
  
  // Get selected category details
  const selectedCategory = React.useMemo(() => {
    if (!value || !allCategories) return null;
    return allCategories.find((c) => c._id === value);
  }, [allCategories, value]);
  
  // ✅ UPDATED: Validate if search query can be a new code (now allows spaces and %)
  const canCreateNew = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) return false;
    
    const trimmedSearch = searchQuery.trim();
    const upperSearch = trimmedSearch.toUpperCase();
    
    // ✅ UPDATED: Check format (uppercase alphanumeric, underscores, spaces, and percentage signs)
    const validFormat = /^[A-Z0-9_%\s,.\-@]+$/.test(upperSearch);
    if (!validFormat) return false;
    
    // Check if already exists
    return isCodeAvailable;
  }, [searchQuery, isCodeAvailable]);
  
  // Handle creating new category
  const handleCreateNew = async () => {
    if (!canCreateNew) return;
    
    const code = searchQuery.trim().toUpperCase();
    
    try {
      setIsCreating(true);
      
      // Create with code as both code and full name initially
      const categoryId = await createCategory({
        code,
        fullName: code, // User can edit this later
        description: `Custom project category: ${code}`,
        colorCode: "#3B82F6", // Default blue color
        iconName: "folder",
      });
      
      toast.success("Category created!", {
        description: `"${code}" has been added. You can edit details in Settings.`,
      });
      
      // Select the newly created item
      onChange(categoryId);
      setSearchQuery("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category", {
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
  const handleSelect = (currentValue: Id<"projectCategories"> | "none") => {
    if (currentValue === "none") {
      onChange(undefined);
    } else {
      onChange(currentValue === value ? undefined : currentValue);
    }
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
            {value && selectedCategory ? (
              <div className="flex items-center gap-2">
                {selectedCategory.colorCode && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedCategory.colorCode }}
                  />
                )}
                <span className="font-medium truncate">
                  {selectedCategory.fullName}
                </span>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {selectedCategory.code}
                </Badge>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 opacity-50" />
                Select category (optional)...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search categories..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {allCategories === undefined ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="ml-2 text-sm text-zinc-500">Loading...</span>
                </div>
              ) : (
                <>
                  <CommandGroup>
                    {/* No Category Option */}
                    <CommandItem
                      value="none"
                      onSelect={() => handleSelect("none")}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Tag className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          No Category
                        </span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                  
                  {filteredCategories.length === 0 && searchQuery ? (
                    <CommandEmpty>
                      <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                        <AlertCircle className="h-8 w-8 text-zinc-400 mb-2" />
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          No categories found
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Try a different search or create a new category
                        </p>
                      </div>
                    </CommandEmpty>
                  ) : (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Categories">
                        {displayedCategories.map((category) => (
                          <CommandItem
                            key={category._id}
                            value={category._id}
                            onSelect={() => handleSelect(category._id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                value === category._id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {category.colorCode && (
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: category.colorCode }}
                                />
                              )}
                              <span className="text-sm font-medium truncate flex-1">
                                {category.fullName}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {category.code}
                                </Badge>
                                {category.usageCount !== undefined &&
                                  category.usageCount > 0 && (
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                      ({category.usageCount})
                                    </span>
                                  )}
                              </div>
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
                            Load more ({filteredCategories.length - displayedCount}{" "}
                            remaining)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              
              {/* Create New Section */}
              {searchQuery.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {canCreateNew ? (
                      <CommandItem
                        onSelect={handleCreateNew}
                        disabled={isCreating}
                        className="cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 aria-selected:from-blue-100 aria-selected:to-indigo-100 dark:aria-selected:from-blue-950/40 dark:aria-selected:to-indigo-950/40"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span className="text-sm">Creating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <div className="flex flex-col flex-1">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                Create "{searchQuery.trim().toUpperCase()}"
                              </span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Add as new project category
                              </span>
                            </div>
                          </>
                        )}
                      </CommandItem>
                    ) : (
                      <div className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {/* ✅ UPDATED: Error message for new validation */}
                        {!/^[A-Z0-9_%\s,.\-@]+$/i.test(searchQuery.trim()) ? (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
                            <div>
                              <p className="font-medium text-orange-700 dark:text-orange-400">
                                Invalid format
                              </p>
                              <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                                Code can only contain letters, numbers, underscores, percentage signs, spaces, commas, periods, hyphens, and @
                              </p>
                            </div>
                          </div>
                        ) : !isCodeAvailable ? (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                            <div>
                              <p className="font-medium text-red-700 dark:text-red-400">
                                Already exists
                              </p>
                              <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                                This category is already in the list above
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Display selected category info */}
      {selectedCategory && (
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
          <div className="flex items-center gap-2">
            {selectedCategory.colorCode && (
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: selectedCategory.colorCode }}
              />
            )}
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {selectedCategory.fullName}
            </span>
            <Badge variant="secondary" className="text-xs font-mono ml-auto">
              {selectedCategory.code}
            </Badge>
          </div>
          
          {selectedCategory.description && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {selectedCategory.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            {selectedCategory.usageCount !== undefined &&
              selectedCategory.usageCount > 0 && (
                <>
                  <span className="font-medium">Usage:</span>
                  <span>Used in {selectedCategory.usageCount} project(s)</span>
                </>
              )}
            {selectedCategory.isSystemDefault && (
              <>
                {selectedCategory.usageCount !== undefined && selectedCategory.usageCount > 0 && (
                  <span className="mx-1">•</span>
                )}
                <Badge variant="outline" className="text-xs">
                  System Default
                </Badge>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* No category selected info */}
      {!value && !selectedCategory && !hideInfoText && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          No category assigned. Categories are optional and help organize projects.
        </p>
      )}
      
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}