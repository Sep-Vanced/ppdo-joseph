// app/dashboard/project/budget/components/MainSheet.tsx
"use client"

import { useState, useCallback } from "react"
import { SpreadsheetHeader } from "./SpreadsheetHeader"
import { MenuBar } from "./MenuBar"
import { Toolbar } from "./Toolbar"
import { FormulaBar } from "./FormulaBar"
import { SpreadsheetGrid } from "./SpreadsheetGrid"
import { SheetTabs } from "./SheetTabs"
import { getCellKey as getCellKeyUtil } from "@/utils/spreadsheet"
import type { CellPosition, CellData } from "@/types/spreadsheet"
import { COLUMNS, ROWS } from "@/constants/spreadsheet"



export default function MainSheet() {
  const [selectedCell, setSelectedCell] = useState<CellPosition>({ row: 1, col: 0 })
  const [cellData, setCellData] = useState<CellData>({})
  const [formulaBarValue, setFormulaBarValue] = useState("")
  const [editingCell, setEditingCell] = useState<string | null>(null)

  const getCellKey = useCallback((row: number, col: number) => 
    getCellKeyUtil(row, col, COLUMNS), [])

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col })
    const cellKey = getCellKey(row, col)
    setFormulaBarValue(cellData[cellKey] || "")
    setEditingCell(null)
  }, [getCellKey, cellData])

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    const cellKey = getCellKey(row, col)
    setEditingCell(cellKey)
  }, [getCellKey])

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    const cellKey = getCellKey(row, col)
    setCellData(prev => ({ ...prev, [cellKey]: value }))
    setFormulaBarValue(value)
  }, [getCellKey])

  const handleFormulaBarChange = useCallback((value: string) => {
    setFormulaBarValue(value)
    const cellKey = getCellKey(selectedCell.row, selectedCell.col)
    setCellData(prev => ({ ...prev, [cellKey]: value }))
  }, [getCellKey, selectedCell.row, selectedCell.col])

  const handleEditingCellChange = useCallback((cell: string | null) => {
    setEditingCell(cell)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-[#f9fbfd]">
      <SpreadsheetHeader />
      <MenuBar />
      {/* <Toolbar /> */}
      <FormulaBar
        selectedCell={selectedCell}
        formulaBarValue={formulaBarValue}
        columns={COLUMNS}
        onFormulaBarChange={handleFormulaBarChange}
      />
      <SpreadsheetGrid
        columns={COLUMNS}
        rows={ROWS}
        selectedCell={selectedCell}
        cellData={cellData}
        editingCell={editingCell}
        getCellKey={getCellKey}
        onCellClick={handleCellClick}
        onCellDoubleClick={handleCellDoubleClick}
        onCellChange={handleCellChange}
        onEditingCellChange={handleEditingCellChange}
      />
      <SheetTabs />
    </div>
  )
}