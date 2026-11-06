import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { AboutEditor } from "@/components/admin/singleton-editors";

export default function AdminAboutPage() {
  const snapshot = getAdminDashboardSnapshot();
  return <AboutEditor entity={snapshot.about} />;
}
