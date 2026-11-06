import crypto from "crypto";
import { cookies } from "next/headers";
import {
  UnauthorizedAdminError,
  requireAdminSession,
  verifySingleAdminAuthorization,
  type VerifiedAdminContext,
} from "@/lib/auth/admin-guard";

export const ADMIN_SESSION_COOKIE_NAME = "mf_admin_session_v1";

const FIXTURE_ADMIN_RECORD = {
  id: "00000000-0000-4000-8000-000000000001",
  auth_user_id: "00000000-0000-4000-8000-000000000099",
  email: process.env.ADMIN_ALLOWED_EMAIL?.trim() || "admin@muhamadfauzan.dev",
  role: "admin" as const,
  is_active: true,
};

function getSigningSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "fixture-local-dev-admin-hmac-secret-key-2026"
  );
}

export interface SignedAdminTokenPayload {
  authUserId: string;
  email: string;
  exp: number;
}

export function createSignedAdminSessionToken(params: {
  authUserId: string;
  email: string;
  ttlSeconds?: number;
}): string {
  const exp = Math.floor(Date.now() / 1000) + (params.ttlSeconds ?? 60 * 60 * 8);
  const payload: SignedAdminTokenPayload = {
    authUserId: params.authUserId,
    email: params.email,
    exp,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySignedAdminSessionToken(
  token: string | undefined | null,
): SignedAdminTokenPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encoded)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SignedAdminTokenPayload;

    const nowSec = Math.floor(Date.now() / 1000);
    if (!parsed.exp || parsed.exp <= nowSec) {
      return null; // Expired session
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Authenticates the single administrator credentials.
 * - In "supabase" mode: authenticates against Supabase Auth + public.admin_users.
 * - In "fixture" mode: authenticates against the single-admin fixture credentials.
 */
export async function authenticateSingleAdminCredentials(params: {
  email: string;
  password: string;
}): Promise<{ token?: string; admin: VerifiedAdminContext }> {
  const mode = process.env.DATA_ADAPTER_MODE ?? "fixture";
  const normalizedEmail = params.email.trim().toLowerCase();

  if (mode === "supabase") {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: params.password,
    });

    if (error || !data.user) {
      throw new UnauthorizedAdminError("Invalid administrator credentials.", 401);
    }

    const admin = await requireAdminSession();
    return { admin };
  }

  // Fixture mode authentication (explicitly for local dev & automated tests)
  const expectedEmail = (
    process.env.ADMIN_ALLOWED_EMAIL?.trim() || FIXTURE_ADMIN_RECORD.email
  ).toLowerCase();
  const expectedPassword =
    process.env.ADMIN_FIXTURE_PASSWORD?.trim() || "AdminPortfolio2026!";

  if (normalizedEmail !== expectedEmail || params.password !== expectedPassword) {
    throw new UnauthorizedAdminError("Invalid administrator credentials.", 401);
  }

  const admin = await verifySingleAdminAuthorization({
    getAuthenticatedUser: async () => ({
      id: FIXTURE_ADMIN_RECORD.auth_user_id,
      email: FIXTURE_ADMIN_RECORD.email,
    }),
    findAdminRecord: async (authUserId) =>
      authUserId === FIXTURE_ADMIN_RECORD.auth_user_id
        ? FIXTURE_ADMIN_RECORD
        : null,
  });

  const token = createSignedAdminSessionToken({
    authUserId: admin.authUserId,
    email: admin.email,
  });

  return { token, admin };
}

/**
 * Resolves the currently authenticated administrator on the server, or returns null.
 */
export async function getOptionalAdminSession(): Promise<VerifiedAdminContext | null> {
  try {
    return await enforceAdminSession();
  } catch {
    return null;
  }
}

/**
 * Enforces single-admin authorization on the server across routes and server actions.
 * Throws UnauthorizedAdminError if unauthenticated, expired, or unauthorized.
 */
export async function enforceAdminSession(): Promise<VerifiedAdminContext> {
  const mode = process.env.DATA_ADAPTER_MODE ?? "fixture";

  if (mode === "supabase") {
    return requireAdminSession();
  }

  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const payload = verifySignedAdminSessionToken(tokenCookie);

  return verifySingleAdminAuthorization({
    getAuthenticatedUser: async () =>
      payload ? { id: payload.authUserId, email: payload.email } : null,
    findAdminRecord: async (authUserId) =>
      authUserId === FIXTURE_ADMIN_RECORD.auth_user_id
        ? FIXTURE_ADMIN_RECORD
        : null,
  });
}
