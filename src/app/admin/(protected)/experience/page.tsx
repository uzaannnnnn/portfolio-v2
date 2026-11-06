import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { ExperienceManager } from "@/components/admin/collection-managers";

export default function AdminExperiencePage() {
  const snapshot = getAdminDashboardSnapshot();
  return <ExperienceManager items={snapshot.experiences} />;
}
