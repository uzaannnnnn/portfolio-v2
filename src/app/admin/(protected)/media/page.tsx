import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { MediaLibraryManager } from "@/components/admin/system-managers";

export default function AdminMediaPage() {
  const snapshot = getAdminDashboardSnapshot();
  return <MediaLibraryManager assets={snapshot.mediaAssets} />;
}
