import Link from "next/link";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Cpu,
  FileEdit,
  FolderGit2,
  History,
  ShieldCheck,
} from "lucide-react";
import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-feedback";

export default function AdminOverviewPage() {
  const snapshot = getAdminDashboardSnapshot();

  const totalProjects = snapshot.projects.length;
  const publishedProjects = snapshot.projects.filter(
    (p) => p.status === "published",
  ).length;
  const draftProjects = snapshot.projects.filter(
    (p) => p.status === "draft",
  ).length;
  const totalSkills = snapshot.skillCategories.reduce(
    (sum, cat) => sum + cat.skills.length,
    0,
  );
  const totalExperiences = snapshot.experiences.length;
  const totalCertifications = snapshot.certifications.length;

  const metrics = [
    {
      label: "Total Projects",
      value: totalProjects,
      sub: `${publishedProjects} published · ${draftProjects} draft`,
      icon: FolderGit2,
      href: "/admin/projects",
    },
    {
      label: "Published Projects",
      value: publishedProjects,
      sub: "Live on public portfolio",
      icon: CheckCircle2,
      href: "/admin/projects",
    },
    {
      label: "Draft Projects",
      value: draftProjects,
      sub: "Isolated from anonymous visitors",
      icon: FileEdit,
      href: "/admin/projects",
    },
    {
      label: "Total Skills",
      value: totalSkills,
      sub: `Across ${snapshot.skillCategories.length} categories`,
      icon: Cpu,
      href: "/admin/skills",
    },
    {
      label: "Experience Entries",
      value: totalExperiences,
      sub: "Professional & organizational roles",
      icon: Briefcase,
      href: "/admin/experience",
    },
    {
      label: "Certifications",
      value: totalCertifications,
      sub: "Verified technical credentials",
      icon: Award,
      href: "/admin/certifications",
    },
  ];

  return (
    <div data-testid="admin-overview-page">
      <AdminPageHeader
        eyebrow="Overview"
        title="Portfolio Content Management System"
        description="Manage draft revisions, preview unpublished case studies, and publish verified updates to the live engineering portfolio."
      />

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              key={metric.label}
              href={metric.href}
              className="group rounded-xl border border-border-token bg-background p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-secondary-foreground">
                  {metric.label}
                </span>
                <Icon
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Project Status Table */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Project Publication Status
              </h2>
              <p className="mt-0.5 text-xs text-secondary-foreground">
                Seeded projects remain in Draft until verified and explicitly
                published.
              </p>
            </div>
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <span>Manage Projects</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-token font-mono text-[11px] uppercase text-muted-foreground">
                  <th className="pb-2.5 pr-4">Project</th>
                  <th className="pb-2.5 pr-4">Slug</th>
                  <th className="pb-2.5 pr-4">State</th>
                  <th className="pb-2.5 pr-4">Sections</th>
                  <th className="pb-2.5 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-token">
                {snapshot.projects.map((record) => (
                  <tr key={record.entityId}>
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {record.draftData.name}
                    </td>
                    <td className="py-3 pr-4 font-mono text-secondary-foreground">
                      /{record.draftData.slug}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          record.status === "published" ? "accent" : "outline"
                        }
                      >
                        {record.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 font-mono text-secondary-foreground">
                      {
                        record.draftData.caseStudySections.filter(
                          (s) => s.isEnabled,
                        ).length
                      }
                      /{record.draftData.caseStudySections.length} enabled
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/projects/${record.draftData.slug}?preview=true`}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        Preview Draft →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Revisions & Audit Feed */}
        <div className="rounded-xl border border-border-token bg-background p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">
                Recent Revisions & Audit
              </h2>
            </div>
            <Link
              href="/admin/settings"
              className="text-xs font-medium text-accent hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {snapshot.revisions.slice(0, 5).map((rev) => (
              <div
                key={rev.id}
                className="rounded-lg border border-border-token bg-surface p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {rev.entityType}:{rev.entityId} (v{rev.versionNumber})
                  </span>
                  <Badge variant="outline">{rev.state}</Badge>
                </div>
                <p className="mt-1 text-secondary-foreground">
                  {rev.changeSummary}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-border-token bg-surface p-3 text-[11px] text-secondary-foreground">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span>
              Audit logs and revision snapshots are immutable and preserved
              across content deletions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
