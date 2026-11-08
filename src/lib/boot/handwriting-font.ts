import * as opentype from "opentype.js";
import type { BootGreeting, HandwritingFontId, HandwritingFontOption, LanguagePreference } from "@/types/portfolio";

export type { HandwritingFontId, HandwritingFontOption };

export const ALL_HANDWRITING_FONT_IDS: HandwritingFontId[] = [
  "dancing-script",
  "caveat",
  "alex-brush",
  "sacramento",
  "marck-script",
  "allura",
];

export const HANDWRITING_FONTS: Record<HandwritingFontId, HandwritingFontOption> = {
  "dancing-script": {
    id: "dancing-script",
    name: "Dancing Script",
    category: "Elegant Script",
    file: "/fonts/DancingScript.ttf",
    family: "'Dancing Script', cursive, sans-serif",
    sampleText: "Selamat Datang",
  },
  caveat: {
    id: "caveat",
    name: "Caveat",
    category: "Casual Handwriting",
    file: "/fonts/Caveat.ttf",
    family: "'Caveat', cursive, sans-serif",
    sampleText: "Selamat Datang",
  },
  "alex-brush": {
    id: "alex-brush",
    name: "Alex Brush",
    category: "Classic Calligraphy",
    file: "/fonts/AlexBrush.ttf",
    family: "'Alex Brush', cursive, sans-serif",
    sampleText: "Selamat Datang",
  },
  sacramento: {
    id: "sacramento",
    name: "Sacramento",
    category: "Minimal Monoline",
    file: "/fonts/Sacramento.ttf",
    family: "'Sacramento', cursive, sans-serif",
    sampleText: "Selamat Datang",
  },
  "marck-script": {
    id: "marck-script",
    name: "Marck Script",
    category: "Modern Signature",
    file: "/fonts/MarckScript.ttf",
    family: "'Marck Script', cursive, sans-serif",
    sampleText: "Selamat Datang",
  },
  allura: {
    id: "allura",
    name: "Allura",
    category: "Artistic Script",
    file: "/fonts/Allura.ttf",
    family: "'Allura', cursive, sans-serif",
    sampleText: "Selamat Datang",
  },
};

export const DEFAULT_HANDWRITING_FONT_ID: HandwritingFontId = "dancing-script";

export const ALL_HANDWRITING_FONT_OPTIONS: HandwritingFontOption[] = [
  HANDWRITING_FONTS["dancing-script"],
  HANDWRITING_FONTS["caveat"],
  HANDWRITING_FONTS["alex-brush"],
  HANDWRITING_FONTS["sacramento"],
  HANDWRITING_FONTS["marck-script"],
  HANDWRITING_FONTS["allura"],
];

const fontCache = new Map<HandwritingFontId, opentype.Font>();
const fontPromises = new Map<HandwritingFontId, Promise<opentype.Font | null>>();

export interface GlyphPathData {
  id: string;
  char: string;
  d: string;
  delay: number;
  duration: number;
}

export interface HandwritingLayout {
  glyphs: GlyphPathData[];
  viewBox: string;
  totalDrawTime: number;
}

/**
 * Loads and caches any of the 6 available handwriting fonts by font ID.
 * Waits for browser document.fonts.ready when available so @font-face metrics are settled.
 * Returns null gracefully in non-browser or test environments.
 */
export async function getOrLoadHandwritingFont(
  fontId: HandwritingFontId = DEFAULT_HANDWRITING_FONT_ID,
): Promise<opentype.Font | null> {
  const targetId: HandwritingFontId = HANDWRITING_FONTS[fontId]
    ? fontId
    : DEFAULT_HANDWRITING_FONT_ID;

  if (fontCache.has(targetId)) return fontCache.get(targetId)!;
  if (fontPromises.has(targetId)) return fontPromises.get(targetId)!;
  if (typeof window === "undefined") return null;

  const fontOption = HANDWRITING_FONTS[targetId];
  const promise = Promise.all([
    fetch(fontOption.file).then((res) => {
      if (!res.ok) throw new Error(`Font fetch error ${res.status}`);
      return res.arrayBuffer();
    }),
    typeof document !== "undefined" && "fonts" in document && document.fonts?.ready
      ? document.fonts.ready.catch(() => undefined)
      : Promise.resolve(),
  ])
    .then(([buf]) => {
      const parsed = opentype.parse(buf);
      fontCache.set(targetId, parsed);
      return parsed;
    })
    .catch((err) => {
      if (process.env.NODE_ENV !== "test") {
        console.warn(`Font load fallback for ${targetId}:`, err);
      }
      return null;
    });

  fontPromises.set(targetId, promise);
  return promise;
}

/**
 * Returns the current in-memory cache of loaded OpenType fonts.
 */
export function getCachedHandwritingFonts(): Map<HandwritingFontId, opentype.Font> {
  return fontCache;
}

/**
 * Preloads all 6 handwriting fonts in parallel into memory and awaits document.fonts.ready.
 */
export async function preloadAllHandwritingFonts(): Promise<Map<HandwritingFontId, opentype.Font>> {
  if (typeof window === "undefined") return fontCache;

  const docFontsReady =
    typeof document !== "undefined" && "fonts" in document && document.fonts?.ready
      ? document.fonts.ready.catch(() => undefined)
      : Promise.resolve();

  await Promise.all([
    ...ALL_HANDWRITING_FONT_IDS.map((id) => getOrLoadHandwritingFont(id)),
    docFontsReady,
  ]);
  return fontCache;
}

/**
 * Controlled random font selection per greeting:
 * 1. Filters only fonts supporting the greeting's characters (never picks incompatible font).
 * 2. Avoids consecutive identical fonts when alternatives exist.
 * 3. Randomizes selection automatically across rotations.
 */
export function selectControlledRandomFont(
  text: string,
  previousFontId?: HandwritingFontId,
  availableFontsMap?: Map<HandwritingFontId, opentype.Font>,
): HandwritingFontId {
  let candidatePool = [...ALL_HANDWRITING_FONT_IDS];

  // If parsed font instances are in memory, verify full glyph compatibility
  if (availableFontsMap && availableFontsMap.size > 0 && text.trim().length > 0) {
    const fullyCompatible = candidatePool.filter((id) => {
      const font = availableFontsMap.get(id);
      return font ? hasAllGlyphs(font, text) : true;
    });
    if (fullyCompatible.length > 0) {
      candidatePool = fullyCompatible;
    }
  }

  // Prevent selecting the same font consecutively if alternatives exist
  const eligibleFonts =
    candidatePool.length > 1 && previousFontId
      ? candidatePool.filter((id) => id !== previousFontId)
      : candidatePool;

  const randomIndex = Math.floor(Math.random() * eligibleFonts.length);
  return eligibleFonts[randomIndex] ?? DEFAULT_HANDWRITING_FONT_ID;
}

/**
 * Formats the authentic greeting origin label from project data.
 * Priority: regionNote (if set and non-empty), fallback to language.
 */
export function getGreetingOriginLabel(
  greeting: Pick<BootGreeting, "language"> & { regionNote?: string | null; regionNoteId?: string | null },
  language: LanguagePreference = "en",
): string {
  const localizedRegion =
    language === "id" && greeting.regionNoteId && greeting.regionNoteId.trim().length > 0
      ? greeting.regionNoteId.trim()
      : greeting.regionNote
        ? greeting.regionNote.trim()
        : "";

  if (localizedRegion.length > 0) {
    return localizedRegion.toUpperCase();
  }
  return greeting.language.trim().toUpperCase();
}

/**
 * Checks whether all characters in the text have glyph representation in the font (not .notdef).
 */
export function hasAllGlyphs(font: opentype.Font, text: string): boolean {
  try {
    const glyphs = font.stringToGlyphs(text);
    return glyphs.every((g) => g.name !== ".notdef");
  } catch {
    return false;
  }
}

/**
 * Calculates responsive base font size based on text length.
 * Short greetings ('Horas', 'Tabe'') get larger sizes for visual prominence.
 * Long greetings ('Wilujeng Sumping', 'Salamaik Datang') get scaled sizes to prevent edge clipping.
 */
export function getDynamicFontSize(text: string): number {
  const len = text.trim().length;
  if (len <= 5) return 116;
  if (len <= 8) return 104;
  if (len <= 12) return 92;
  if (len <= 15) return 82;
  return 74;
}

/**
 * Converts OpenType path commands into an SVG path data string (`d` attribute).
 * Replaces opentype.js's built-in `Path.prototype.toPathData`, which contains a critical bug
 * in `roundDecimal` where floating-point remainders < 1e-6 (scientific notation like `5.68e-14`)
 * are concatenated with `"e+2"` (`"5.68e-14e+2"`), producing `NaN` in the SVG path string and
 * causing browsers to abort/clip glyph rendering mid-stroke.
 */
export function commandsToSvgPathData(
  commands: opentype.PathCommand[],
  decimalPlaces = 2,
): string {
  const factor = Math.pow(10, decimalPlaces);
  const fmt = (n: number): string => {
    if (!Number.isFinite(n)) return "0";
    const rounded = Math.round((n + Number.EPSILON) * factor) / factor;
    const normalized = Object.is(rounded, -0) ? 0 : rounded;
    return Number.isInteger(normalized)
      ? String(normalized)
      : normalized.toFixed(decimalPlaces).replace(/\.?0+$/, "");
  };

  const parts: string[] = [];
  for (const cmd of commands) {
    switch (cmd.type) {
      case "M":
        parts.push(`M${fmt(cmd.x)} ${fmt(cmd.y)}`);
        break;
      case "L":
        parts.push(`L${fmt(cmd.x)} ${fmt(cmd.y)}`);
        break;
      case "C":
        parts.push(
          `C${fmt(cmd.x1)} ${fmt(cmd.y1)} ${fmt(cmd.x2)} ${fmt(cmd.y2)} ${fmt(cmd.x)} ${fmt(cmd.y)}`,
        );
        break;
      case "Q":
        parts.push(`Q${fmt(cmd.x1)} ${fmt(cmd.y1)} ${fmt(cmd.x)} ${fmt(cmd.y)}`);
        break;
      case "Z":
        parts.push("Z");
        break;
    }
  }
  return parts.join("");
}

/**
 * Decomposes text into sequential vector paths for natural handwriting drawing animation.
 */
export function getGlyphPaths(
  font: opentype.Font,
  text: string,
  fontSize?: number,
): HandwritingLayout | null {
  if (!text || !text.trim() || !hasAllGlyphs(font, text)) {
    return null;
  }

  const resolvedFontSize = fontSize ?? getDynamicFontSize(text);
  const glyphs: GlyphPathData[] = [];
  const charDuration = 0.38; // Duration to draw each character stroke (seconds)
  const charStagger = 0.065; // Stagger delay between consecutive characters (seconds)
  let visualIndex = 0;

  let minGlyphX = Infinity;
  let minGlyphY = Infinity;
  let maxGlyphX = -Infinity;
  let maxGlyphY = -Infinity;

  const trackCoord = (x: number, y: number) => {
    if (Number.isFinite(x)) {
      if (x < minGlyphX) minGlyphX = x;
      if (x > maxGlyphX) maxGlyphX = x;
    }
    if (Number.isFinite(y)) {
      if (y < minGlyphY) minGlyphY = y;
      if (y > maxGlyphY) maxGlyphY = y;
    }
  };

  font.forEachGlyph(text, 0, 0, resolvedFontSize, undefined, (glyph, x, y, size) => {
    const p = glyph.getPath(x, y, size);
    if (p.commands && p.commands.length > 0) {
      const gbb = p.getBoundingBox();
      trackCoord(gbb.x1, gbb.y1);
      trackCoord(gbb.x2, gbb.y2);

      for (const cmd of p.commands) {
        if (cmd.type === "M" || cmd.type === "L") {
          trackCoord(cmd.x, cmd.y);
        } else if (cmd.type === "Q") {
          trackCoord(cmd.x1, cmd.y1);
          trackCoord(cmd.x, cmd.y);
        } else if (cmd.type === "C") {
          trackCoord(cmd.x1, cmd.y1);
          trackCoord(cmd.x2, cmd.y2);
          trackCoord(cmd.x, cmd.y);
        }
      }

      glyphs.push({
        id: `glyph-${visualIndex}-${glyph.index}`,
        char: glyph.unicode ? String.fromCharCode(glyph.unicode) : "",
        d: commandsToSvgPathData(p.commands, 2),
        delay: visualIndex * charStagger,
        duration: charDuration,
      });
      visualIndex++;
    }
  });

  if (glyphs.length === 0) return null;

  // Fallback to fullPath bounding box if glyphs did not yield valid bounds
  const fullPath = font.getPath(text, 0, 0, resolvedFontSize);
  const bb = fullPath.getBoundingBox();
  const actualMinX = Math.min(minGlyphX, bb.x1);
  const actualMinY = Math.min(minGlyphY, bb.y1);
  const actualMaxX = Math.max(maxGlyphX, bb.x2);
  const actualMaxY = Math.max(maxGlyphY, bb.y2);

  const rawWidth = Math.max(1, actualMaxX - actualMinX);
  const rawHeight = Math.max(1, actualMaxY - actualMinY);

  // Dynamic padding considering glyph bounds, ascenders/descenders, and stroke width
  const strokeWidth = 1.8;
  const strokeAllowance = Math.ceil(strokeWidth * 2.5); // 5px allowance for caps/miters
  const padX = Math.max(38, Math.round(rawWidth * 0.08)) + strokeAllowance;
  const padY = Math.max(46, Math.round(rawHeight * 0.25)) + strokeAllowance;

  const viewBoxMinX = actualMinX - padX;
  const viewBoxMinY = actualMinY - padY;
  const viewBoxWidth = rawWidth + padX * 2;
  const viewBoxHeight = rawHeight + padY * 2;

  const viewBox = `${viewBoxMinX.toFixed(2)} ${viewBoxMinY.toFixed(2)} ${viewBoxWidth.toFixed(2)} ${viewBoxHeight.toFixed(2)}`;
  const totalDrawTime = Math.max(0.4, (visualIndex - 1) * charStagger + charDuration);

  return {
    glyphs,
    viewBox,
    totalDrawTime,
  };
}
