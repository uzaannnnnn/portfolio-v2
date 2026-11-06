import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR =
  "/Users/zannho/.gemini/antigravity/brain/ca84d6f3-11dc-4b2d-975c-32f3c10448ab";

test.describe("Sprint 1 & 2 — Public Portfolio, Showcase, SEO & Draft Isolation", () => {
  test("first visit displays Indonesian boot experience, allows skipping/entering, and persists on reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const overlay = page.getByTestId("boot-experience-overlay");
    await expect(overlay).toBeVisible();
    await expect(page.getByTestId("boot-greeting-stage")).toContainText(
      "Selamat Datang",
    );

    // Jump to welcome screen and verify personal welcome message
    await page.getByTestId("boot-jump-welcome-button").click();
    const welcomeStage = page.getByTestId("boot-welcome-stage");
    await expect(welcomeStage).toContainText("Muhamad Fauzan");
    await expect(welcomeStage).toContainText("Software Engineer");
    await expect(welcomeStage).toContainText("Welcome to my portfolio.");

    // Enter portfolio
    await page.getByTestId("boot-enter-portfolio-button").click();
    await expect(overlay).toBeHidden();

    // Subsequent visit skips boot experience automatically
    await page.reload();
    await expect(overlay).toBeHidden();
    await expect(
      page.getByRole("heading", {
        name: "Building software that solves real-world problems.",
      }),
    ).toBeVisible();

    // Returning visitor can replay the boot experience from the navbar
    await page.getByTestId("navbar-replay-boot-button").click();
    await expect(overlay).toBeVisible();
    await page.getByTestId("boot-skip-button").click();
    await expect(overlay).toBeHidden();
  });

  test("draft projects (GeoEntity, ClayCV, SPK Bansos SAW) are strictly isolated from public pages, metadata, and sitemap", async ({
    page,
    request,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("mf_portfolio_boot_seen_v1", "1");
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/projects");
    await expect(
      page.getByRole("heading", { name: "Projects Directory" }),
    ).toBeVisible();
    await expect(
      page.getByText("No published projects are live yet"),
    ).toBeVisible();

    // Direct access to all 3 draft project slugs returns 404
    for (const draftSlug of ["geoentity", "claycv", "spk-bansos-saw"]) {
      const response = await page.goto(`/projects/${draftSlug}`);
      expect(response?.status()).toBe(404);
    }

    // Verify sitemap.xml excludes draft projects and includes published notes
    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain("/notes/explicit-draft-to-publish-content-workflows");
    expect(sitemapXml).not.toContain("/projects/geoentity");
    expect(sitemapXml).not.toContain("/projects/claycv");
    expect(sitemapXml).not.toContain("/projects/spk-bansos-saw");

    // Verify robots.txt disallows /admin and points to sitemap.xml
    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    const robotsTxt = await robotsRes.text();
    expect(robotsTxt).toContain("Disallow: /admin");
    expect(robotsTxt).toContain("sitemap.xml");
  });

  test("Engineering Notes directory, MDX detail page, and Homepage JSON-LD structured data work across desktop and mobile", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("mf_portfolio_boot_seen_v1", "1");
    });

    // Verify JSON-LD structured data on Homepage
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const jsonLdContent = await page
      .locator("script#portfolio-jsonld")
      .textContent();
    expect(jsonLdContent).toBeTruthy();
    const parsedJsonLd = JSON.parse(jsonLdContent ?? "{}");
    expect(parsedJsonLd["@context"]).toBe("https://schema.org");

    // Navigate to Engineering Notes directory
    await page.goto("/notes");
    await expect(
      page.getByRole("heading", { name: "Engineering Notes" }),
    ).toBeVisible();
    const noteCard = page.getByTestId(
      "note-card-explicit-draft-to-publish-content-workflows",
    );
    await expect(noteCard).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint2_notes_directory_desktop.png"),
      fullPage: true,
    });

    // Open Engineering Note detail page and verify safe MDX blocks
    await noteCard.getByRole("link", { name: "Read Article" }).click();
    await expect(page).toHaveURL(
      /\/notes\/explicit-draft-to-publish-content-workflows$/,
    );
    await expect(page.getByTestId("note-detail-article")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Revision Snapshot Pattern" }),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint2_note_detail_desktop.png"),
      fullPage: true,
    });

    // Mobile screenshot of Note Detail Page
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint2_note_detail_mobile.png"),
      fullPage: true,
    });
  });

  test("public navigation and mobile menu drawer work across routes", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("mf_portfolio_boot_seen_v1", "1");
    });

    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: "Muhamad Fauzan", level: 1 }),
    ).toBeVisible();

    await page.goto("/resume");
    await expect(
      page.getByRole("heading", { name: "Resume & Technical Summary" }),
    ).toBeVisible();

    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { name: "Contact Muhamad Fauzan" }),
    ).toBeVisible();

    // Verify mobile viewport navigation drawer
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const menuToggle = page.getByTestId("mobile-menu-toggle");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    const drawer = page.getByTestId("mobile-navigation-drawer");
    await expect(drawer).toBeVisible();
  });
});
