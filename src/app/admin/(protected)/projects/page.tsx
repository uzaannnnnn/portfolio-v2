import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { ProjectsManager } from "@/components/admin/projects-manager";

export default function AdminProjectsPage() {
  const snapshot = getAdminDashboardSnapshot();
  return (
    <ProjectsManager
      projects={snapshot.projects}
      revisions={snapshot.revisions}
    />
  );
}
