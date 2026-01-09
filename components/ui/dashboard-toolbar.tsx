import React, { ReactNode } from "react";

type DashboardToolbarProps = {
  title?: string;
  actions?: ReactNode;
  className?: string;
};

export default function DashboardToolbar({ title, actions, className }: DashboardToolbarProps) {
  return (
    <div className={"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 " + (className || "")}> 
      {title && (
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      )}
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        {actions}
      </div>
    </div>
  );
}
