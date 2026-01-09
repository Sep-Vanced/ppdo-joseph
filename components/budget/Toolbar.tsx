// components/Toolbar.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Search,
  Undo2,
  Redo2,
  Printer,
  PaintBucket,
  Type,
  DollarSign,
  Percent,
  Bold,
  Italic,
  Underline,
  Link2,
  MessageSquare,
  ImageIcon,
  Filter,
  Grid3x3,
  SigmaIcon,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  ChevronUp,
} from "lucide-react"

export function Toolbar() {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 py-2">
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Search className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Undo2 className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Redo2 className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Printer className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <PaintBucket className="h-4 w-4 text-gray-700" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-300" />

      <Button variant="ghost" className="h-7 gap-1 px-2 text-sm">
        100% <ChevronDown className="h-3 w-3" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-300" />

      <Button variant="ghost" size="icon" className="h-8 w-8">
        <DollarSign className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Percent className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <span className="text-sm">123</span>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <span className="text-sm">.0</span>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <span className="text-sm">.00</span>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <span className="text-sm">123</span>
      </Button>

      <Button variant="ghost" className="h-7 gap-1 px-2 text-sm">
        Default <ChevronDown className="h-3 w-3" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-300" />

      <Button variant="ghost" className="h-7 w-16 px-2 text-sm">
        10 <ChevronDown className="h-3 w-3" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-300" />

      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Bold className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Italic className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Underline className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Type className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <PaintBucket className="h-4 w-4 text-gray-700" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-300" />

      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Grid3x3 className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <span className="text-xs">⊞</span>
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-300" />

      <Button variant="ghost" size="icon" className="h-8 w-8">
        <AlignLeft className="h-4 w-4 text-gray-700" />
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <AlignCenter className="h-4 w-4 text-gray-700" />
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Type className="h-4 w-4 text-gray-700" />
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Link2 className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MessageSquare className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <ImageIcon className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Filter className="h-4 w-4 text-gray-700" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Grid3x3 className="h-4 w-4 text-gray-700" />
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <SigmaIcon className="h-4 w-4 text-gray-700" />
      </Button>

      <div className="ml-auto">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronUp className="h-4 w-4 text-gray-700" />
        </Button>
      </div>
    </div>
  )
}