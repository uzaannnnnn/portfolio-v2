import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { ResumeManager } from "@/components/admin/system-managers";

export default function AdminResumePage() {
  const snapshot = getAdminDashboardSnapshot();
  return <ResumeManager resumes={snapshot.resumeFiles} />;
}
