import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border-token bg-surface text-foreground",
        outline: "border-border-token bg-background text-secondary-foreground",
        accent:
          "border-accent/30 bg-accent/10 text-accent dark:border-accent/40 dark:bg-accent/15",
        success:
          "border-success/30 bg-success/10 text-success dark:border-success/40 dark:bg-success/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
