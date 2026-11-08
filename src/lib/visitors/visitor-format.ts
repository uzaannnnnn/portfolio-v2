import type { LanguagePreference } from "@/types/portfolio";

/**
 * Formats a visitor count into compact notation according to active language.
 * Client-safe pure utility (zero server/Node dependencies).
 *
 * Rules:
 * - Below 1,000: integer string (e.g. 982 -> "982").
 * - At or above 1,000: compact 'k' notation (e.g. 1000 -> "1k", 1420 -> "1.42k" / "1,42k").
 * - At or above 1,000,000: compact 'M' notation (e.g. 1500000 -> "1.5M" / "1,5M").
 * - Decimal separator: '.' for English, ',' for Indonesian.
 * - Maximum two decimal places, trailing zeros removed.
 */
export function formatCompactVisitorCount(
  count: number,
  language: LanguagePreference,
): string {
  if (!Number.isFinite(count) || count < 0) {
    return "0";
  }

  const safeCount = Math.floor(count);

  if (safeCount < 1000) {
    return safeCount.toString();
  }

  const formatWithSuffix = (value: number, suffix: string): string => {
    const rounded = Math.round(value * 100) / 100;
    const numStr = rounded.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    const localized = language === "id" ? numStr.replace(".", ",") : numStr;
    return `${localized}${suffix}`;
  };

  if (safeCount < 1_000_000) {
    return formatWithSuffix(safeCount / 1000, "k");
  }

  return formatWithSuffix(safeCount / 1_000_000, "M");
}

