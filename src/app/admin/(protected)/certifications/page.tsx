import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { CertificationsManager } from "@/components/admin/collection-managers";

export default function AdminCertificationsPage() {
  const snapshot = getAdminDashboardSnapshot();
  return <CertificationsManager items={snapshot.certifications} />;
}
