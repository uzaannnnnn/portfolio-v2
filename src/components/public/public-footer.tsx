"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { PUBLIC_NAV_ITEMS } from "@/components/public/public-navbar";
import { useBootExperience } from "@/components/boot-experience/indonesian-boot-experience";
import type { ProfileData } from "@/types/portfolio";

export interface PublicFooterProps {
  profile: ProfileData;
}

export function PublicFooter({ profile }: PublicFooterProps) {
  const { replayBootExperience, isBootEnabled } = useBootExperience();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-token bg-background">
      <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Identity Column */}
          <div className="md:col-span-6">
            <p className="text-base font-semibold text-foreground">
              {profile.fullName}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {profile.professionalTitle}
            </p>
            <p className="type-body mt-3 max-w-[460px] text-secondary-foreground">
              {profile.shortBio}
            </p>
          </div>

          {/* Sitemap Links */}
          <div className="md:col-span-3">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Navigation
            </p>
            <ul className="mt-3 space-y-2">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-secondary-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* External & Experience Controls */}
          <div className="md:col-span-3">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Links & Experience
            </p>
            <ul className="mt-3 space-y-2">
              {profile.githubUrl && (
                <li>
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-secondary-foreground transition-colors hover:text-foreground"
                  >
                    GitHub
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              )}
              {profile.linkedinUrl && (
                <li>
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-secondary-foreground transition-colors hover:text-foreground"
                  >
                    LinkedIn
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              )}
              {profile.email && (
                <li>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-sm text-secondary-foreground transition-colors hover:text-foreground"
                  >
                    {profile.email}
                  </a>
                </li>
              )}
              {isBootEnabled && (
                <li className="pt-1">
                  <button
                    type="button"
                    onClick={replayBootExperience}
                    data-testid="footer-replay-boot-button"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Replay Welcome Experience
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border-token pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            &copy; {currentYear} {profile.fullName}. Engineered with Next.js, TypeScript, and PostgreSQL.
          </p>
          <p className="font-mono">
            {profile.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
