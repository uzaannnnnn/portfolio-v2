import { resolveAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { UnifiedProfileManager } from "@/components/admin/singleton-editors";

export default async function AdminProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const snapshot = await resolveAdminDashboardSnapshot();
  const params = searchParams ? await searchParams : {};
  const initialTab = params.tab || "identity";

  return (
    <UnifiedProfileManager
      profileEntity={snapshot.profile}
      heroEntity={snapshot.hero}
      aboutEntity={snapshot.about}
      educationItems={snapshot.educations}
      revisions={snapshot.revisions}
      initialTab={initialTab}
    />
  );
}
