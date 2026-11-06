import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { NotesManager } from "@/components/admin/collection-managers";

export default function AdminNotesPage() {
  const snapshot = getAdminDashboardSnapshot();
  return <NotesManager items={snapshot.notes} />;
}
