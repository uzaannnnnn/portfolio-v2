import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalAdminSession } from "@/lib/auth/session";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Administrator Sign In — Portfolio CMS",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }>;
}) {
  const existingSession = await getOptionalAdminSession();
  if (existingSession) {
    redirect("/admin");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  return <AdminLoginForm reason={resolvedParams?.reason} />;
}
