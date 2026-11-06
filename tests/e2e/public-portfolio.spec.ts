import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR =
  "/Users/zannho/.gemini/antigravity/brain/ca84d6f3-11dc-4b2d-975c-32f3c10448ab";

test.describe("Sprint 1 — Public Portfolio & Indonesian Boot Experience", () => {
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
    await page.waitForTimeout(450);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint1_boot_greeting.png"),
      fullPage: false,
    });

    // Jump to welcome screen and verify personal welcome message
    await page.getByTestId("boot-jump-welcome-button").click();
    const welcomeStage = page.getByTestId("boot-welcome-stage");
    await expect(welcomeStage).toContainText("Muhamad Fauzan");
    await expect(welcomeStage).toContainText("Software Engineer");
    await expect(welcomeStage).toContainText("Welcome to my portfolio.");
    await page.waitForTimeout(450);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint1_boot_welcome.png"),
      fullPage: false,
    });

    // Enter portfolio
    await page.getByTestId("boot-enter-portfolio-button").click();
    await expect(overlay).toBeHidden();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint1_homepage_desktop.png"),
      fullPage: true,
    });

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

  test("draft projects (GeoEntity, ClayCV, SPK Bansos SAW) are not exposed publicly", async ({
    page,
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

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint1_projects_draft_isolated.png"),
      fullPage: true,
    });

    // Direct access to draft project slug returns 404
    const response = await page.goto("/projects/geoentity");
    expect(response?.status()).toBe(404);
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

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint1_mobile_navigation.png"),
      fullPage: false,
    });
  });
});
