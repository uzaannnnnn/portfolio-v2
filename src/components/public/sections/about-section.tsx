import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { Badge } from "@/components/ui/badge";
import type { AboutContent, ProfileData } from "@/types/portfolio";

export interface AboutSectionProps {
  profile: ProfileData;
  about: AboutContent;
  showReadMoreLink?: boolean;
}

export function AboutSection({
  profile,
  about,
  showReadMoreLink = true,
}: AboutSectionProps) {
  return (
    <SectionContainer
      id="about"
      eyebrow="01 / Profile & Background"
      title={`About ${profile.fullName}`}
      description={about.introduction}
      headerAction={
        showReadMoreLink ? (
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <span>Full Profile</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          {about.narrativeParagraphs.map((paragraph, index) => (
            <p
              key={index}
              className="type-body max-w-[720px] text-secondary-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-lg border border-border-token bg-surface p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Core Engineering Domains
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {about.coreDomains.map((domain) => (
                <Badge key={domain} variant="default" className="bg-background py-1">
                  {domain}
                </Badge>
              ))}
            </div>

            <dl className="mt-6 space-y-3 border-t border-border-token pt-5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium text-foreground">
                  {profile.professionalTitle}
                </dd>
              </div>
              {profile.location && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium text-foreground">{profile.location}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-success">
                  {profile.availableForWork ? "Available" : "Focused on Current Work"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
