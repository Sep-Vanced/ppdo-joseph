// components/utils.ts

/**
 * Utility function to get the Tailwind CSS classes for an inspection status.
 * @param status The status string (e.g., "Completed", "In Progress").
 * @returns Tailwind CSS class string.
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "In Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "Pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

/**
 * Formats a Date object into a detailed, localized string.
 */
export const formatDateDetailed = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/**
 * Formats a Date object into a short, localized date string.
 */
export const formatDateShort = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}