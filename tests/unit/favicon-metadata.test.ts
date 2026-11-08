import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("geist/font/sans", () => ({
  GeistSans: { variable: "--font-geist-sans" },
}));
vi.mock("geist/font/mono", () => ({
  GeistMono: { variable: "--font-geist-mono" },
}));

import { metadata } from "@/app/layout";

describe("Favicon & Icon Assets and Metadata", () => {
  const publicDir = path.join(process.cwd(), "public");

  it("verifies all required favicon and icon assets exist in public/", () => {
    const requiredFiles = [
      "favicon.ico",
      "favicon.svg",
      "icon.png",
      "icon-32.png",
      "icon-192.png",
      "icon-512.png",
      "apple-icon.png",
      "apple-touch-icon.png",
      "site.webmanifest",
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(publicDir, file);
      expect(fs.existsSync(fullPath), `Expected ${file} to exist in public/`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `Expected ${file} to be non-empty`).toBeGreaterThan(0);
    }
  });

  it("verifies favicon.svg contains clean vector specifications matching the 'F.' logo", () => {
    const svgContent = fs.readFileSync(path.join(publicDir, "favicon.svg"), "utf-8");
    expect(svgContent).toContain('viewBox="0 0 1024 1024"');
    expect(svgContent).toContain('fill="#000000"');
    expect(svgContent).toContain('fill="#FFFFFF"');
    expect(svgContent).toContain("<polygon");
    expect(svgContent).toContain("<circle");
    expect(svgContent).not.toContain("gradient");
    expect(svgContent).not.toContain("shadow");
  });

  it("verifies site.webmanifest contains PWA metadata and icon references", () => {
    const manifestContent = JSON.parse(
      fs.readFileSync(path.join(publicDir, "site.webmanifest"), "utf-8"),
    );
    expect(manifestContent.name).toBe("Muhamad Fauzan");
    expect(manifestContent.background_color).toBe("#000000");
    expect(manifestContent.theme_color).toBe("#000000");
    expect(Array.isArray(manifestContent.icons)).toBe(true);

    const sizes = manifestContent.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain("32x32");
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("verifies Next.js RootLayout metadata exports the official favicon references", () => {
    expect(metadata.icons).toBeDefined();
    expect(metadata.manifest).toBe("/site.webmanifest");

    const icons = metadata.icons as {
      icon?: Array<{ url: string; sizes?: string; type?: string }>;
      shortcut?: string;
      apple?: Array<{ url: string; sizes?: string; type?: string }>;
    };

    expect(icons.shortcut).toBe("/favicon.ico");
    expect(Array.isArray(icons.icon)).toBe(true);

    const iconUrls = (icons.icon ?? []).map((i) => i.url);
    expect(iconUrls).toContain("/favicon.ico");
    expect(iconUrls).toContain("/favicon.svg");
    expect(iconUrls).toContain("/icon.png");
    expect(iconUrls).toContain("/icon-192.png");

    const appleUrls = (icons.apple ?? []).map((i) => i.url);
    expect(appleUrls).toContain("/apple-icon.png");
  });

  it("verifies RootLayout and public page metadata configure title exactly as 'Muhamad Fauzan'", async () => {
    const layoutTitle = metadata.title as { default?: string; template?: string };
    expect(layoutTitle.default).toBe("Muhamad Fauzan");
    expect(layoutTitle.template).toBe("%s | Muhamad Fauzan");

    const pageModule = await import("@/app/(public)/page");
    const pageMeta = pageModule.metadata;
    expect(pageMeta.title).toEqual({ absolute: "Muhamad Fauzan" });
    expect(pageMeta.openGraph?.title).toBe("Muhamad Fauzan");
    expect(pageMeta.twitter?.title).toBe("Muhamad Fauzan");
  });
});
