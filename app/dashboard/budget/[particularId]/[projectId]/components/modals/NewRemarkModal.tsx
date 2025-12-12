"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "@/convex/_generated/dataModel";

interface NewRemarkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    content: string;
    inspectionId?: Id<"inspections">;
    category?: string;
    priority?: "high" | "medium" | "low";
  }) => Promise<void>;
  inspections?: any[]; // Using any[] to match the flexible query return type, or you can import the specific type
}

export const NewRemarkModal: React.FC<NewRemarkModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  inspections = [],
}) => {
  const [content, setContent] = useState("");
  const [inspectionId, setInspectionId] = useState<string>("none");
  const [category, setCategory] = useState<string>("none");
  const [priority, setPriority] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setContent("");
    setInspectionId("none");
    setCategory("none");
    setPriority("none");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content,
        inspectionId: inspectionId !== "none" ? (inspectionId as Id<"inspections">) : undefined,
        category: category !== "none" ? category : undefined,
        priority: priority !== "none" ? (priority as "high" | "medium" | "low") : undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting remark:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Add New Remark
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Create a new remark for this project. You can optionally link it to an inspection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Inspection Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Link to Inspection (Optional)
            </Label>
            <Select value={inspectionId} onValueChange={setInspectionId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="General project remark" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General project remark</SelectItem>
                {inspections?.map((inspection) => (
                  <SelectItem key={inspection._id} value={inspection._id}>
                    {inspection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  <SelectItem value="Budget Utilization">Budget Utilization</SelectItem>
                  <SelectItem value="Timeline">Timeline</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Risk">Risk</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Remark Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-none"
              rows={5}
              placeholder="Enter your remark details here..."
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#15803D] hover:bg-[#166534] text-white"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Remark"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};