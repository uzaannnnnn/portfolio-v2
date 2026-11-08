import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  SupabaseConfigurationError,
  getRequiredSupabasePublicEnv,
} from "@/lib/supabase/errors";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase SSR client bound to Next.js request cookies.
 * Operates under the user's session (anon or authenticated admin) so PostgreSQL RLS policies apply.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = getRequiredSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>,
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where response cookies cannot be mutated directly
        }
      },
    },
  }) as unknown as SupabaseClient<Database>;
}

/**
 * Trusted server-only Supabase admin client using SUPABASE_SERVICE_ROLE_KEY.
 * Strictly guarded against browser execution and reserved for initial admin provisioning.
 */
export function createSupabaseServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "Security violation: createSupabaseServiceRoleClient must never be invoked in a browser context.",
    );
  }

  const { url } = getRequiredSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new SupabaseConfigurationError(
      "SupabaseConfigurationError: SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
