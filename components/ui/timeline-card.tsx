import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export type TimelineCardProps = {
  leftBadge: ReactNode;
  rightTag?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function TimelineCard({ leftBadge, rightTag, children, footer, className }: TimelineCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          {leftBadge}
          {rightTag ? (
            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              {rightTag}
            </span>
          ) : null}
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {children}
        </div>
        {footer ? (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default TimelineCard;
