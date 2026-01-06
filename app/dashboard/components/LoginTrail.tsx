// app/dashboard/components/LoginTrail.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginTrailTable } from "./LoginTrailTable";
import { BlockedItemsManagement } from "../security/components/BlockedItems";

export function LoginTrail() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  // Updated to include inspector role check
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";
  const [activeTab, setActiveTab] = useState<string>("logintrail");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={isAdmin ? "grid w-full grid-cols-2" : "grid w-full grid-cols-1"}>
          <TabsTrigger value="logintrail" className="gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Login Trail
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="blocked" className="gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              Blocked Items
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="logintrail" className="mt-6">
          <LoginTrailTable />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="blocked" className="mt-6">
            <BlockedItemsManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}