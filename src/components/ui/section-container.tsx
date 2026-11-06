import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  surface?: "primary" | "secondary";
  headerAction?: React.ReactNode;
}

export function SectionContainer({
  id,
  eyebrow,
  title,
  description,
  surface = "primary",
  headerAction,
  className,
  children,
  ...props
}: SectionContainerProps) {
  return (
    <section
      id={id}
      className={cn(
        "border-b border-border-token py-16 md:py-24",
        surface === "secondary" ? "bg-surface" : "bg-background",
        className,
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        {(eyebrow || title || description || headerAction) && (
          <div className="mb-10 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
            <div className="max-w-[720px]">
              {eyebrow && (
                <p className="type-caption mb-2 font-mono font-medium uppercase tracking-wider text-accent">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="type-section-heading text-foreground">{title}</h2>
              )}
              {description && (
                <p className="type-body-lg mt-3 text-secondary-foreground">
                  {description}
                </p>
              )}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
