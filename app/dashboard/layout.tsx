// app/dashboard/layout.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";

import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { TimeLocation } from "./components/TimeLocation";
import { SearchProvider } from "./contexts/SearchContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { AccentColorProvider } from "./contexts/AccentColorContext";
import { BreadcrumbProvider } from "./contexts/BreadcrumbContext";
import { OnboardingModal } from "@/components/modals/OnboardingModal";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  // Optional: prevent UI flash while loading / redirecting
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-[#f8f8f8] dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex-1">
                <Breadcrumbs />
              </div>
              <TimeLocation />
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      {/* <AIAssistant /> */}

      {/* Global Onboarding Modal */}
      {/* <OnboardingModal /> */}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <SidebarProvider>
        <AccentColorProvider>
          <BreadcrumbProvider>
            <DashboardContent>{children}</DashboardContent>
          </BreadcrumbProvider>
        </AccentColorProvider>
      </SidebarProvider>
    </SearchProvider>
  );
}
