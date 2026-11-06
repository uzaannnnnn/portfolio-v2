import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  note?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  note,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border-token bg-surface/60 p-8 text-left md:p-10",
        className,
      )}
    >
      <p className="type-card-heading text-foreground">{title}</p>
      <p className="type-body mt-2 max-w-[680px] text-secondary-foreground">
        {description}
      </p>
      {note && (
        <p className="type-caption mt-3 font-mono text-muted-foreground">{note}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
