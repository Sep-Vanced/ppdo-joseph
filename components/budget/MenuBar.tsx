// components/MenuBar.tsx
"use client"

import { Button } from "@/components/ui/button"

const MENU_ITEMS = ["File", "Edit", "View", "Insert", "Format", "Data", "Tools", "Extensions", "Help"]

export function MenuBar() {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 py-1 text-sm">
      {MENU_ITEMS.map((item) => (
        <Button key={item} variant="ghost" className="h-8 px-3 text-sm font-normal text-gray-700 hover:bg-gray-100">
          {item}
        </Button>
      ))}
    </div>
  )
}