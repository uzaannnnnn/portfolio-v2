import { resolveAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { ProjectsManager } from "@/components/admin/projects-manager";

export default async function AdminProjectsPage() {
  const snapshot = await resolveAdminDashboardSnapshot();
  return (
    <ProjectsManager
      projects={snapshot.projects}
      revisions={snapshot.revisions}
    />
  );
}
