import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { ProfileEditor } from "@/components/admin/singleton-editors";

export default function AdminProfilePage() {
  const snapshot = getAdminDashboardSnapshot();
  const profileRevisions = snapshot.revisions.filter(
    (r) => r.entityType === "profile",
  );
  return (
    <ProfileEditor entity={snapshot.profile} revisions={profileRevisions} />
  );
}
