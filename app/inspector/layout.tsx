// app/inspector/layout.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function InspectorContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(api.auth.getCurrentUser);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/signin");
      return;
    }

    // Only inspector role can access this route
    if (currentUser && currentUser.role !== "inspector") {
      router.replace("/dashboard");
      return;
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  // Prevent UI flash while loading / redirecting
  if (isLoading || !isAuthenticated || !currentUser) {
    return null;
  }

  // If not inspector, don't render
  if (currentUser.role !== "inspector") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-zinc-950">
      {children}
    </div>
  );
}

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InspectorContent>{children}</InspectorContent>;
}