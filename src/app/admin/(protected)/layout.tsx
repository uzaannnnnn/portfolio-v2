import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOptionalAdminSession } from "@/lib/auth/session";
import { getAdminDashboardSnapshot } from "@/lib/database/cms-store";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getOptionalAdminSession();
  if (!admin) {
    redirect("/admin/login?reason=unauthorized");
  }

  const snapshot = getAdminDashboardSnapshot();

  return (
    <AdminShell adminEmail={admin.email} adapterMode={snapshot.adapterMode}>
      {children}
    </AdminShell>
  );
}
