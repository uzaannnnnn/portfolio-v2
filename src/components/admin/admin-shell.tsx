"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Briefcase,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { logoutAdminAction } from "@/features/admin/actions";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "CONTENT MANAGEMENT",
    items: [
      { label: "Profile", href: "/admin/profile", icon: User },
      { label: "Experience", href: "/admin/experience", icon: Briefcase },
      { label: "Projects / Showcase", href: "/admin/projects", icon: FolderGit2 },
      { label: "Certifications", href: "/admin/certifications", icon: Award },
    ],
  },
  {
    title: "EXPERIENCE & SETTINGS",
    items: [
      { label: "Resume Manager", href: "/admin/resume", icon: FileSpreadsheet },
      {
        label: "Site Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export function AdminShell({
  adminEmail,
  adapterMode,
  children,
}: {
  adminEmail: string;
  adapterMode: "fixture" | "supabase";
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logoutAdminAction();
    router.push("/admin/login");
    router.refresh();
  }

  const currentItem =
    NAV_GROUPS.flatMap((g) => g.items).find((item) => item.href === pathname) ?? {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    };

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {/* Desktop Left Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border-token bg-background lg:flex"
        aria-label="Admin Sidebar Navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-border-token px-5">
          <div>
            <span className="font-mono text-xs font-semibold tracking-wider text-accent">
              PORTFOLIO CMS
            </span>
            <p className="text-xs font-medium text-foreground">
              Muhamad Fauzan
            </p>
          </div>
          <span className="rounded border border-border-token bg-surface px-2 py-0.5 font-mono text-[10px] text-secondary-foreground">
            {adapterMode === "supabase" ? "SUPABASE" : "FIXTURE"}
          </span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-2.5 font-mono text-[10px] font-semibold tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <ul className="mt-2 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-accent text-white"
                            : "text-secondary-foreground hover:bg-surface hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border-token p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Theme</span>
            <ThemeSwitcher compact />
          </div>
          <p
            className="truncate font-mono text-[11px] text-secondary-foreground"
            title={adminEmail}
          >
            {adminEmail}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border-token bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-border-strong"
            >
              <span>Live Site</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              data-testid="admin-logout-button"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border-token bg-background px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:border-red-300 hover:text-red-700"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Admin Navigation"
          data-testid="admin-mobile-drawer"
        >
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-background">
            <div className="flex h-16 items-center justify-between border-b border-border-token px-5">
              <span className="font-mono text-xs font-semibold text-accent">
                PORTFOLIO CMS
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation drawer"
                className="rounded-md p-1.5 text-secondary-foreground hover:bg-surface"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="px-2.5 font-mono text-[10px] font-semibold tracking-wider text-muted-foreground">
                    {group.title}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium ${
                              isActive
                                ? "bg-accent text-white"
                                : "text-secondary-foreground hover:bg-surface hover:text-foreground"
                            }`}
                          >
                            <Icon
                              className="h-4 w-4 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="border-t border-border-token p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Theme</span>
                <ThemeSwitcher compact />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border-token px-3 py-2 text-xs font-medium text-secondary-foreground hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out ({adminEmail})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-token bg-background/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open admin navigation drawer"
              data-testid="admin-mobile-menu-trigger"
              className="rounded-md border border-border-token p-2 text-secondary-foreground hover:bg-surface lg:hidden"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-secondary-foreground"
            >
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-medium text-foreground">
                {currentItem.label}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              Single-Admin Enforced
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-md border border-border-token bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-border-strong"
            >
              <span>View Public Portfolio</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
