// components/SpreadsheetHeader.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Star, Grid3x3, Video, Lock, ChevronDown } from "lucide-react"

export function SpreadsheetHeader() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded bg-[#0f9d58]">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div> */}
          <div className="flex items-center gap-2">
            <span className="text-lg text-gray-800">Budget Tracking</span>
            {/* <Button variant="ghost" size="icon" className="h-8 w-8">
              <Star className="h-5 w-5 text-gray-600" />
            </Button> */}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mr-12">
        <Button className="h-9 gap-2 rounded-full bg-[#c2e7ff] text-[#001d35] hover:bg-[#a8d4ff]">
          <Lock className="h-4 w-4" />
          Share
          <ChevronDown className="h-3 w-3" />
        </Button>
        {/* <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <div className="h-8 w-8 rounded-full bg-[#8430ce] text-white flex items-center justify-center text-sm">
            ★
          </div>
        </Button> */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <div className="h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center">👤</div>
        </Button>
      </div>
    </header>
  )
}