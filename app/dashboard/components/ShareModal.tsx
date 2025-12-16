// app/dashboard/components/ShareModal.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HelpCircle, Settings, Copy, Mail, Lock } from "lucide-react"

export default function GoogleSheetsShareModal() {
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <h2 className="text-2xl font-normal text-gray-900 flex-1 pr-4">
            Share "emman team - ppdo phase 1 - v0.1 functionality"
          </h2>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Add people input */}
        <div className="px-6 pb-4">
          <Input placeholder="Add people, groups, spaces, and calendar events" className="w-full h-12 text-base" />
        </div>

        {/* People with access */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-900">People with access</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <Mail className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* User list */}
          <div className="space-y-3">
            {/* Owner */}
            <div className="flex items-center gap-3 py-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/diverse-group.png" />
                <AvatarFallback className="bg-orange-200 text-orange-900">MN</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">Melvin Nogoy (you)</div>
                <div className="text-sm text-gray-600">m.viner001@gmail.com</div>
              </div>
              <div className="text-sm text-gray-600 px-3">Owner</div>
            </div>

            {/* Editor */}
            <div className="flex items-center gap-3 py-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-500 text-white">32</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">32212218@gendejesus.edu.ph</div>
                <div className="text-sm text-gray-600">32212218@gendejesus.edu.ph</div>
              </div>
              <Select defaultValue="editor">
                <SelectTrigger className="w-[120px] h-9 border-0 bg-transparent hover:bg-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="commenter">Commenter</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Viewer */}
            <div className="flex items-center gap-3 py-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-500 text-white">52</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">52310085@gendejesus.edu.ph</div>
                <div className="text-sm text-gray-600">52310085@gendejesus.edu.ph</div>
              </div>
              <Select defaultValue="viewer">
                <SelectTrigger className="w-[120px] h-9 border-0 bg-transparent hover:bg-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="commenter">Commenter</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* General access */}
        <div className="px-6 pb-6">
          <h3 className="text-base font-medium text-gray-900 mb-4">General access</h3>
          <div className="flex items-start gap-3 py-2">
            <div className="p-2 bg-gray-100 rounded-full mt-1">
              <Lock className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <Select defaultValue="restricted">
                <SelectTrigger className="w-[160px] h-9 border-0 bg-transparent hover:bg-gray-100 -ml-3 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="anyone">Anyone with the link</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">Only people with access can open with the link</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <Button variant="outline" className="h-10 px-6 bg-transparent">
            <Copy className="w-4 h-4 mr-2" />
            Copy link
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 italic">Pending changes</span>
            <Button className="h-10 px-8 bg-blue-600 hover:bg-blue-700">Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
