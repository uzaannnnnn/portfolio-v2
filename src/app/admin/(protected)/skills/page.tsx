import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { SkillsManager } from "@/components/admin/skills-manager";

export default function AdminSkillsPage() {
  const snapshot = getAdminDashboardSnapshot();
  return <SkillsManager initialCategories={snapshot.skillCategories} />;
}
