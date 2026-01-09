// components/SpreadsheetGrid.tsx
"use client"

import { useEffect, useRef } from "react"
import { SpreadsheetCell } from "./SpreadsheetCell"
import type { CellPosition, CellData } from "@/types/spreadsheet"

interface SpreadsheetGridProps {
  columns: string[]
  rows: number[]
  selectedCell: CellPosition
  cellData: CellData
  editingCell: string | null
  getCellKey: (row: number, col: number) => string
  onCellClick: (row: number, col: number) => void
  onCellDoubleClick: (row: number, col: number) => void
  onCellChange: (row: number, col: number, value: string) => void
  onEditingCellChange: (cell: string | null) => void
}

const COLUMN_HEADERS = [
  "PARTICULARS",
  "TOTAL BUDGET ALLOCATED",
  "TOTAL BUDGET UTILIZED",
  "UTILIZATION RATE",
  "PROJECT COMPLETED (%)",
  "PROJECT DELAYED (%)",
  "PROJECTS ON TRACK (%)",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  ""
]

export function SpreadsheetGrid({
  columns,
  rows,
  selectedCell,
  cellData,
  editingCell,
  getCellKey,
  onCellClick,
  onCellDoubleClick,
  onCellChange,
  onEditingCellChange,
}: SpreadsheetGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is editing a cell
      if (editingCell) return

      const maxCol = 14 // 0-14 (15 columns shown)
      const maxRow = 25 // rows 1-25 shown

      let newRow = selectedCell.row
      let newCol = selectedCell.col

      // If user types a printable character, start editing the cell
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const cellKey = getCellKey(selectedCell.row, selectedCell.col)
        onEditingCellChange(cellKey)
        // The character will be captured by the input field
        return
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          if (newRow > 1) newRow--
          break
        case "ArrowDown":
          e.preventDefault()
          if (newRow < maxRow) newRow++
          break
        case "ArrowLeft":
          e.preventDefault()
          if (newCol > 0) newCol--
          break
        case "ArrowRight":
          e.preventDefault()
          if (newCol < maxCol) newCol++
          break
        case "Enter":
          e.preventDefault()
          if (newRow < maxRow) newRow++
          break
        case "Tab":
          e.preventDefault()
          if (e.shiftKey) {
            if (newCol > 0) newCol--
          } else {
            if (newCol < maxCol) newCol++
          }
          break
        case "Delete":
        case "Backspace":
          e.preventDefault()
          // Clear the cell content
          onCellChange(selectedCell.row, selectedCell.col, "")
          break
        case "F2":
          e.preventDefault()
          // Start editing without clearing content
          const cellKey = getCellKey(selectedCell.row, selectedCell.col)
          onEditingCellChange(cellKey)
          break
        case "Escape":
          e.preventDefault()
          onEditingCellChange(null)
          break
        default:
          return
      }

      if (newRow !== selectedCell.row || newCol !== selectedCell.col) {
        onCellClick(newRow, newCol)
        
        // Scroll the selected cell into view if needed
        const cellElement = gridRef.current?.querySelector(
          `[data-cell="${getCellKey(newRow, newCol)}"]`
        )
        cellElement?.scrollIntoView({ block: "nearest", inline: "nearest" })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedCell, editingCell, onCellClick, getCellKey, onEditingCellChange, onCellChange])

  return (
    <div className="flex flex-1 overflow-hidden" ref={gridRef}>
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Column Letters */}
        <div className="sticky top-0 z-20 flex bg-[#f8f9fa]">
          <div className="sticky left-0 z-30 h-[30px] w-[46px] border-b border-r border-gray-300 bg-[#f8f9fa]" />
          {columns.slice(0, 15).map((col) => (
            <div
              key={col}
              className="flex h-[30px] w-[100px] items-center justify-center border-b border-r border-gray-300 bg-[#f8f9fa] text-xs font-medium text-gray-700"
            >
              {col}
            </div>
          ))}
        </div>

        {/* Column Headers */}
        <div className="sticky top-[30px] z-20 flex bg-[#f8f9fa]">
          <div className="sticky left-0 z-30 h-[30px] w-[46px] border-b border-r border-gray-300 bg-[#f8f9fa]" />
          {COLUMN_HEADERS.map((header, index) => (
            <div
              key={`header-${index}`}
              className="flex h-[30px] w-[100px] items-center justify-center border-b border-r border-gray-300 bg-[#f8f9fa] px-1 text-[10px] font-semibold text-gray-700 uppercase"
            >
              {header}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.slice(0, 25).map((row) => (
          <div key={row} className="flex">
            {/* Row Header */}
            <div className="sticky left-0 z-10 flex h-[21px] w-[46px] items-center justify-center border-b border-r border-gray-300 bg-[#f8f9fa] text-xs text-gray-700">
              {row}
            </div>

            {/* Cells */}
            {columns.slice(0, 15).map((col, colIndex) => {
              const cellKey = getCellKey(row, colIndex)
              const isSelected = selectedCell.row === row && selectedCell.col === colIndex
              const isEditing = editingCell === cellKey

              return (
                <SpreadsheetCell
                  key={cellKey}
                  cellKey={cellKey}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  cellData={cellData}
                  onClick={() => onCellClick(row, colIndex)}
                  onDoubleClick={() => onCellDoubleClick(row, colIndex)}
                  onChange={(value) => onCellChange(row, colIndex, value)}
                  onBlur={() => onEditingCellChange(null)}
                  dataCellAttr={cellKey}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}