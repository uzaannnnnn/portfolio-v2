import { resolveAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { ExperienceManager } from "@/components/admin/collection-managers";

export default async function AdminExperiencePage() {
  const snapshot = await resolveAdminDashboardSnapshot();
  return <ExperienceManager items={snapshot.experiences} />;
}
