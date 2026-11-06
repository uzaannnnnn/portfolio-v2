import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { HeroEditor } from "@/components/admin/singleton-editors";

export default function AdminHeroPage() {
  const snapshot = getAdminDashboardSnapshot();
  return <HeroEditor entity={snapshot.hero} />;
}
