import { ExternalLink } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMonthYear } from "@/lib/utils";
import type { CertificationItem } from "@/types/portfolio";

export interface CertificationsSectionProps {
  certifications: CertificationItem[];
}

export function CertificationsSection({
  certifications,
}: CertificationsSectionProps) {
  return (
    <SectionContainer
      id="certifications"
      eyebrow="07 / Verified Credentials"
      title="Certifications"
      description="Professional certifications and technical credentials."
    >
      {certifications.length === 0 ? (
        <EmptyState
          title="No published certifications yet"
          description="Official certificates and verification links can be uploaded and published through the Admin Dashboard."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className="flex flex-col justify-between rounded-lg border border-border-token bg-surface p-6"
            >
              <div>
                <h3 className="type-card-heading text-foreground">
                  {cert.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-secondary-foreground">
                  {cert.issuingOrganization}
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Issued {formatMonthYear(cert.issueMonth, cert.issueYear)}
                  {cert.expirationYear
                    ? ` · Expires ${formatMonthYear(cert.expirationMonth, cert.expirationYear)}`
                    : ""}
                </p>
                {cert.credentialId && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Credential ID: {cert.credentialId}
                  </p>
                )}
                {cert.description && (
                  <p className="type-body mt-3 text-secondary-foreground">
                    {cert.description}
                  </p>
                )}
              </div>

              {cert.credentialUrl && (
                <div className="mt-5 border-t border-border-token pt-4">
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                  >
                    <span>Verify Credential</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
