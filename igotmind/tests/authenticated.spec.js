/** @format */

const { test, expect } = require("@playwright/test");
require("dotenv").config();

// 1. HELPER: Safe Scroll + Fonts + Layout Fix
async function performSafeScroll(page) {
	// A. STEALTH: Remove "Robot" flags
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "webdriver", { get: () => undefined });
	});

	// B. FONTS: Wait for them to load
	console.log("🎨 Waiting for custom fonts...");
	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	// C. LAYOUT: Force Widgets to be visible
	await page.addStyleTag({
		content: `
      /* Kill Cookie Bar Visually */
      #moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper { 
        display: none !important; 
        pointer-events: none !important; 
        opacity: 0 !important;
      }
      
      /* Force body to behave even if class exists */
      body.gdpr-infobar-visible { 
        overflow: visible !important; 
        padding-bottom: 0 !important; 
      }

      /* Force Elementor & Iframes */
      .elementor-invisible, .elementor-widget-container, iframe {
        opacity: 1 !important;
        visibility: visible !important;
        animation: none !important;
      }

      /* Fix 3rd Party Widgets (PayPal/Calendly) */
      .calendly-spinner { display: none !important; }
      div[class*="styles-module_campaigns_widget"],
      div[class*="campaigns_widget"],
      .calendly-inline-widget, 
      iframe[src*="calendly"] {
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        min-height: 500px !important;
      }
    `,
	});

	// D. VIDEOS: Eager load
	await page.evaluate(() => {
		document.querySelectorAll("iframe").forEach((frame) => {
			frame.loading = "eager";
			frame.style.opacity = "1";
		});
	});

	// E. SCROLL
	await page.evaluate(async () => {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		const totalHeight = document.body.scrollHeight;
		for (let i = 0; i < totalHeight; i += 200) {
			window.scrollTo(0, i);
			await delay(100);
		}
		window.scrollTo(0, 0);
	});

	// F. BUFFER
	console.log("⏳ Waiting 10s for dashboard widgets...");
	await page.waitForTimeout(10000);
}

// 2. PAGES TO TEST
const internalPages = [
	{ name: "Auth_01_Courses_List", path: "/my-courses/my-courses/" },
	{ name: "Auth_02_Grades", path: "/my-courses/my-grades/" },
	{ name: "Auth_03_Memberships", path: "/my-courses/my-memberships/" },
	{ name: "Auth_04_Private_Area", path: "/my-courses/my-private-area/" },
	{ name: "Auth_05_Achievements", path: "/my-courses/my-achievements/" },
	{ name: "Auth_06_Certificates", path: "/my-courses/my-certificates/" },
	{ name: "Auth_07_Notes", path: "/my-courses/my-notes/" },
	{ name: "Auth_08_Notifications", path: "/my-courses/notifications/" },
	{ name: "Auth_09_Edit_Account", path: "/my-courses/edit-account/" },
	{ name: "Auth_10_Redeem_Voucher", path: "/my-courses/redeem-voucher/" },
	{ name: "Auth_11_Orders", path: "/my-courses/orders/" },
];

test.describe("I Got Mind - Student Dashboard", () => {
	// 3. SETUP: Runs FIRST.
	test.beforeAll(async ({ browser }) => {
		console.log("🔑 Setting up authentication...");

		// Create new context (Start Fresh)
		const context = await browser.newContext({
			storageState: undefined,
			viewport: { width: 1920, height: 1080 },
		});

		const page = await context.newPage();

		// Stealth Injection
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", { get: () => undefined });
		});

		await page.goto("/my-courses/");

		// 🚀 STEP 1: Attempt to Accept Cookies (Cleanest way)
		try {
			const acceptBtn = page.locator("#moove_gdpr_save_popup_settings_button");
			if (await acceptBtn.isVisible({ timeout: 2000 })) {
				await acceptBtn.click({ force: true });
			}
		} catch (e) {}

		// 🚀 STEP 2: CSS Override (Just in case)
		await page.addStyleTag({
			content: `
        #moove_gdpr_cookie_info_bar { pointer-events: none !important; display: none !important; }
        body.gdpr-infobar-visible { padding-bottom: 0 !important; }
      `,
		});

		// Fill Credentials
		await page
			.getByLabel("Email Address", { exact: false })
			.fill(process.env.TEST_EMAIL);
		await page
			.getByLabel("Password", { exact: false })
			.fill(process.env.TEST_PASSWORD);

		// 🚀 STEP 3: THE "GOD MODE" CLICK
		// Instead of clicking with the mouse (which gets blocked), we execute JS to trigger the button directly.
		// This bypasses ALL overlays, popups, and layout shifts.
		await page.$eval(
			'input[type="submit"], button[type="submit"]',
			(button) => {
				button.click();
			}
		);

		// Verify Login Success
		await expect(page.locator("body")).toHaveClass(/logged-in/, {
			timeout: 45000,
		});

		// Save state
		await context.storageState({ path: "storageState.json" });
		console.log("✅ Authentication state saved");

		await context.close();
	});

	// 4. NESTED GROUP
	test.describe("Authenticated Visual Checks", () => {
		test.use({ storageState: "storageState.json" });

		for (const internalPage of internalPages) {
			test(`Visual: ${internalPage.name}`, async ({ page }) => {
				console.log(`➡️ Testing: ${internalPage.name}`);
				await page.goto(internalPage.path);

				await page.waitForLoadState("domcontentloaded");

				await performSafeScroll(page);

				await expect(page).toHaveScreenshot(`${internalPage.name}.png`, {
					fullPage: true,
				});
			});
		}
	});
});
