import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { BootExperienceManager } from "@/components/admin/system-managers";

export default function AdminBootExperiencePage() {
  const snapshot = getAdminDashboardSnapshot();
  return (
    <BootExperienceManager
      greetings={snapshot.bootGreetings}
      siteSettingsEntity={snapshot.siteSettings}
    />
  );
}
