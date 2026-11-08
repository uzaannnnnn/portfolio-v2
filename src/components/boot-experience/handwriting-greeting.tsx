"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  type HandwritingLayout,
  type HandwritingFontId,
  HANDWRITING_FONTS,
  DEFAULT_HANDWRITING_FONT_ID,
} from "@/lib/boot/handwriting-font";

interface HandwritingGreetingProps {
  text: string;
  layout: HandwritingLayout | null;
  fontId?: HandwritingFontId;
  prefersReducedMotion: boolean | null;
}

export function HandwritingGreeting({
  text,
  layout,
  fontId = DEFAULT_HANDWRITING_FONT_ID,
  prefersReducedMotion,
}: HandwritingGreetingProps) {
  const activeFont = HANDWRITING_FONTS[fontId] ?? HANDWRITING_FONTS[DEFAULT_HANDWRITING_FONT_ID];
  const groupRef = React.useRef<SVGGElement | null>(null);
  const textRef = React.useRef<SVGTextElement | null>(null);
  const [measuredViewBox, setMeasuredViewBox] = React.useState<string | null>(null);
  const [fallbackViewBox, setFallbackViewBox] = React.useState<string>("0 0 960 220");

  // Reset measured viewBox when layout or text changes
  React.useEffect(() => {
    setMeasuredViewBox(null);
  }, [layout, text, fontId]);

  // Verify live SVG DOM getBBox() after paths mount to guarantee zero browser clipping
  React.useEffect(() => {
    if (!layout || !groupRef.current) return;
    let active = true;

    const measureGroupBBox = () => {
      if (!active || !groupRef.current) return;
      try {
        const bbox = groupRef.current.getBBox();
        if (bbox && bbox.width > 0 && bbox.height > 0) {
          const vbParts = layout.viewBox.split(" ").map(Number);
          const curMinX = vbParts[0] ?? 0;
          const curMinY = vbParts[1] ?? 0;
          const curW = vbParts[2] ?? 0;
          const curH = vbParts[3] ?? 0;
          const curMaxX = curMinX + curW;
          const curMaxY = curMinY + curH;

          const strokePad = 16;
          const reqMinX = bbox.x - strokePad;
          const reqMinY = bbox.y - strokePad;
          const reqMaxX = bbox.x + bbox.width + strokePad;
          const reqMaxY = bbox.y + bbox.height + strokePad;

          if (
            reqMinX < curMinX ||
            reqMinY < curMinY ||
            reqMaxX > curMaxX ||
            reqMaxY > curMaxY
          ) {
            const finalMinX = Math.min(curMinX, reqMinX);
            const finalMinY = Math.min(curMinY, reqMinY);
            const finalMaxX = Math.max(curMaxX, reqMaxX);
            const finalMaxY = Math.max(curMaxY, reqMaxY);
            setMeasuredViewBox(
              `${finalMinX.toFixed(2)} ${finalMinY.toFixed(2)} ${(finalMaxX - finalMinX).toFixed(2)} ${(finalMaxY - finalMinY).toFixed(2)}`,
            );
          }
        }
      } catch {
        // Ignore in non-DOM or JSDOM test environments where getBBox is unimplemented
      }
    };

    measureGroupBBox();
    return () => {
      active = false;
    };
  }, [layout]);

  // Measure fallback <text> after document.fonts.ready using getBBox() and getComputedTextLength()
  React.useEffect(() => {
    if (layout && layout.glyphs.length > 0) return;
    let active = true;

    const measureFallbackText = async () => {
      if (typeof document !== "undefined" && "fonts" in document && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Ignore
        }
      }
      if (!active || !textRef.current) return;
      try {
        const bbox = textRef.current.getBBox();
        const computedLen =
          typeof textRef.current.getComputedTextLength === "function"
            ? textRef.current.getComputedTextLength()
            : bbox.width;
        const effectiveW = Math.max(bbox.width, computedLen);
        if (effectiveW > 0 && bbox.height > 0) {
          const padX = Math.max(48, Math.round(effectiveW * 0.1));
          const padY = Math.max(48, Math.round(bbox.height * 0.35));
          const minX = bbox.x - padX;
          const minY = bbox.y - padY;
          const totalW = effectiveW + padX * 2;
          const totalH = bbox.height + padY * 2;
          setFallbackViewBox(
            `${minX.toFixed(2)} ${minY.toFixed(2)} ${totalW.toFixed(2)} ${totalH.toFixed(2)}`,
          );
        }
      } catch {
        // Ignore in JSDOM
      }
    };

    measureFallbackText();
    return () => {
      active = false;
    };
  }, [layout, text, fontId]);

  // Primary: SVG vector glyph paths drawn stroke-by-stroke
  if (layout && layout.glyphs.length > 0) {
    return (
      <svg
        viewBox={measuredViewBox ?? layout.viewBox}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
        className="w-full max-w-[95vw] sm:max-w-[88vw] md:max-w-[80vw] lg:max-w-[920px] h-auto max-h-[46vh] overflow-visible select-none"
        aria-hidden="true"
        shapeRendering="geometricPrecision"
      >
        <g ref={groupRef} className="text-foreground">
          {layout.glyphs.map((glyph) => (
            <motion.path
              key={glyph.id}
              d={glyph.d}
              initial={
                prefersReducedMotion
                  ? { pathLength: 1, fillOpacity: 1, strokeOpacity: 1 }
                  : { pathLength: 0, fillOpacity: 0, strokeOpacity: 0 }
              }
              animate={{
                pathLength: 1,
                fillOpacity: 1,
                strokeOpacity: 1,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.05 }
                  : {
                      strokeOpacity: {
                        delay: glyph.delay,
                        duration: 0.01,
                      },
                      pathLength: {
                        delay: glyph.delay,
                        duration: glyph.duration,
                        ease: [0.33, 1, 0.68, 1],
                      },
                      fillOpacity: {
                        delay: glyph.delay + glyph.duration * 0.65,
                        duration: 0.3,
                        ease: "easeOut",
                      },
                    }
              }
              stroke="currentColor"
              fill="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      </svg>
    );
  }

  // Multilingual or loading fallback: SVG <text> with responsive cursive typography & generous viewBox
  const fallbackFontSize =
    text.length <= 5 ? 84 : text.length <= 8 ? 74 : text.length <= 12 ? 64 : text.length <= 15 ? 56 : 48;

  return (
    <svg
      viewBox={fallbackViewBox}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className="w-full max-w-[95vw] sm:max-w-[88vw] md:max-w-[80vw] lg:max-w-[920px] h-auto max-h-[46vh] overflow-visible select-none"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <motion.text
        ref={textRef}
        x="480"
        y="118"
        textAnchor="middle"
        dominantBaseline="middle"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0.05 : 0.45, ease: "easeOut" }}
        className="fill-foreground"
        style={{
          fontSize: `${fallbackFontSize}px`,
          fontFamily: activeFont.family,
          fontWeight: 600,
        }}
      >
        {text}
      </motion.text>
    </svg>
  );
}
