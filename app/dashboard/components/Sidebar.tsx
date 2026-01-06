// app/dashboard/components/Sidebar.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../contexts/SidebarContext";
import { useAccentColor } from "../contexts/AccentColorContext";

interface SubMenuItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  submenu?: SubMenuItem[];
  category?: string;
  disabled?: boolean;
}

interface NavCategory {
  name: string;
  items: NavItem[];
}

interface SidebarProps {
  navItems?: NavItem[];
}

// Helper function to group items by category
function groupItemsByCategory(items: NavItem[]): NavCategory[] {
  const categories: { [key: string]: NavItem[] } = {};

  items.forEach((item) => {
    const category = item.category || "Uncategorized";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });

  // Define category order
  const categoryOrder = [
    "My Workspace",
    "Department",
    "Cross Department",
    "Control Panel",
  ];

  // Categories that should always be shown even if empty
  const alwaysShowCategories = ["Department", "Cross Department"];

  return categoryOrder
    .filter((cat) => categories[cat] || alwaysShowCategories.includes(cat))
    .map((cat) => ({
      name: cat,
      items: categories[cat] || [],
    }));
}

const defaultNavItems: NavItem[] = [
  // My Workspace
  {
    name: "Dashboard",
    href: "/dashboard",
    category: "My Workspace",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: "Personal KPI",
    href: "/dashboard/personal-kpi",
    category: "My Workspace",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    name: "Projects",
    href: "/dashboard/budget",
    category: "Department",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  // Cross Department
  {
    name: "Office",
    href: "/dashboard/office",
    category: "Cross Department",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  // Control Panel
  {
    name: "CMS",
    category: "Control Panel",
    disabled: true,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    name: "Settings",
    category: "Control Panel",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    submenu: [
      {
        name: "User Management",
        href: "/dashboard/settings/user-management",
      },
    ],
  },
];

export function Sidebar({ navItems = defaultNavItems }: SidebarProps) {
  // Mobile sidebar state (for mobile menu overlay)
  const [isOpen, setIsOpen] = useState(true);
  // Desktop minimized state from context
  const { isMinimized } = useSidebar();
  const pathname = usePathname();
  const { accentColorValue } = useAccentColor();
  // Track which submenu is expanded
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Group items by category
  const groupedCategories = groupItemsByCategory(navItems);

  // Auto-expand submenu if one of its items is active
  useEffect(() => {
    navItems.forEach((item, index) => {
      if (item.submenu && item.submenu.length > 0) {
        const itemKey = item.href || `nav-item-${index}`;
        const hasActiveSubmenu = item.submenu.some(
          (sub) => pathname === sub.href
        );
        if (hasActiveSubmenu) {
          setExpandedItems((prev) => new Set(prev).add(itemKey));
        }
      }
    });
  }, [pathname, navItems]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50
          h-dvh
          bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm
          border-r border-zinc-200 dark:border-zinc-800
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isMinimized ? "md:w-20" : "md:w-64"}
          w-64
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="min-h-20 px-4 sm:px-6 py-4 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 relative">
          {/* Logo and text - hidden when minimized */}
          <div
            className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${
              isMinimized
                ? "md:opacity-0 md:absolute md:pointer-events-none"
                : ""
            }`}
          >
            <div className="flex items-center gap-1">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-16 object-contain shrink-0"
              />
              <img
                src="/y.png"
                alt="Y Logo"
                className="h-16 object-contain shrink-0"
              />
            </div>
            <div className="flex flex-col items-center leading-tight">
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight text-center">
                Provincial Planning and Development Office
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">
                Tarlac
              </p>
            </div>
          </div>

          {/* Logo - shown when minimized */}
          <div
            className={`hidden md:flex items-center justify-center w-full transition-opacity duration-300 ${
              isMinimized
                ? "opacity-100"
                : "opacity-0 absolute pointer-events-none"
            }`}
          >
            <img
              src="/logo.png"
              alt="Tarlac Provincial Government Logo"
              className="h-20 w-20 object-contain"
            />
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 absolute right-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {groupedCategories.map((category) => (
              <div key={category.name} className="space-y-2">
                {/* Category Header */}
                {!isMinimized && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {category.name}
                    </h3>
                  </div>
                )}
                {/* Category Items */}
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => {
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const itemKey =
                      item.href || `nav-item-${category.name}-${itemIndex}`;
                    const isExpanded = expandedItems.has(itemKey);
                    const isActive = item.href
                      ? pathname === item.href
                      : item.submenu?.some((sub) => pathname === sub.href);

                    return (
                      <li key={itemKey}>
                        {hasSubmenu ? (
                          <>
                            {/* Parent menu item with expand/collapse */}
                            <button
                              onClick={() => {
                                if (isMinimized || item.disabled) return;
                                setExpandedItems((prev) => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(itemKey)) {
                                    newSet.delete(itemKey);
                                  } else {
                                    newSet.add(itemKey);
                                  }
                                  return newSet;
                                });
                              }}
                              disabled={item.disabled}
                              className={`
                          w-full flex items-center rounded-xl
                          transition-all duration-200 group
                          ${
                            isMinimized
                              ? "md:justify-center md:px-3 md:py-3"
                              : "gap-3 px-4 py-3 justify-between"
                          }
                          ${
                            item.disabled
                              ? "cursor-not-allowed text-zinc-700 dark:text-zinc-300"
                              : isActive
                              ? "font-medium"
                              : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }
                        `}
                              style={
                                isActive
                                  ? {
                                      backgroundColor: `${accentColorValue}10`,
                                      color: accentColorValue,
                                    }
                                  : undefined
                              }
                              title={isMinimized ? item.name : undefined}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span
                                  className={isMinimized ? "shrink-0" : ""}
                                  style={
                                    isActive
                                      ? { color: accentColorValue }
                                      : undefined
                                  }
                                >
                                  {item.icon}
                                </span>
                                <span
                                  className={`
                              transition-all duration-300 whitespace-nowrap
                              ${isMinimized ? "md:hidden" : ""}
                            `}
                                >
                                  {item.name}
                                </span>
                              </div>
                              {!isMinimized && (
                                <svg
                                  className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
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
                              )}
                            </button>
                            {/* Submenu items */}
                            {!isMinimized && isExpanded && item.submenu && (
                              <ul className="ml-4 mt-1 space-y-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
                                {item.submenu.map((subItem) => {
                                  const isSubActive = pathname === subItem.href;
                                  return (
                                    <li key={subItem.href}>
                                      <Link
                                        href={subItem.href}
                                        className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg
                                    transition-all duration-200
                                    ${
                                      isSubActive
                                        ? "font-medium"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    }
                                  `}
                                        style={
                                          isSubActive
                                            ? {
                                                backgroundColor: `${accentColorValue}10`,
                                                color: accentColorValue,
                                              }
                                            : undefined
                                        }
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isSubActive
                                              ? ""
                                              : "bg-zinc-400 dark:bg-zinc-600"
                                          }`}
                                          style={
                                            isSubActive
                                              ? {
                                                  backgroundColor:
                                                    accentColorValue,
                                                }
                                              : undefined
                                          }
                                        />
                                        <span>{subItem.name}</span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </>
                        ) : item.disabled ? (
                          /* Disabled menu item - looks normal but unclickable */
                          <div
                            className={`
                        flex items-center rounded-xl
                        transition-all duration-200
                        ${
                          isMinimized
                            ? "md:justify-center md:px-3 md:py-3"
                            : "gap-3 px-4 py-3"
                        }
                        cursor-not-allowed text-zinc-700 dark:text-zinc-300
                      `}
                            title={isMinimized ? item.name : "Coming soon"}
                            onClick={(e) => e.preventDefault()}
                          >
                            <span className={isMinimized ? "shrink-0" : ""}>
                              {item.icon}
                            </span>
                            <span
                              className={`
                          transition-all duration-300 whitespace-nowrap
                          ${isMinimized ? "md:hidden" : ""}
                        `}
                            >
                              {item.name}
                            </span>
                          </div>
                        ) : (
                          /* Regular menu item */
                          <Link
                            href={item.href || "#"}
                            className={`
                        flex items-center rounded-xl
                        transition-all duration-200 group
                        ${
                          isMinimized
                            ? "md:justify-center md:px-3 md:py-3"
                            : "gap-3 px-4 py-3"
                        }
                        ${
                          isActive
                            ? "font-medium"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }
                      `}
                            style={
                              isActive
                                ? {
                                    backgroundColor: `${accentColorValue}10`,
                                    color: accentColorValue,
                                  }
                                : undefined
                            }
                            title={isMinimized ? item.name : undefined}
                          >
                            <span
                              className={isMinimized ? "shrink-0" : ""}
                              style={
                                isActive
                                  ? { color: accentColorValue }
                                  : undefined
                              }
                            >
                              {item.icon}
                            </span>
                            <span
                              className={`
                          transition-all duration-300 whitespace-nowrap
                          ${isMinimized ? "md:hidden" : ""}
                        `}
                            >
                              {item.name}
                            </span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`p-4 border-t border-zinc-200 dark:border-zinc-800 transition-opacity duration-300 ${
            isMinimized ? "md:opacity-0 md:pointer-events-none" : ""
          }`}
        >
          <div className="px-4 py-3 rounded-xl bg-[#f8f8f8] dark:bg-zinc-800/50">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Provincial Government
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              © {new Date().getFullYear()} Tarlac
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#f8f8f8] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}
    </>
  );
}
