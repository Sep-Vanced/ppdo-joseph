// app/dashboard/components/account/ProfileDetailsTab.tsx

"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getUserInitials } from "@/lib/utils";

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]*$/;

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nameExtension?: string;
  name?: string;
  email?: string;
  image?: string;
  imageStorageId?: string;
  position?: string;
  employeeId?: string;
  role?: string;
  departmentId?: Id<"departments">;
}

interface ProfileDetailsTabProps {
  user: User;
}

// Helper function to get role display name
const getRoleDisplayName = (role?: string): string => {
  switch (role) {
    case "super_admin":
      return "Super Administrator";
    case "admin":
      return "Administrator";
    case "inspector":
      return "Inspector";
    case "user":
      return "User";
    default:
      return "User";
  }
};

export function ProfileDetailsTab({ user }: ProfileDetailsTabProps) {
  // Form state
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [middleName, setMiddleName] = useState(user.middleName || "");
  const [nameExtension, setNameExtension] = useState(user.nameExtension || "");
  const [position, setPosition] = useState(user.position || "");
  const [employeeId, setEmployeeId] = useState(user.employeeId || "");
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nameExtension?: string;
}>({});

// Field change handlers with validation
const handleNameChange = (
  value: string,
  setter: (v: string) => void,
  field: keyof typeof fieldErrors
) => {
  if (!NAME_REGEX.test(value)) {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: "Only letters and basic punctuation are allowed",
    }));
    return;
  }

  setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  setter(value);
};

  // Mutations
  const updateProfile = useMutation(api.userManagement.updateUserProfile);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);

  // Get user initials - use the utility function from lib/utils
  const userInitials = getUserInitials({
    firstName: firstName || user.firstName,
    lastName: lastName || user.lastName,
    name: user.name,
    email: user.email,
  });

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      // Validate required fields
        if (!NAME_REGEX.test(firstName)) {
          throw new Error("First name contains invalid characters");
        }

        if (!NAME_REGEX.test(lastName)) {
          throw new Error("Last name contains invalid characters");
        }

        if (middleName && !NAME_REGEX.test(middleName)) {
          throw new Error("Middle name contains invalid characters");
        }

        if (nameExtension && !NAME_REGEX.test(nameExtension)) {
          throw new Error("Extension contains invalid characters");
        }

      let uploadedImageStorageId: string | undefined = undefined;

      // Upload image if selected
      if (selectedImage) {
        setIsUploading(true);
        try {
          // Generate upload URL
          const uploadUrl = await generateUploadUrl();
          
          // Upload the file
          const uploadResult = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": selectedImage.type },
            body: selectedImage,
          });

          if (!uploadResult.ok) {
            throw new Error("Failed to upload image");
          }

          const { storageId } = await uploadResult.json();
          uploadedImageStorageId = storageId;
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          throw new Error("Failed to upload image");
        } finally {
          setIsUploading(false);
        }
      }

      // Update profile
      await updateProfile({
        userId: user._id as Id<"users">,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim() || undefined,
        nameExtension: nameExtension.trim() || undefined,
        position: position.trim() || undefined,
        employeeId: employeeId.trim() || undefined,
        imageStorageId: uploadedImageStorageId,
      });

      setSuccess("Profile updated successfully!");
      
      // Reset selected image after successful upload
      if (selectedImage) {
        setSelectedImage(null);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Profile Picture
        </h3>
        
        <div className="flex items-center gap-6">
          {/* Avatar Display */}
          <div className="relative">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700">
                <span className="text-white font-bold text-2xl">
                  {userInitials}
                </span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Upload Buttons */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {selectedImage ? "Change Image" : "Upload Image"}
            </button>
            {(imagePreview || selectedImage) && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isUploading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Remove
              </button>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Recommended size 1:1, up to 10MB.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information Accordion */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <details className="group" open>
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Personal Information
            </h3>
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) =>
                    handleNameChange(e.target.value, setFirstName, "firstName")
                  }
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.firstName
                      ? "border-red-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  } bg-white dark:bg-zinc-800`}
                  placeholder="Enter first name"
                />

                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) =>
                    handleNameChange(e.target.value, setLastName, "lastName")
                  }
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.lastName
                      ? "border-red-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  } bg-white dark:bg-zinc-800`}
                  placeholder="Enter last name"
                />

                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>

              {/* Middle Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Middle Name <span className="text-zinc-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) =>
                    handleNameChange(e.target.value, setMiddleName, "middleName")
                  }
                  className="w-full px-4 py-2 rounded-lg border ..."
                  placeholder="Enter middle name"
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.middleName}
                  </p>
                )}
              </div>

              {/* Name Extension */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Extension <span className="text-zinc-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={nameExtension}
                  onChange={(e) =>
                    handleNameChange(e.target.value, setNameExtension, "nameExtension")
                  }
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.nameExtension
                      ? "border-red-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  } bg-white dark:bg-zinc-800`}
                  placeholder="Jr., Sr., III, etc."
                />
                {fieldErrors.nameExtension && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.nameExtension}
                  </p>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Professional Information Accordion */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <details className="group">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Professional Information
            </h3>
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Position <span className="text-zinc-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter position"
                />
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Employee ID <span className="text-zinc-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter employee ID"
                />
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Account Information Accordion - Read Only */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <details className="group" open>
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Account Information
            </h3>
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email (Read-Only) */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
                />
              </div>

              {/* Role (Read-Only) - Updated to support all 4 roles */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={getRoleDisplayName(user.role)}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}