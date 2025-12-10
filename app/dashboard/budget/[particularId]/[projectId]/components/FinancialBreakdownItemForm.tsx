// app/dashboard/budget/[particularId]/[projectId]/components/FinancialBreakdownItemForm.tsx

"use client";

import { useState, useEffect } from "react";
import { FinancialBreakdownItem } from "../../../types";
import { useAccentColor } from "../../../../contexts/AccentColorContext";

interface FinancialBreakdownItemFormProps {
  item?: FinancialBreakdownItem | null;
  onSave: (item: Omit<FinancialBreakdownItem, "id" | "children">) => void;
  onCancel: () => void;
}

export function FinancialBreakdownItemForm({
  item,
  onSave,
  onCancel,
}: FinancialBreakdownItemFormProps) {
  const { accentColorValue } = useAccentColor();
  const [formData, setFormData] = useState({
    code: item?.code || "",
    description: item?.description || "",
    appropriation: item?.appropriation || 0,
    obligation: item?.obligation || 0,
    balance: item?.balance || 0,
    level: item?.level || 0,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code || "",
        description: item.description,
        appropriation: item.appropriation,
        obligation: item.obligation,
        balance: item.balance,
        level: item.level,
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Recalculate balance if needed
    const calculatedBalance = formData.appropriation - formData.obligation;
    onSave({
      ...formData,
      balance: calculatedBalance >= 0 ? calculatedBalance : formData.balance,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Code (e.g., A, A.1, A.1.1)
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0"
            placeholder="A.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Level
          </label>
          <select
            value={formData.level}
            onChange={(e) =>
              setFormData({ ...formData, level: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0"
            required
          >
            <option value={0}>Main Section (0)</option>
            <option value={1}>Sub-item (1)</option>
            <option value={2}>Sub-sub-item (2)</option>
            <option value={3}>Sub-sub-sub-item (3)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Appropriation
          </label>
          <input
            type="number"
            value={formData.appropriation}
            onChange={(e) => {
              const appropriation = parseFloat(e.target.value) || 0;
              setFormData({
                ...formData,
                appropriation,
                balance: appropriation - formData.obligation,
              });
            }}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Obligation
          </label>
          <input
            type="number"
            value={formData.obligation}
            onChange={(e) => {
              const obligation = parseFloat(e.target.value) || 0;
              setFormData({
                ...formData,
                obligation,
                balance: formData.appropriation - obligation,
              });
            }}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Balance (Auto-calculated)
          </label>
          <input
            type="number"
            value={formData.balance}
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md text-white"
          style={{ backgroundColor: accentColorValue }}
        >
          {item ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
