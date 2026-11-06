import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { EducationManager } from "@/components/admin/collection-managers";

export default function AdminEducationPage() {
  const snapshot = getAdminDashboardSnapshot();
  return <EducationManager items={snapshot.educations} />;
}
