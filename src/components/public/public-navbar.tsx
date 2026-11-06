"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBootExperience } from "@/components/boot-experience/indonesian-boot-experience";

export interface NavItem {
  label: string;
  href: string;
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Notes", href: "/notes" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "/contact" },
];

export interface PublicNavbarProps {
  fullName: string;
  professionalTitle: string;
}

export function PublicNavbar({ fullName, professionalTitle }: PublicNavbarProps) {
  const pathname = usePathname();
  const { replayBootExperience, isBootEnabled } = useBootExperience();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Escape key closes mobile drawer
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-token bg-background/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
        {/* Brand Identity */}
        <Link
          href="/"
          className="group flex flex-col focus-visible:rounded-xs"
          aria-label={`${fullName} — ${professionalTitle}, Home`}
        >
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {fullName}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {professionalTitle}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {PUBLIC_NAV_ITEMS.map((item) => {
            const active = isActiveRoute(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface text-foreground"
                    : "text-secondary-foreground hover:bg-surface/70 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          {isBootEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={replayBootExperience}
              title="Replay Indonesian Welcome Experience"
              data-testid="navbar-replay-boot-button"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Welcome</span>
            </Button>
          )}
          <Link
            href="/contact"
            className="inline-flex h-9 items-center justify-center rounded-md bg-button-primary px-3.5 text-xs font-medium text-white transition-colors hover:bg-foreground/90"
          >
            Contact
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            data-testid="mobile-menu-toggle"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-token bg-background text-foreground hover:bg-surface"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="region"
          aria-label="Mobile navigation menu"
          data-testid="mobile-navigation-drawer"
          className="border-b border-border-token bg-background px-5 pb-6 pt-3 md:hidden"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const active = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface text-foreground"
                      : "text-secondary-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isBootEnabled && (
            <div className="mt-4 border-t border-border-token pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  replayBootExperience();
                }}
                data-testid="mobile-replay-boot-button"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Replay Indonesian Welcome
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
