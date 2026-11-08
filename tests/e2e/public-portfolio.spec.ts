import { test, expect } from "@playwright/test";

test.describe("Sprint 1 & 2 — Public Portfolio, Showcase, SEO & Draft Isolation", () => {
  test("displays Indonesian boot experience, allows click-to-skip anywhere, and always restarts on browser reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const overlay = page.getByTestId("boot-experience-overlay");
    await expect(overlay).toBeVisible();
    await expect(page.getByTestId("boot-origin-label")).toHaveCSS("color", "rgb(0, 0, 0)");
    await expect(page.getByTestId("boot-greeting-stage")).toContainText("Selamat Datang");

    // Dismiss boot experience via click anywhere
    await overlay.click();
    await expect(overlay).toBeHidden();
    await expect(
      page.getByRole("heading", {
        name: "Muhamad Fauzan",
      }),
    ).toBeVisible();

    // Reloading the browser must ALWAYS display the boot experience afresh
    await page.reload();
    await expect(overlay).toBeVisible();
    await expect(page.getByTestId("boot-greeting-stage")).toContainText("Selamat Datang");

    // Can dismiss via keyboard shortcut
    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden();
  });

  test("legacy multi-page routes return 404 and sitemap is strictly single-page", async ({
    page,
    request,
  }) => {
    // Direct access to all legacy routes returns 404
    const legacyRoutes = [
      "/about",
      "/projects",
      "/projects/geoentity",
      "/notes",
      "/notes/explicit-draft-to-publish-content-workflows",
      "/resume",
      "/contact",
    ];

    for (const route of legacyRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(404);
    }

    // Verify sitemap.xml strictly contains only the root URL
    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).not.toContain("/notes/");
    expect(sitemapXml).not.toContain("/projects");
    expect(sitemapXml).not.toContain("/about");
    expect(sitemapXml).not.toContain("/resume");
    expect(sitemapXml).not.toContain("/contact");

    // Verify robots.txt disallows /admin and points to sitemap.xml
    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    const robotsTxt = await robotsRes.text();
    expect(robotsTxt).toContain("Disallow: /admin");
    expect(robotsTxt).toContain("sitemap.xml");
  });

  test("Homepage JSON-LD structured data is present and valid", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("mf_portfolio_boot_seen_v1", "1");
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const jsonLdContent = await page.locator("script#portfolio-jsonld").textContent();
    expect(jsonLdContent).toBeTruthy();
    const parsedJsonLd = JSON.parse(jsonLdContent ?? "{}");
    expect(parsedJsonLd["@context"]).toBe("https://schema.org");
  });

  test("Home landing page satisfies alignment, typography hierarchy, social links, location, and fixed theme toggle", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Overlay is open on fresh load
    const overlay = page.getByTestId("boot-experience-overlay");
    await expect(overlay).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden();

    // 1. Content is horizontally centered
    const homeContent = page.getByTestId("home-landing-content");
    await expect(homeContent).toBeVisible();

    // 2. Name is large & bold
    const nameHeading = page.getByTestId("home-name");
    await expect(nameHeading).toHaveText("Muhamad Fauzan");
    await expect(nameHeading).toHaveCSS("font-weight", "700");

    // 3. Role is large & regular weight (not bold)
    const roleEl = page.getByTestId("home-role");
    await expect(roleEl).toHaveText("Software Engineer");
    await expect(roleEl).toHaveCSS("font-weight", "400");

    // 4. Social links: 3 compact buttons
    const githubLink = page.getByTestId("home-social-github");
    const linkedinLink = page.getByTestId("home-social-linkedin");
    const gmailLink = page.getByTestId("home-social-gmail");

    await expect(githubLink).toHaveAttribute("href", "https://github.com/uzaannnnnn");
    await expect(githubLink).toHaveAttribute("target", "_blank");
    await expect(linkedinLink).toHaveAttribute("href", "https://linkedin.com/in/zanhoo");
    await expect(linkedinLink).toHaveAttribute("target", "_blank");
    await expect(gmailLink).toHaveAttribute("href", "mailto:vanz66hu@gmail.com");

    // 5. Location is small and subtle
    const locationEl = page.getByTestId("home-location");
    await expect(locationEl).toContainText("Bandung, Indonesia");

    // 6. No header or navigation bar on Home
    await expect(page.getByTestId("public-horizontal-nav")).toBeHidden();
    await expect(page.getByTestId("book-page-indicator")).toBeHidden();

    // 7. Theme toggle is independently fixed in the top right (cyclic icon-only, no dropdown)
    const fixedThemeDropdown = page.getByTestId("fixed-home-theme-dropdown");
    await expect(fixedThemeDropdown).toBeVisible();
    await expect(fixedThemeDropdown).toHaveCSS("position", "fixed");

    const themeButton = page.getByTestId("theme-switcher-dropdown");
    await expect(themeButton).toHaveAttribute("data-theme-mode", "system");
    await themeButton.click();
    await expect(page.getByTestId("theme-dropdown-menu")).toBeHidden();
    await expect(themeButton).toHaveAttribute("data-theme-mode", "light");
    await themeButton.click();
    await expect(themeButton).toHaveAttribute("data-theme-mode", "dark");
    await themeButton.click();
    await expect(themeButton).toHaveAttribute("data-theme-mode", "system");
    await page.waitForTimeout(600);

    // 8. Verify 100svh full-screen presentation deck & one-gesture-one-section transitions
    const deck = page.getByTestId("home-continuous-flow");
    await expect(deck).toHaveAttribute("data-active-section", "0");

    const sectionTestIds = [
      "home-landing-content",
      "home-section-me",
      "home-section-experience",
      "home-section-showcase",
      "home-section-certifications",
      "home-section-contact",
    ];

    // Verify every section occupies strictly 100svh (800px) and has zero content overflow/clipping
    for (const testId of sectionTestIds) {
      const metrics = await page.getByTestId(testId).evaluate((el) => ({
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));
      expect(metrics.clientHeight).toBe(800);
      expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight);
    }

    // One wheel gesture burst advances strictly 1 section (0 -> 1: Me)
    await page.mouse.wheel(0, 180);
    await page.mouse.wheel(0, 180);
    await page.mouse.wheel(0, 180);
    await expect(deck).toHaveAttribute("data-active-section", "1");
    await expect(deck).toHaveAttribute("data-active-section-id", "me");

    // Wait for transition lock (650ms) and use ArrowDown to advance 1 -> 2 (Experience)
    await page.waitForTimeout(700);
    await page.keyboard.press("ArrowDown");
    await expect(deck).toHaveAttribute("data-active-section", "2");
    await expect(deck).toHaveAttribute("data-active-section-id", "experience");

    // Jump to End (5: Contact) and verify Footer and boundaries
    await page.waitForTimeout(700);
    await page.keyboard.press("End");
    await expect(deck).toHaveAttribute("data-active-section", "5");
    await expect(deck).toHaveAttribute("data-active-section-id", "contact");
    await expect(page.getByTestId("home-footer")).toBeVisible();

    // Verify draft projects do not leak into Showcase on Home
    await expect(page.getByTestId("home-section-showcase")).not.toContainText("GeoEntity");
    await expect(page.getByTestId("home-section-showcase")).not.toContainText("ClayCV");
    await expect(page.getByTestId("home-section-showcase")).not.toContainText("SPK Bansos SAW");
  });

  test("never flashes Home content before booting screen on full refresh across System, Dark, and Light themes", async ({
    page,
  }) => {
    for (const theme of ["light", "dark", "system"] as const) {
      await page.addInitScript((th) => {
        window.localStorage.setItem("portfolio_theme", th);
      }, theme);

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");

      // Frame 0 assertion: overlay must be immediately present and visible
      const overlay = page.getByTestId("boot-experience-overlay");
      await expect(overlay).toBeVisible();

      // Home content wrapper must be completely hidden
      const contentWrapper = page.getByTestId("boot-experience-content-wrapper");
      await expect(contentWrapper).toHaveClass(/invisible/);

      // Verify overlay covers the screen
      const box = await overlay.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(1280);
      expect(box?.height).toBeGreaterThanOrEqual(800);

      // Dismiss via keyboard
      await page.keyboard.press("Escape");
      await expect(overlay).toBeHidden();
      await expect(contentWrapper).not.toHaveClass(/invisible/);
      await expect(page.getByTestId("home-name")).toBeVisible();

      // Perform a hard reload — booting screen MUST immediately be visible again
      await page.reload();
      await expect(overlay).toBeVisible();
      await expect(contentWrapper).toHaveClass(/invisible/);

      // Dismiss via mouse click
      await overlay.click();
      await expect(overlay).toBeHidden();
      await expect(contentWrapper).not.toHaveClass(/invisible/);
    }
  });

  test("Vertical Dynamic Island-Style Theme & Language Controls, Left Chat-Bubble Tooltips, and Radial Reveal Transition", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const overlay = page.getByTestId("boot-experience-overlay");
    await overlay.click();
    await expect(overlay).toBeHidden();

    const island = page.getByTestId("floating-theme-language-island");
    const themeButton = page.getByTestId("theme-switcher-dropdown");
    const langButton = page.getByTestId("language-switcher-button");
    const themeTooltip = page.getByTestId("theme-toggle-tooltip");
    const themeTail = page.getByTestId("theme-tooltip-tail");
    const langTooltip = page.getByTestId("language-toggle-tooltip");
    const langTail = page.getByTestId("language-tooltip-tail");

    // 1. One vertically oriented rounded container in upper-right corner with 2 stacked circular controls
    await expect(island).toBeVisible();
    await expect(themeButton).toBeVisible();
    await expect(langButton).toBeVisible();
    await expect(themeButton).toHaveText("");
    await expect(langButton).toHaveText("🇬🇧");

    const islandBox = await island.boundingBox();
    const btnBox = await themeButton.boundingBox();
    const langBtnBox = await langButton.boundingBox();
    expect(islandBox).not.toBeNull();
    expect(btnBox).not.toBeNull();
    expect(langBtnBox).not.toBeNull();
    // Vertical orientation: height > width, and top theme button sits strictly above bottom language button
    expect(islandBox!.height).toBeGreaterThan(islandBox!.width);
    expect(btnBox!.y + btnBox!.height).toBeLessThanOrEqual(langBtnBox!.y);
    expect(Math.round(btnBox!.width)).toBe(Math.round(btnBox!.height));
    expect(Math.round(langBtnBox!.width)).toBe(Math.round(langBtnBox!.height));
    expect(btnBox!.x).toBeGreaterThan(1150);
    expect(btnBox!.y).toBeLessThan(80);

    // 2. Top button hover tooltip appears on the LEFT with right-pointing tail
    await themeButton.hover();
    await expect(themeTooltip).toHaveAttribute("data-visible", "true");
    await expect(langTooltip).toHaveAttribute("data-visible", "false");
    await expect(themeTooltip).toHaveText("System Mode");
    const tooltipBox = await themeTooltip.boundingBox();
    const tailBox = await themeTail.boundingBox();
    expect(tooltipBox).not.toBeNull();
    expect(tailBox).not.toBeNull();
    expect(tooltipBox!.x).toBeGreaterThan(0);
    expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(islandBox!.x);
    expect(tailBox!.x).toBeGreaterThanOrEqual(tooltipBox!.x + tooltipBox!.width - 2);
    expect(tailBox!.x).toBeLessThanOrEqual(btnBox!.x);

    // 3. Bottom button hover tooltip appears on the LEFT with right-pointing tail
    await langButton.hover();
    await expect(langTooltip).toHaveAttribute("data-visible", "true");
    await expect(themeTooltip).toHaveAttribute("data-visible", "false");
    await expect(langTooltip).toHaveText("English");
    const langTooltipBox = await langTooltip.boundingBox();
    const langTailBox = await langTail.boundingBox();
    expect(langTooltipBox).not.toBeNull();
    expect(langTailBox).not.toBeNull();
    expect(langTooltipBox!.x).toBeGreaterThan(0);
    expect(langTooltipBox!.x + langTooltipBox!.width).toBeLessThanOrEqual(islandBox!.x);
    expect(langTailBox!.x).toBeGreaterThanOrEqual(
      langTooltipBox!.x + langTooltipBox!.width - 2,
    );

    // Move mouse away -> tooltips hide
    await page.mouse.move(200, 200);
    await expect(themeTooltip).toHaveAttribute("data-visible", "false");
    await expect(langTooltip).toHaveAttribute("data-visible", "false");

    // 4. Language toggle switches English (🇬🇧) <-> Bahasa Indonesia (🇮🇩) independently without affecting theme
    await langButton.click();
    await expect(langButton).toHaveAttribute("data-language", "id");
    await expect(langButton).toHaveText("🇮🇩");
    await expect(langTooltip).toHaveText("Bahasa Indonesia");
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(themeButton).toHaveAttribute("data-theme-mode", "system");

    // 5. Theme Click 1: System (OS Light) -> Light (effective theme stays light -> no unnecessary radial transition)
    await themeButton.click();
    await expect(page.getByTestId("theme-dropdown-menu")).toBeHidden();
    await expect(themeButton).toHaveAttribute("data-theme-mode", "light");
    await expect(page.getByTestId("theme-toggle-icon-light")).toBeVisible();
    await expect(themeTooltip).toHaveText("Light Mode");
    const rippleAfterNoOp = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--theme-ripple-r"),
    );
    expect(rippleAfterNoOp).toBe("");

    // 6. Theme Click 2: Light -> Dark (radial transition originates from the UPPER theme button center)
    await themeButton.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(themeButton).toHaveAttribute("data-theme-mode", "dark");
    await expect(page.getByTestId("theme-toggle-icon-dark")).toBeVisible();
    await expect(themeTooltip).toHaveText("Dark Mode");

    const rippleVars = await page.evaluate(() => ({
      x: parseFloat(document.documentElement.style.getPropertyValue("--theme-ripple-x")),
      y: parseFloat(document.documentElement.style.getPropertyValue("--theme-ripple-y")),
      r: parseFloat(document.documentElement.style.getPropertyValue("--theme-ripple-r")),
    }));
    const expectedThemeCenterX = btnBox!.x + btnBox!.width / 2;
    const expectedThemeCenterY = btnBox!.y + btnBox!.height / 2;
    expect(Math.abs(rippleVars.x - expectedThemeCenterX)).toBeLessThanOrEqual(2);
    expect(Math.abs(rippleVars.y - expectedThemeCenterY)).toBeLessThanOrEqual(2);
    expect(rippleVars.r).toBeGreaterThan(1400);

    await page.waitForTimeout(600);

    // 7. Theme Click 3: Dark -> System when OS prefers Light (radial transition back to light)
    await themeButton.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(themeButton).toHaveAttribute("data-theme-mode", "system");
    await page.waitForTimeout(600);

    // 8. OS theme changes while System mode is active (Light -> Dark)
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.waitForTimeout(600);

    // 9. Mobile viewport verification (390x844) + persistence of both theme and language across reload
    await page.setViewportSize({ width: 390, height: 844 });
    await themeButton.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(themeButton).toHaveAttribute("data-theme-mode", "light");
    await expect(langButton).toHaveAttribute("data-language", "id");
    await page.waitForTimeout(600);

    await page.reload();
    await overlay.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(themeButton).toHaveAttribute("data-theme-mode", "light");
    await expect(langButton).toHaveAttribute("data-language", "id");
    await expect(langButton).toHaveText("🇮🇩");
  });

  test("Scroll Gesture State Machine: 10x repetitions each for mouse wheel, trackpad, long trackpad momentum, touch swipe, ArrowDown/Up, consecutive gestures, and direction reversal with zero double-jumps", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const overlay = page.getByTestId("boot-experience-overlay");
    await overlay.click();
    await expect(overlay).toBeHidden();

    const deck = page.getByTestId("home-continuous-flow");
    await expect(deck).toHaveAttribute("data-active-section", "0");

    // Part A: Full 650ms animation lock + 950ms real-time decaying trackpad momentum verification
    // Dispatch a 950ms continuous trackpad momentum burst in the browser and verify NO second jump occurs after ~500-650ms
    await page.evaluate(async () => {
      const start = performance.now();
      while (performance.now() - start < 950) {
        const elapsed = performance.now() - start;
        const deltaY = Math.max(3, Math.round(65 * Math.exp(-elapsed / 380)));
        window.dispatchEvent(
          new WheelEvent("wheel", { deltaY, deltaX: 0, bubbles: true, cancelable: true }),
        );
        await new Promise((r) => setTimeout(r, 16));
      }
    });
    // Must remain strictly at Section 1, NEVER jumping to Section 2
    await expect(deck).toHaveAttribute("data-active-section", "1");
    await page.waitForTimeout(200);

    // Return to Section 0
    await page.keyboard.press("Home");
    await expect(deck).toHaveAttribute("data-active-section", "0");
    await page.waitForTimeout(80);

    // Part B: 10 repetitions of all 8 input scenarios (plus 10x in-stream trackpad re-acceleration)
    // with full CSS animations active (reducedMotion: "no-preference") and latency measurement
    const results = await page.evaluate(async () => {
      const deckEl = document.querySelector('[data-testid="home-continuous-flow"]')!;
      const getActive = () => Number(deckEl.getAttribute("data-active-section"));
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const resetTo = async (target: number) => {
        if (getActive() !== target) {
          window.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: target === 0 ? "Home" : "End",
              bubbles: true,
              cancelable: true,
            }),
          );
          await sleep(16);
        }
        // Wait 65ms so any prior wheel gesture stream is cleanly separated
        await sleep(65);
        if (getActive() !== target) {
          throw new Error(`resetTo(${target}) failed, stuck on ${getActive()}`);
        }
      };

      const counts = {
        mouseWheel: 0,
        trackpadShort: 0,
        trackpadMomentum: 0,
        mobileSwipe: 0,
        arrowDown: 0,
        arrowUp: 0,
        consecutiveGestures: 0,
        consecutiveReaccel: 0,
        directionReversal: 0,
      };
      const consecutiveActionLatenciesMs: number[] = [];

      // 1. 10x single mouse wheel gesture (0 -> 1 only)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(0);
        window.dispatchEvent(
          new WheelEvent("wheel", { deltaY: 100, deltaMode: 0, bubbles: true, cancelable: true }),
        );
        await sleep(20);
        if (getActive() !== 1) throw new Error(`Mouse wheel rep ${rep} landed on ${getActive()}`);
        counts.mouseWheel++;
      }

      // 2. 10x short trackpad gesture burst (0 -> 1 only)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(0);
        for (const dy of [8, 18, 28, 20, 10]) {
          window.dispatchEvent(
            new WheelEvent("wheel", { deltaY: dy, bubbles: true, cancelable: true }),
          );
        }
        await sleep(20);
        if (getActive() !== 1) throw new Error(`Trackpad short rep ${rep} landed on ${getActive()}`);
        counts.trackpadShort++;
      }

      // 3. 10x long trackpad gesture with momentum (0 -> 1 only, never 2)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(0);
        for (let t = 0; t <= 220; t += 20) {
          const dy = Math.max(4, Math.round(60 * Math.exp(-t / 120)));
          window.dispatchEvent(
            new WheelEvent("wheel", { deltaY: dy, bubbles: true, cancelable: true }),
          );
          await sleep(20);
        }
        await sleep(20);
        if (getActive() !== 1) {
          throw new Error(`Trackpad momentum rep ${rep} double-jumped to ${getActive()}`);
        }
        counts.trackpadMomentum++;
      }

      // 4. 10x mobile touch swipe + rapid consecutive swipe (0 -> 1 -> 2 without waiting)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(0);
        const swipeUp = (id: number) => {
          const startTouch = new Touch({
            identifier: id,
            target: deckEl,
            clientX: 200,
            clientY: 500,
          });
          const endTouch = new Touch({
            identifier: id,
            target: deckEl,
            clientX: 200,
            clientY: 320,
          });
          deckEl.dispatchEvent(
            new TouchEvent("touchstart", {
              touches: [startTouch],
              changedTouches: [startTouch],
              bubbles: true,
              cancelable: true,
            }),
          );
          deckEl.dispatchEvent(
            new TouchEvent("touchend", {
              touches: [],
              changedTouches: [endTouch],
              bubbles: true,
              cancelable: true,
            }),
          );
        };
        swipeUp(rep * 2);
        await sleep(16);
        if (getActive() !== 1) throw new Error(`Mobile swipe 1 rep ${rep} landed on ${getActive()}`);
        swipeUp(rep * 2 + 1);
        await sleep(16);
        if (getActive() !== 2) throw new Error(`Mobile swipe 2 rep ${rep} landed on ${getActive()}`);
        counts.mobileSwipe++;
      }

      // 5. 10x ArrowDown key press (with key repeat events suppressed)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(0);
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowDown",
            repeat: false,
            bubbles: true,
            cancelable: true,
          }),
        );
        await sleep(16);
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowDown",
            repeat: true,
            bubbles: true,
            cancelable: true,
          }),
        );
        await sleep(16);
        if (getActive() !== 1) throw new Error(`ArrowDown rep ${rep} landed on ${getActive()}`);
        counts.arrowDown++;
      }

      // 6. 10x ArrowUp key press from last section (5 -> 4 only)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(5);
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowUp",
            repeat: false,
            bubbles: true,
            cancelable: true,
          }),
        );
        await sleep(16);
        if (getActive() !== 4) throw new Error(`ArrowUp rep ${rep} landed on ${getActive()}`);
        counts.arrowUp++;
      }

      // 7a. 10x rapid consecutive intentional wheel gestures (0 -> 1 -> 2 -> 3 at 68ms intervals, during active 550ms animation!)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(0);
        for (let step = 1; step <= 3; step++) {
          const t0 = performance.now();
          window.dispatchEvent(
            new WheelEvent("wheel", { deltaY: 60, bubbles: true, cancelable: true }),
          );
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          const latency = performance.now() - t0;
          consecutiveActionLatenciesMs.push(latency);
          if (getActive() !== step) {
            throw new Error(`Consecutive step ${step} rep ${rep} landed on ${getActive()}`);
          }
          if (step < 3) {
            await sleep(68);
          }
        }
        counts.consecutiveGestures++;
      }

      // 7b. 10x rapid trackpad flicks interrupting ongoing momentum via re-acceleration (no silence gap!)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(0);
        // Flick 1: peaks at 55 and decays to 28 -> 16 over 96ms
        for (const dy of [25, 55, 40, 28, 16]) {
          window.dispatchEvent(
            new WheelEvent("wheel", { deltaY: dy, bubbles: true, cancelable: true }),
          );
          await sleep(24);
        }
        if (getActive() !== 1) {
          throw new Error(`Reaccel flick 1 rep ${rep} landed on ${getActive()}`);
        }
        // Flick 2 (while momentum is still firing at 24ms intervals!): user pushes again spiking deltaY from 16 -> 38
        window.dispatchEvent(
          new WheelEvent("wheel", { deltaY: 38, bubbles: true, cancelable: true }),
        );
        await sleep(16);
        if (getActive() !== 2) {
          throw new Error(`Reaccel flick 2 rep ${rep} landed on ${getActive()}`);
        }
        counts.consecutiveReaccel++;
      }

      // 8. 10x immediate direction reversal mid-animation (0 -> 1 -> 0 with only 16ms between down and up!)
      for (let rep = 0; rep < 10; rep++) {
        await resetTo(0);
        window.dispatchEvent(
          new WheelEvent("wheel", { deltaY: 60, bubbles: true, cancelable: true }),
        );
        await sleep(16);
        if (getActive() !== 1) throw new Error(`Reversal down rep ${rep} landed on ${getActive()}`);
        window.dispatchEvent(
          new WheelEvent("wheel", { deltaY: -60, bubbles: true, cancelable: true }),
        );
        await sleep(16);
        if (getActive() !== 0) throw new Error(`Reversal up rep ${rep} landed on ${getActive()}`);
        counts.directionReversal++;
      }

      const avgLatencyMs =
        consecutiveActionLatenciesMs.reduce((a, b) => a + b, 0) /
        consecutiveActionLatenciesMs.length;
      const maxLatencyMs = Math.max(...consecutiveActionLatenciesMs);

      return { counts, avgLatencyMs, maxLatencyMs };
    });

    expect(results.counts).toEqual({
      mouseWheel: 10,
      trackpadShort: 10,
      trackpadMomentum: 10,
      mobileSwipe: 10,
      arrowDown: 10,
      arrowUp: 10,
      consecutiveGestures: 10,
      consecutiveReaccel: 10,
      directionReversal: 10,
    });
    // Consecutive intentional gestures must respond within 1 animation frame (< 32ms, zero artificial cooldown)
    expect(results.avgLatencyMs).toBeLessThan(32);
  });
});
