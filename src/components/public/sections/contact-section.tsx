import Link from "next/link";
import { ArrowUpRight, FileText, Github, Linkedin, Mail, MapPin } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import type { ProfileData } from "@/types/portfolio";

export interface ContactSectionProps {
  profile: ProfileData;
}

export function ContactSection({ profile }: ContactSectionProps) {
  return (
    <SectionContainer
      id="contact"
      surface="secondary"
      eyebrow="08 / Connect"
      title="Get in Touch"
      description="Interested in discussing software engineering roles, system architecture, or technical collaborations? Reach out through any of the verified channels below."
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="space-y-4 md:col-span-7">
          <p className="type-body max-w-[620px] text-secondary-foreground">
            {profile.availabilityNote}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {profile.email ? (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-button-primary px-6 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>Email {profile.fullName}</span>
              </a>
            ) : (
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-button-primary px-6 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>View Contact Details</span>
              </Link>
            )}

            <Link
              href="/resume"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border-token bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Resume</span>
            </Link>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-lg border border-border-token bg-background p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Direct Channels
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {profile.githubUrl && (
                <li>
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md border border-border-token px-3.5 py-2.5 text-foreground transition-colors hover:bg-surface"
                  >
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Github className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />
                      GitHub
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      @uzaannnnnn
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </a>
                </li>
              )}

              {profile.linkedinUrl && (
                <li>
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md border border-border-token px-3.5 py-2.5 text-foreground transition-colors hover:bg-surface"
                  >
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Linkedin className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />
                      LinkedIn
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  </a>
                </li>
              )}

              {profile.email && (
                <li>
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center justify-between rounded-md border border-border-token px-3.5 py-2.5 text-foreground transition-colors hover:bg-surface"
                  >
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Mail className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />
                      Email
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {profile.email}
                    </span>
                  </a>
                </li>
              )}

              {profile.location && (
                <li className="flex items-center justify-between px-1 pt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Base Location
                  </span>
                  <span className="font-mono text-foreground">{profile.location}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
