import crypto from "crypto";
import { formatCompactVisitorCount } from "./visitor-format";

export { formatCompactVisitorCount };

/**
 * Normalizes an IPv4 or IPv6 address by trimming, lowercasing,
 * stripping IPv4-mapped IPv6 prefixes, and removing port numbers.
 */
export function normalizeIp(ip: string): string {
  let cleaned = ip.trim().toLowerCase();

  // Strip IPv4-mapped IPv6 prefix (e.g., ::ffff:192.168.1.1)
  if (cleaned.startsWith("::ffff:")) {
    cleaned = cleaned.slice(7);
  }

  // Strip port number if IPv4 with port (e.g., 192.168.1.1:8080)
  if (cleaned.includes(".") && cleaned.includes(":") && !cleaned.includes("::")) {
    cleaned = cleaned.split(":")[0] ?? cleaned;
  }

  return cleaned;
}

/**
 * Safely extracts client IP from trusted reverse proxy headers.
 * Order of evaluation:
 * 1. cf-connecting-ip (Cloudflare edge proxy)
 * 2. x-real-ip (Standard reverse proxy / Nginx)
 * 3. x-forwarded-for (First IP in comma-separated list)
 */
export function extractClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return normalizeIp(cfConnectingIp);
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp && xRealIp.trim().length > 0) {
    return normalizeIp(xRealIp);
  }

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor && xForwardedFor.trim().length > 0) {
    const firstIp = xForwardedFor.split(",")[0];
    if (firstIp && firstIp.trim().length > 0) {
      return normalizeIp(firstIp);
    }
  }

  return "127.0.0.1";
}

const KNOWN_BOT_PATTERNS = [
  "bot",
  "crawler",
  "spider",
  "googlebot",
  "bingbot",
  "slurp",
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "facebookexternalhit",
  "twitterbot",
  "rogerbot",
  "linkedinbot",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "pinterest",
  "slackbot",
  "vkshare",
  "w3c_validator",
  "headless",
  "lighthouse",
  "curl",
  "wget",
  "python-requests",
  "go-http-client",
  "postmanruntime",
  "node-fetch",
  "axios",
];

/**
 * Detects whether the request originates from a known crawler, bot, or prefetch mechanism.
 */
export function isBotOrPrefetch(headers: Headers): boolean {
  const purpose = headers.get("purpose")?.toLowerCase();
  const secPurpose = headers.get("sec-purpose")?.toLowerCase();
  if (purpose === "prefetch" || secPurpose === "prefetch") {
    return true;
  }

  const userAgent = (headers.get("user-agent") || "").toLowerCase();
  if (!userAgent || userAgent.trim().length === 0) {
    return true;
  }

  return KNOWN_BOT_PATTERNS.some((pattern) => userAgent.includes(pattern));
}

/**
 * Generates an irreversible, keyed HMAC-SHA256 fingerprint for the client IP and UTC date.
 * Raw IP addresses are NEVER stored or exposed.
 */
export function generateVisitorFingerprint(
  ip: string,
  utcDate: string,
  secret?: string,
): string {
  const hashSecret =
    secret ||
    process.env.VISITOR_HASH_SECRET ||
    "mf_portfolio_visitor_counter_hash_salt_2026";
  const normalized = normalizeIp(ip);
  return crypto
    .createHmac("sha256", hashSecret)
    .update(`${normalized}:${utcDate}`)
    .digest("hex");
}

export const DEFAULT_INITIAL_VISITOR_COUNT = 563;

/**
 * In-memory fallback and test store for visitor aggregation and deduplication.
 */
class GlobalVisitorMemoryStore {
  private aggregateCount: number = DEFAULT_INITIAL_VISITOR_COUNT;
  private seenFingerprints: Set<string> = new Set<string>();

  public recordVisit(fingerprint: string): { count: number; incremented: boolean } {
    if (this.seenFingerprints.has(fingerprint)) {
      return { count: this.aggregateCount, incremented: false };
    }

    this.seenFingerprints.add(fingerprint);
    this.aggregateCount += 1;
    return { count: this.aggregateCount, incremented: true };
  }

  public getCount(): number {
    return this.aggregateCount;
  }

  public reset(initialCount: number = DEFAULT_INITIAL_VISITOR_COUNT): void {
    this.aggregateCount = initialCount;
    this.seenFingerprints.clear();
  }
}

const globalForVisitor = globalThis as unknown as {
  __mfVisitorMemoryStore?: GlobalVisitorMemoryStore;
};

export function getVisitorMemoryStore(): GlobalVisitorMemoryStore {
  if (!globalForVisitor.__mfVisitorMemoryStore) {
    globalForVisitor.__mfVisitorMemoryStore = new GlobalVisitorMemoryStore();
  }
  return globalForVisitor.__mfVisitorMemoryStore;
}

/**
 * Records a visitor visit or returns the current aggregate count.
 * Excludes bots, prefetch requests, admin sessions, and draft preview requests.
 */
export async function recordPortfolioVisit(params: {
  headers: Headers;
  isAdmin?: boolean;
  isPreview?: boolean;
}): Promise<{ count: number; incremented: boolean }> {
  const { headers, isAdmin = false, isPreview = false } = params;

  // 1. If admin, preview, or bot/prefetch -> return current count without incrementing
  if (isAdmin || isPreview || isBotOrPrefetch(headers)) {
    const currentCount = await getAggregateVisitorCount();
    return { count: currentCount, incremented: false };
  }

  const clientIp = extractClientIp(headers);
  const utcDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const fingerprint = generateVisitorFingerprint(clientIp, utcDate);

  const adapterMode = process.env.DATA_ADAPTER_MODE ?? "fixture";

  if (adapterMode === "supabase") {
    try {
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase.rpc("record_portfolio_visit", {
        p_fingerprint: fingerprint,
        p_visit_date: utcDate,
      });

      if (!error && typeof data === "number") {
        return {
          count: Math.max(data, DEFAULT_INITIAL_VISITOR_COUNT),
          incremented: true,
        };
      }
    } catch {
      // Fallback gracefully to in-memory store if Supabase RPC is unavailable
    }
  }

  // Fixture / local / fallback mode
  const memoryStore = getVisitorMemoryStore();
  return memoryStore.recordVisit(fingerprint);
}

/**
 * Retrieves the current aggregate visitor count without incrementing.
 */
export async function getAggregateVisitorCount(): Promise<number> {
  const adapterMode = process.env.DATA_ADAPTER_MODE ?? "fixture";

  if (adapterMode === "supabase") {
    try {
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from("visitor_counters")
        .select("count")
        .eq("id", "homepage_hero")
        .maybeSingle();

      if (!error && data && typeof data.count === "number") {
        return Math.max(data.count, DEFAULT_INITIAL_VISITOR_COUNT);
      }
    } catch {
      // Fallback gracefully to in-memory store
    }
  }

  return getVisitorMemoryStore().getCount();
}
