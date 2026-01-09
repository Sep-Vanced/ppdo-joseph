// components/FormulaBar.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CellPosition } from "@/types/spreadsheet"
import { Type, ChevronDown } from "lucide-react"

interface FormulaBarProps {
  selectedCell: CellPosition
  formulaBarValue: string
  columns: string[]
  onFormulaBarChange: (value: string) => void
}

export function FormulaBar({ selectedCell, formulaBarValue, columns, onFormulaBarChange }: FormulaBarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="h-7 w-20 justify-start px-2 text-sm font-medium">
          {columns[selectedCell.col]}
          {selectedCell.row}
          <ChevronDown className="ml-auto h-3 w-3" />
        </Button>
        <div className="flex h-7 items-center px-2 text-sm text-gray-700">
          <Type className="h-4 w-4" />
        </div>
      </div>
      <Input
        value={formulaBarValue}
        onChange={(e) => onFormulaBarChange(e.target.value)}
        className="h-8 flex-1 border-none bg-transparent px-2 focus-visible:ring-0"
        placeholder=""
      />
    </div>
  )
}