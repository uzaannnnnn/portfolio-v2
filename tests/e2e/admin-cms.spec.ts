import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR =
  "/Users/zannho/.gemini/antigravity/brain/8a0a8f8f-c630-4609-8f5c-d429bbb130af";

test.describe("Sprint 4 — Admin Dashboard, Single-Admin Auth, CMS CRUD & Publishing Workflow", () => {
  test("redirects unauthenticated visitors from /admin to /admin/login and blocks unauthorized preview", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?reason=unauthorized/);
    await expect(
      page.getByRole("heading", { name: "Administrator Sign In" }),
    ).toBeVisible();
    await expect(page.getByTestId("admin-login-error")).toContainText(
      "Administrator authentication is required",
    );

    // Unauthenticated preview of a draft project returns 404
    const previewRes = await page.goto("/projects/geoentity?preview=true");
    expect(previewRes?.status()).toBe(404);
  });

  test("authenticates single admin, navigates CMS modules, previews draft, publishes & unpublishes GeoEntity, and captures desktop & mobile screenshots", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("mf_portfolio_boot_seen_v1", "1");
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/login");

    // 1. Reject invalid credentials
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpass");
    await page.getByTestId("admin-login-submit").click();
    await expect(page.getByTestId("admin-login-error")).toContainText(
      "Invalid administrator credentials",
    );

    // 2. Sign in with valid single-admin credentials
    await page.fill('input[name="email"]', "admin@muhamadfauzan.dev");
    await page.fill('input[name="password"]', "AdminPortfolio2026!");
    await page.getByTestId("admin-login-submit").click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId("admin-overview-page")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Portfolio Content Management System",
      }),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint4_admin_overview_desktop.png"),
      fullPage: true,
    });

    // 3. Open Projects & 14-Section Case Studies Manager
    await page.goto("/admin/projects");
    await expect(page.getByTestId("admin-projects-manager")).toBeVisible();
    await expect(
      page.getByTestId("case-study-editor-sec-overview"),
    ).toBeVisible();
    await expect(
      page.getByTestId("case-study-editor-sec-lessons"),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint4_admin_projects_desktop.png"),
      fullPage: true,
    });

    // 4. Preview unpublished draft of GeoEntity as authenticated admin
    await page.getByTestId("project-preview-draft-link").click();
    await expect(page).toHaveURL(/\/projects\/geoentity\?preview=true/);
    await page.getByTestId("boot-experience-overlay").click();
    await expect(page.getByTestId("admin-preview-banner")).toContainText(
      "ADMIN DRAFT PREVIEW MODE",
    );
    await expect(
      page.getByRole("heading", { name: "GeoEntity", level: 1 }),
    ).toBeVisible();

    // Return to Project CMS
    await page.getByRole("link", { name: "Return to Project CMS" }).click();
    await expect(page).toHaveURL(/\/admin\/projects$/);

    // 5. Publish GeoEntity, verify live on public /projects/geoentity, then unpublish back to Draft
    await page.getByTestId("project-publish-btn").click();
    await expect(page.getByTestId("admin-toast-success")).toContainText(
      'Project "GeoEntity" published',
    );

    await page.goto("/projects/geoentity");
    await page.getByTestId("boot-experience-overlay").click();
    await expect(
      page.getByRole("heading", { name: "GeoEntity", level: 1 }),
    ).toBeVisible();

    // Unpublish GeoEntity back to draft so initial seed isolation remains clean
    await page.goto("/admin/projects");
    await page.getByTestId("project-unpublish-btn").click();
    await expect(page.getByTestId("admin-toast-success")).toContainText(
      "Project unpublished back to draft",
    );

    // Confirm public /projects/geoentity returns 404 again
    const afterUnpublish = await page.goto("/projects/geoentity");
    expect(afterUnpublish?.status()).toBe(404);

    // 6. Verify Settings, Revision History & Immutable Audit Logs page
    await page.goto("/admin/settings");
    await expect(page.getByTestId("admin-settings-manager")).toBeVisible();
    await expect(page.getByTestId("revision-history-panel")).toBeVisible();
    await expect(page.getByTestId("audit-log-panel")).toContainText(
      "publish_content",
    );

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint4_admin_settings_audit_desktop.png"),
      fullPage: true,
    });

    // 7. Verify Mobile Admin Dashboard & Navigation Drawer
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");
    const mobileTrigger = page.getByTestId("admin-mobile-menu-trigger");
    await expect(mobileTrigger).toBeVisible();
    await mobileTrigger.click();
    await expect(page.getByTestId("admin-mobile-drawer")).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "sprint4_admin_mobile_drawer.png"),
      fullPage: true,
    });
  });
});
