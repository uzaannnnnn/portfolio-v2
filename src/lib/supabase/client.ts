import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequiredSupabasePublicEnv } from "@/lib/supabase/errors";
import type { Database } from "@/types/database";

/**
 * Browser-safe Supabase SSR client.
 * Uses only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Never imports or exposes SUPABASE_SERVICE_ROLE_KEY.
 */
export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const { url, anonKey } = getRequiredSupabasePublicEnv();
  return createBrowserClient(url, anonKey) as unknown as SupabaseClient<Database>;
}
