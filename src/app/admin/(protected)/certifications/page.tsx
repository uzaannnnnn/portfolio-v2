import { resolveAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { CertificationsManager } from "@/components/admin/collection-managers";

export default async function AdminCertificationsPage() {
  const snapshot = await resolveAdminDashboardSnapshot();
  return <CertificationsManager items={snapshot.certifications} />;
}
