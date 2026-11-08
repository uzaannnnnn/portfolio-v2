import { describe, it, expect, beforeEach } from "vitest";
import {
  formatCompactVisitorCount,
  normalizeIp,
  extractClientIp,
  isBotOrPrefetch,
  generateVisitorFingerprint,
  getVisitorMemoryStore,
  recordPortfolioVisit,
  getAggregateVisitorCount,
} from "@/lib/visitors/visitor-service";

describe("Visitor Counter Unit & Service Tests", () => {
  beforeEach(() => {
    process.env.DATA_ADAPTER_MODE = "fixture";
    getVisitorMemoryStore().reset(0);
  });

  describe("1. formatCompactVisitorCount", () => {
    it("formats integers below 1,000 completely in English and Indonesian", () => {
      expect(formatCompactVisitorCount(0, "en")).toBe("0");
      expect(formatCompactVisitorCount(0, "id")).toBe("0");
      expect(formatCompactVisitorCount(42, "en")).toBe("42");
      expect(formatCompactVisitorCount(42, "id")).toBe("42");
      expect(formatCompactVisitorCount(982, "en")).toBe("982");
      expect(formatCompactVisitorCount(982, "id")).toBe("982");
      expect(formatCompactVisitorCount(999, "en")).toBe("999");
      expect(formatCompactVisitorCount(999, "id")).toBe("999");
    });

    it("formats exactly 1,000 as 1k without trailing decimal zeros", () => {
      expect(formatCompactVisitorCount(1000, "en")).toBe("1k");
      expect(formatCompactVisitorCount(1000, "id")).toBe("1k");
    });

    it("formats 1,420 as 1.42k in English and 1,42k in Indonesian", () => {
      expect(formatCompactVisitorCount(1420, "en")).toBe("1.42k");
      expect(formatCompactVisitorCount(1420, "id")).toBe("1,42k");
    });

    it("formats 12,500 as 12.5k in English and 12,5k in Indonesian (removes trailing zeros)", () => {
      expect(formatCompactVisitorCount(12500, "en")).toBe("12.5k");
      expect(formatCompactVisitorCount(12500, "id")).toBe("12,5k");
    });

    it("formats 100,000 as 100k in English and Indonesian", () => {
      expect(formatCompactVisitorCount(100000, "en")).toBe("100k");
      expect(formatCompactVisitorCount(100000, "id")).toBe("100k");
    });

    it("removes unnecessary trailing zeros for exact tenths (e.g. 1,400 -> 1.4k / 1,4k)", () => {
      expect(formatCompactVisitorCount(1400, "en")).toBe("1.4k");
      expect(formatCompactVisitorCount(1400, "id")).toBe("1,4k");
    });

    it("formats large numbers using M suffix with appropriate decimal separators", () => {
      expect(formatCompactVisitorCount(1000000, "en")).toBe("1M");
      expect(formatCompactVisitorCount(1000000, "id")).toBe("1M");
      expect(formatCompactVisitorCount(1500000, "en")).toBe("1.5M");
      expect(formatCompactVisitorCount(1500000, "id")).toBe("1,5M");
      expect(formatCompactVisitorCount(2450000, "en")).toBe("2.45M");
      expect(formatCompactVisitorCount(2450000, "id")).toBe("2,45M");
    });

    it("handles invalid or negative numbers safely", () => {
      expect(formatCompactVisitorCount(-5, "en")).toBe("0");
      expect(formatCompactVisitorCount(NaN, "en")).toBe("0");
      expect(formatCompactVisitorCount(Infinity, "en")).toBe("0");
    });
  });

  describe("2. normalizeIp & extractClientIp", () => {
    it("normalizes IPv4 addresses and strips port numbers", () => {
      expect(normalizeIp(" 192.168.1.1 ")).toBe("192.168.1.1");
      expect(normalizeIp("203.0.113.195:443")).toBe("203.0.113.195");
    });

    it("normalizes IPv4-mapped IPv6 addresses", () => {
      expect(normalizeIp("::ffff:192.168.1.1")).toBe("192.168.1.1");
    });

    it("extracts from Cloudflare cf-connecting-ip header first", () => {
      const headers = new Headers({
        "cf-connecting-ip": "104.28.19.45",
        "x-real-ip": "192.168.1.1",
        "x-forwarded-for": "10.0.0.1, 10.0.0.2",
      });
      expect(extractClientIp(headers)).toBe("104.28.19.45");
    });

    it("extracts from x-real-ip header when Cloudflare header is absent", () => {
      const headers = new Headers({
        "x-real-ip": "198.51.100.14",
        "x-forwarded-for": "10.0.0.1, 10.0.0.2",
      });
      expect(extractClientIp(headers)).toBe("198.51.100.14");
    });

    it("extracts the first client IP from x-forwarded-for header", () => {
      const headers = new Headers({
        "x-forwarded-for": "203.0.113.50, 192.168.1.1, 10.0.0.1",
      });
      expect(extractClientIp(headers)).toBe("203.0.113.50");
    });

    it("falls back to 127.0.0.1 when no proxy headers exist", () => {
      const headers = new Headers();
      expect(extractClientIp(headers)).toBe("127.0.0.1");
    });
  });

  describe("3. isBotOrPrefetch", () => {
    it("detects prefetch requests from purpose headers", () => {
      expect(new Headers({ purpose: "prefetch" })).toBeTruthy();
      expect(isBotOrPrefetch(new Headers({ purpose: "prefetch" }))).toBe(true);
      expect(isBotOrPrefetch(new Headers({ "sec-purpose": "prefetch" }))).toBe(true);
    });

    it("detects known search crawlers, headless browsers, and HTTP scrapers", () => {
      const botUserAgents = [
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0.0.0 Safari/537.36",
        "curl/7.88.1",
        "python-requests/2.31.0",
        "Mozilla/5.0 (compatible; Lighthouse)",
      ];

      for (const ua of botUserAgents) {
        expect(isBotOrPrefetch(new Headers({ "user-agent": ua }))).toBe(true);
      }
    });

    it("allows standard human web browsers", () => {
      const humanUserAgents = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
      ];

      for (const ua of humanUserAgents) {
        expect(isBotOrPrefetch(new Headers({ "user-agent": ua }))).toBe(false);
      }
    });
  });

  describe("4. generateVisitorFingerprint Privacy & Irreversibility", () => {
    it("generates a 64-character SHA256 hex string", () => {
      const fp = generateVisitorFingerprint("198.51.100.22", "2026-11-07", "test-secret");
      expect(fp).toMatch(/^[a-f0-9]{64}$/);
    });

    it("never contains the raw IP address in plaintext", () => {
      const rawIp = "198.51.100.22";
      const fp = generateVisitorFingerprint(rawIp, "2026-11-07", "test-secret");
      expect(fp).not.toContain(rawIp);
    });

    it("is deterministic for the same IP, date, and secret", () => {
      const fp1 = generateVisitorFingerprint("198.51.100.22", "2026-11-07", "test-secret");
      const fp2 = generateVisitorFingerprint("198.51.100.22", "2026-11-07", "test-secret");
      expect(fp1).toBe(fp2);
    });

    it("changes when the UTC calendar date changes", () => {
      const fpDay1 = generateVisitorFingerprint("198.51.100.22", "2026-11-07", "test-secret");
      const fpDay2 = generateVisitorFingerprint("198.51.100.22", "2026-11-08", "test-secret");
      expect(fpDay1).not.toBe(fpDay2);
    });

    it("changes when the client IP changes", () => {
      const fpIp1 = generateVisitorFingerprint("198.51.100.22", "2026-11-07", "test-secret");
      const fpIp2 = generateVisitorFingerprint("198.51.100.23", "2026-11-07", "test-secret");
      expect(fpIp1).not.toBe(fpIp2);
    });
  });

  describe("5. Visitor Counting, Daily Deduplication & Exclusion Rules", () => {
    const validBrowserHeader = (ip: string) =>
      new Headers({
        "cf-connecting-ip": ip,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      });

    it("increments the counter on the first visit from a new IP", async () => {
      const res = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.1"),
      });

      expect(res.incremented).toBe(true);
      expect(res.count).toBe(1);
      expect(await getAggregateVisitorCount()).toBe(1);
    });

    it("does not increment on repeated visits from the same IP on the same UTC day", async () => {
      // First visit
      const first = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.2"),
      });
      expect(first.incremented).toBe(true);
      expect(first.count).toBe(1);

      // Repeated visit from same IP on same day
      const second = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.2"),
      });
      expect(second.incremented).toBe(false);
      expect(second.count).toBe(1);

      // Third repeated visit from same IP
      const third = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.2"),
      });
      expect(third.incremented).toBe(false);
      expect(third.count).toBe(1);
    });

    it("increments for distinct IPs on the same UTC day", async () => {
      const v1 = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.10"),
      });
      expect(v1.count).toBe(1);

      const v2 = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.11"),
      });
      expect(v2.count).toBe(2);

      const v3 = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.12"),
      });
      expect(v3.count).toBe(3);
    });

    it("excludes known bots and crawlers without incrementing", async () => {
      const botHeaders = new Headers({
        "cf-connecting-ip": "66.249.66.1",
        "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
      });

      const res = await recordPortfolioVisit({ headers: botHeaders });
      expect(res.incremented).toBe(false);
      expect(res.count).toBe(0);
      expect(await getAggregateVisitorCount()).toBe(0);
    });

    it("excludes admin visits from incrementing", async () => {
      const res = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.99"),
        isAdmin: true,
      });

      expect(res.incremented).toBe(false);
      expect(res.count).toBe(0);
      expect(await getAggregateVisitorCount()).toBe(0);
    });

    it("excludes preview requests from incrementing", async () => {
      const res = await recordPortfolioVisit({
        headers: validBrowserHeader("198.51.100.99"),
        isPreview: true,
      });

      expect(res.incremented).toBe(false);
      expect(res.count).toBe(0);
      expect(await getAggregateVisitorCount()).toBe(0);
    });

    it("handles concurrent requests from the same IP atomically", async () => {
      const headers = validBrowserHeader("198.51.100.77");

      const results = await Promise.all([
        recordPortfolioVisit({ headers }),
        recordPortfolioVisit({ headers }),
        recordPortfolioVisit({ headers }),
        recordPortfolioVisit({ headers }),
        recordPortfolioVisit({ headers }),
      ]);

      const increments = results.filter((r) => r.incremented);
      expect(increments.length).toBe(1); // Exactly one increment!
      expect(await getAggregateVisitorCount()).toBe(1);
    });
  });
});

