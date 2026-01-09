"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import AccessDeniedPage from "@/components/AccessDeniedPage";
import { TrashBinModal } from "../../../../components/TrashBinModal";
import BudgetStatistics from "@/components/budget/BudgetStatistics";
import { BudgetTrackingTable } from "@/components/budget/BudgetTrackingTable";
import { BudgetPageHeader, ExpandModal, LoadingState, useBudgetAccess, useBudgetData, useBudgetMutations } from "@/components/budget";
import { Button } from "@/components/ui/button";



export default function BudgetTrackingPage() {
  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useBudgetAccess();
  const { budgetItems, statistics, isLoading: isLoadingData } = useBudgetData();
  const { handleAdd, handleEdit, handleDelete } = useBudgetMutations();
  
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);

  if (isLoadingAccess) {
    return <LoadingState message="Checking access permissions..." />;
  }

  if (!canAccess) {
    return (
      <AccessDeniedPage
        userName={accessCheck?.user?.name || ""}
        userEmail={accessCheck?.user?.email || ""}
        departmentName={accessCheck?.department?.name || "Not Assigned"}
        pageRequested="Budget Tracking"
      />
    );
  }

  if (isLoadingData) {
    return <LoadingState />;
  }

  return (
    <>
      <BudgetPageHeader />

      {statistics && (
        <BudgetStatistics
          totalAllocated={statistics.totalAllocated}
          totalUtilized={statistics.totalUtilized}
          averageUtilizationRate={statistics.averageUtilizationRate}
          totalProjects={statistics.totalProjects}
        />
      )}

      <div className="mb-6">
        <BudgetTrackingTable
          budgetItems={budgetItems}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenTrash={() => setShowTrashModal(true)}
          expandButton={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Expand table"
              onClick={() => setIsExpandModalOpen(true)}
            >
              <Expand className="w-4 h-4" />
            </Button>
          }
        />
      </div>

      <TrashBinModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        type="budget"
      />

      <ExpandModal
        isOpen={isExpandModalOpen}
        onClose={() => setIsExpandModalOpen(false)}
      />
    </>
  );
}