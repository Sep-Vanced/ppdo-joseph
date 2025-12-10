// app/dashboard/budget/[particularId]/[projectId]/utils.ts

import { FinancialBreakdownItem } from "../../types";

// Helper function to recursively find and update an item in hierarchical structure
export function updateItemInHierarchy(
  items: FinancialBreakdownItem[],
  id: string,
  updates: Partial<Omit<FinancialBreakdownItem, "id" | "children">>
): FinancialBreakdownItem[] {
  return items.map((item) => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.children) {
      return {
        ...item,
        children: updateItemInHierarchy(item.children, id, updates),
      };
    }
    return item;
  });
}

// Helper function to recursively find and delete an item in hierarchical structure
export function deleteItemFromHierarchy(
  items: FinancialBreakdownItem[],
  id: string
): FinancialBreakdownItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: deleteItemFromHierarchy(item.children, id),
        };
      }
      return item;
    });
}

// Helper function to recursively add an item to hierarchical structure
export function addItemToHierarchy(
  items: FinancialBreakdownItem[],
  parentId: string | null,
  newItem: Omit<FinancialBreakdownItem, "id" | "children">
): FinancialBreakdownItem[] {
  if (!parentId) {
    // Add to root level
    return [
      ...items,
      { ...newItem, id: Date.now().toString(), children: [] },
    ];
  }

  return items.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        children: [
          ...(item.children || []),
          { ...newItem, id: Date.now().toString(), children: [] },
        ],
      };
    }
    if (item.children) {
      return {
        ...item,
        children: addItemToHierarchy(item.children, parentId, newItem),
      };
    }
    return item;
  });
}

