import { createSupabaseServerClient } from "@/lib/supabase/server";

export class UnauthorizedAdminError extends Error {
  public readonly statusCode: 401 | 403;

  constructor(message: string, statusCode: 401 | 403 = 401) {
    super(message);
    this.name = "UnauthorizedAdminError";
    this.statusCode = statusCode;
  }
}

export interface VerifiedAdminContext {
  adminId: string;
  authUserId: string;
  email: string;
  role: "admin";
}

export interface AdminAuthLookupPort {
  getAuthenticatedUser(): Promise<{ id: string; email?: string | null } | null>;
  findAdminRecord(authUserId: string): Promise<{
    id: string;
    auth_user_id: string;
    email: string;
    role: "admin";
    is_active: boolean;
  } | null>;
}

/**
 * Verifies single-admin identity on the server:
 * 1. Confirms an active authenticated session exists.
 * 2. Confirms the user exists in public.admin_users with is_active = true and role = 'admin'.
 * 3. If ADMIN_ALLOWED_EMAIL is configured, enforces an exact case-insensitive email match.
 * Never trusts client-provided role claims or user_metadata.
 */
export async function verifySingleAdminAuthorization(
  port: AdminAuthLookupPort,
): Promise<VerifiedAdminContext> {
  const authUser = await port.getAuthenticatedUser();

  if (!authUser || !authUser.id) {
    throw new UnauthorizedAdminError(
      "Authentication required: no active admin session.",
      401,
    );
  }

  const adminRow = await port.findAdminRecord(authUser.id);

  if (
    !adminRow ||
    !adminRow.is_active ||
    adminRow.role !== "admin" ||
    adminRow.auth_user_id !== authUser.id
  ) {
    throw new UnauthorizedAdminError(
      "Access denied: authenticated user is not an authorized administrator.",
      403,
    );
  }

  const allowedEmailEnv = process.env.ADMIN_ALLOWED_EMAIL?.trim().toLowerCase();
  if (allowedEmailEnv && adminRow.email.trim().toLowerCase() !== allowedEmailEnv) {
    throw new UnauthorizedAdminError(
      "Access denied: user email does not match the designated single-admin allowlist.",
      403,
    );
  }

  return {
    adminId: adminRow.id,
    authUserId: adminRow.auth_user_id,
    email: adminRow.email,
    role: "admin",
  };
}

/**
 * Production server-side admin guard bound to Supabase Auth + PostgreSQL RLS.
 */
export async function requireAdminSession(): Promise<VerifiedAdminContext> {
  const supabase = await createSupabaseServerClient();

  return verifySingleAdminAuthorization({
    async getAuthenticatedUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return null;
      }
      return { id: data.user.id, email: data.user.email };
    },
    async findAdminRecord(authUserId: string) {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, auth_user_id, email, role, is_active")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }
      return data;
    },
  });
}
