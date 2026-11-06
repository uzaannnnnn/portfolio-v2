import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { SettingsAndAuditManager } from "@/components/admin/system-managers";

export default function AdminSettingsPage() {
  const snapshot = getAdminDashboardSnapshot();
  return (
    <SettingsAndAuditManager
      siteSettingsEntity={snapshot.siteSettings}
      revisions={snapshot.revisions}
      publications={snapshot.publications}
      auditLogs={snapshot.auditLogs}
    />
  );
}
