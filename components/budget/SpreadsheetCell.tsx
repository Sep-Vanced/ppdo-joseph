// components/SpreadsheetCell.tsx
"use client"

import { useEffect, useRef } from "react"
import type { CellData } from "@/types/spreadsheet"

interface SpreadsheetCellProps {
  cellKey: string
  isSelected: boolean
  isEditing: boolean
  cellData: CellData
  onClick: () => void
  onDoubleClick: () => void
  onChange: (value: string) => void
  onBlur: () => void
  dataCellAttr?: string
}

export function SpreadsheetCell({
  cellKey,
  isSelected,
  isEditing,
  cellData,
  onClick,
  onDoubleClick,
  onChange,
  onBlur,
  dataCellAttr,
}: SpreadsheetCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <div
      className={`relative h-[21px] w-[100px] border-b border-r border-gray-300 ${
        isSelected ? "ring-2 ring-blue-500 ring-inset" : ""
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      data-cell={dataCellAttr}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={cellData[cellKey] || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault()
              onBlur()
            }
            if (e.key === "Escape") {
              e.preventDefault()
              onBlur()
            }
          }}
          className="h-full w-full border-none px-1 text-xs outline-none"
        />
      ) : (
        <div className="flex h-full items-center px-1 text-xs text-gray-900">
          {cellData[cellKey] || ""}
        </div>
      )}
      {isSelected && !isEditing && <div className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-blue-500" />}
    </div>
  )
}