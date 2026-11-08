import { resolveAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { SettingsAndAuditManager } from "@/components/admin/system-managers";

export default async function AdminSettingsPage() {
  const snapshot = await resolveAdminDashboardSnapshot();
  return (
    <SettingsAndAuditManager
      siteSettingsEntity={snapshot.siteSettings}
      revisions={snapshot.revisions}
      publications={snapshot.publications}
      auditLogs={snapshot.auditLogs}
    />
  );
}
