// app/dashboard/budget/[particularId]/[projectId]/components/modals/NewInspectionForm.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { InspectionFormData, NewInspectionFormProps } from "../types";

const getDefaultDate = () => new Date().toISOString().split('T')[0];

export const NewInspectionForm: React.FC<NewInspectionFormProps> = ({ open, onOpenChange, onSubmit }) => {
  const [formData, setFormData] = useState<InspectionFormData>({
    programNumber: "",
    title: "",
    category: "",
    date: getDefaultDate(),
    remarks: "",
    images: []
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createUploadSession = useMutation(api.media.createUploadSession);
  const saveMedia = useMutation(api.media.saveMedia);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setFormData({
      programNumber: "",
      title: "",
      category: "",
      date: getDefaultDate(),
      remarks: "",
      images: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let uploadSessionId = undefined;

      // Upload images if any
      if (formData.images.length > 0) {
        // Create upload session
        uploadSessionId = await createUploadSession({
          imageCount: formData.images.length,
        });

        // Upload each image
        for (let i = 0; i < formData.images.length; i++) {
          const file = formData.images[i];
          
          // Get upload URL
          const uploadUrl = await generateUploadUrl();
          
          // Upload file to Convex storage
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          const { storageId } = await result.json();

          // Save media metadata
          await saveMedia({
            storageId,
            name: file.name,
            type: file.type,
            size: file.size,
            sessionId: uploadSessionId,
            orderInSession: i,
          });
        }
      }

      // Call parent onSubmit with form data and session ID
      onSubmit({ ...formData, uploadSessionId });
      resetForm();
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            New Inspection
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Fill in the details for the new inspection report. All fields are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Inspection Title
            </Label>
            <Input 
              id="title" 
              name="title" 
              type="text" 
              placeholder="e.g., Community Women Empowerment Workshop" 
              value={formData.title} 
              onChange={handleInputChange} 
              required 
              className="w-full" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Input 
              id="category" 
              name="category" 
              type="text" 
              placeholder="e.g., Skill Development, Healthcare, Infrastructure" 
              value={formData.category} 
              onChange={handleInputChange} 
              required 
              className="w-full" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Inspection Date
            </Label>
            <Input 
              id="date" 
              name="date" 
              type="date" 
              value={formData.date} 
              onChange={handleInputChange} 
              required 
              className="w-full" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium">
              Remarks
            </Label>
            <Textarea 
              id="remarks" 
              name="remarks" 
              placeholder="Enter detailed remarks about the inspection..." 
              value={formData.remarks} 
              onChange={handleInputChange} 
              required 
              rows={5} 
              className="w-full resize-none" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images" className="text-sm font-medium">
              Upload Images (Optional)
            </Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#15803D] transition-colors">
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              <label
                htmlFor="images"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload images or drag and drop
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  PNG, JPG, JPEG up to 10MB
                </span>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      disabled={isUploading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#15803D] hover:bg-[#166534] text-white"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Create Inspection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};