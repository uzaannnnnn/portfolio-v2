import { createBrowserClient } from "@supabase/ssr";
import { getRequiredSupabasePublicEnv } from "@/lib/supabase/errors";
import type { Database } from "@/types/database";

/**
 * Browser-safe Supabase SSR client.
 * Uses only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Never imports or exposes SUPABASE_SERVICE_ROLE_KEY.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getRequiredSupabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
