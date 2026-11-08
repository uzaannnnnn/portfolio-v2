import { test, expect } from "@playwright/test";

test.describe("Sprint 5 — Security Headers, Accessibility, and Production Routing", () => {
  test("returns strict production HTTP security headers on all responses", async ({
    request,
  }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);

    const headers = res.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["strict-transport-security"]).toContain("max-age=63072000");
  });

  test("provides accessible skip-to-content link and keyboard focusability", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("mf_portfolio_boot_seen_v1", "1");
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.getByTestId("boot-experience-overlay").click();
    await expect(page.getByTestId("boot-experience-overlay")).toBeHidden();

    // Tab into skip link
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveAttribute("href", "#main-content");

    // Press Enter on skip link and verify focus lands on main content
    await page.keyboard.press("Enter");
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeVisible();
  });

  test("renders accessible 404 page for unknown routes without revealing stack traces", async ({
    page,
  }) => {
    const res = await page.goto("/non-existent-secret-page");
    expect(res?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page not found or unpublished" }),
    ).toBeVisible();
    await expect(page.getByText("404 / Resource Not Found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Homepage" })).toBeVisible();
  });
});
