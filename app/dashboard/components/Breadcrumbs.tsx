// app/dashboard/components/Breadcrumbs.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccentColor } from "../contexts/AccentColorContext";
import { useBreadcrumb } from "../contexts/BreadcrumbContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();
  const { accentColorValue } = useAccentColor();
  const { customBreadcrumbs, onBreadcrumbClick } = useBreadcrumb();

  const decodeLabel = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    // Priority: items prop > context > auto-generated
    if (items) return items;
    if (customBreadcrumbs) return customBreadcrumbs;

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/dashboard" },
    ];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip if it's the dashboard root
      if (segment === "dashboard") return;

      // Format label (decode URI segments, capitalize, and replace hyphens)
      const decodedSegment = decodeLabel(segment);
      const label = decodedSegment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Last segment doesn't need href (current page)
      if (index === segments.length - 1) {
        breadcrumbs.push({ label });
      } else {
        breadcrumbs.push({ label, href: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center gap-2 text-sm mb-2 sm:mb-3"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-zinc-400 dark:text-zinc-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast ? (
                <span
                  className="font-medium truncate max-w-[150px] sm:max-w-none"
                  style={{ color: accentColorValue }}
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  onClick={(e) => {
                    // If clicking on current route, prevent navigation and call handler
                    if (item.href === pathname) {
                      e.preventDefault();
                      if (onBreadcrumbClick && item.href) {
                        onBreadcrumbClick(item.href);
                      }
                    } else if (onBreadcrumbClick && item.href) {
                      // Call handler but allow navigation for different routes
                      onBreadcrumbClick(item.href);
                    }
                  }}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[150px] sm:max-w-none">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
