// components/SheetTabs.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Plus, Menu, ChevronDown } from "lucide-react"

export function SheetTabs() {
  return (
    <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-2">
      <Button variant="ghost" size="icon" className="h-6 w-6">
        <Plus className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6">
        <Menu className="h-4 w-4 text-gray-700" />
      </Button>
      <Button
        variant="ghost"
        className="h-7 gap-1 bg-[#e8f0fe] px-3 text-sm font-medium text-[#1a73e8] hover:bg-[#d2e3fc]"
      >
        Sheet1
        <ChevronDown className="h-3 w-3" />
      </Button>
    </div>
  )
}
