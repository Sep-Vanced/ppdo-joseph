import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) return "Never";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  
  return date.toLocaleDateString();
}

export function getInitials(name?: string): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// NAME UTILITY FUNCTIONS
// ============================================================================

/**
 * Format full name from individual components
 */
export function formatFullName(
  firstName?: string,
  middleName?: string,
  lastName?: string,
  nameExtension?: string
): string {
  const parts: string[] = [];
  
  if (firstName) parts.push(firstName);
  if (middleName) parts.push(middleName);
  if (lastName) parts.push(lastName);
  if (nameExtension) parts.push(nameExtension);
  
  return parts.join(" ");
}

/**
 * Get display name with fallback logic
 * Priority: name > generated from components > email > "Unknown User"
 */
export function getDisplayName(user: {
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nameExtension?: string;
  email?: string;
}): string {
  // Use existing name field if available
  if (user.name) return user.name;
  
  // Generate from components if available
  if (user.firstName || user.lastName) {
    return formatFullName(
      user.firstName,
      user.middleName,
      user.lastName,
      user.nameExtension
    );
  }
  
  // Fallback to email
  if (user.email) return user.email;
  
  // Final fallback
  return "Unknown User";
}

/**
 * Get initials from user object (enhanced version)
 */
export function getUserInitials(user: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  // Try from firstName and lastName
  if (user.firstName || user.lastName) {
    const firstInitial = user.firstName?.charAt(0).toUpperCase() || "";
    const lastInitial = user.lastName?.charAt(0).toUpperCase() || "";
    return `${firstInitial}${lastInitial}`.trim() || "?";
  }
  
  // Try from full name
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Try from email
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return "?";
}

/**
 * Parse full name into components (for backward compatibility when editing)
 */
export function parseFullName(fullName: string): {
  firstName: string;
  middleName?: string;
  lastName?: string;
  nameExtension?: string;
} {
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return { firstName: "" };
  }
  
  if (parts.length === 1) {
    return { firstName: parts[0] };
  }
  
  if (parts.length === 2) {
    return {
      firstName: parts[0],
      lastName: parts[1],
    };
  }
  
  // For 3+ parts, assume: First Middle+ Last
  // Check if last part is an extension (Jr., Sr., II, III, IV)
  const lastPart = parts[parts.length - 1];
  const extensions = ["Jr.", "Sr.", "Jr", "Sr", "II", "III", "IV", "V", "VI"];
  const hasExtension = extensions.some(ext => 
    lastPart.toLowerCase() === ext.toLowerCase()
  );
  
  if (hasExtension && parts.length >= 3) {
    return {
      firstName: parts[0],
      middleName: parts.slice(1, parts.length - 2).join(" "),
      lastName: parts[parts.length - 2],
      nameExtension: lastPart,
    };
  }
  
  // No extension
  return {
    firstName: parts[0],
    middleName: parts.slice(1, parts.length - 1).join(" "),
    lastName: parts[parts.length - 1],
  };
}