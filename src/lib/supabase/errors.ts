export class SupabaseConfigurationError extends Error {
  public readonly code = "SUPABASE_CONFIGURATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export class SupabaseConnectionError extends Error {
  public readonly code = "SUPABASE_CONNECTION_ERROR";
  public readonly causeError?: unknown;

  constructor(message: string, causeError?: unknown) {
    super(message);
    this.name = "SupabaseConnectionError";
    this.causeError = causeError;
  }
}

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

export function getRequiredSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new SupabaseConfigurationError(
      "SupabaseConfigurationError: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured.",
    );
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    throw new SupabaseConfigurationError(
      `SupabaseConfigurationError: NEXT_PUBLIC_SUPABASE_URL "${url}" is not a valid HTTP/HTTPS URL.`,
    );
  }

  return { url, anonKey };
}
