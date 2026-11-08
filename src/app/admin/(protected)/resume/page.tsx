import { resolveAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { ResumeManager } from "@/components/admin/system-managers";

export default async function AdminResumePage() {
  const snapshot = await resolveAdminDashboardSnapshot();
  return <ResumeManager resumes={snapshot.resumeFiles} />;
}
