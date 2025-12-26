/** @format */

const { test, expect } = require("@playwright/test");
require("dotenv").config();

// =============================================================================
// 1. HELPER: The "Swiss Army Knife" for Stability
// =============================================================================
async function performSafeScroll(page) {
	// A. STEALTH
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "webdriver", { get: () => undefined });
	});

	// B. FONTS
	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	// C. CSS INJECTION (Visual Fixes)
	await page.addStyleTag({
		content: `
      /* Force Hide Overlays */
      #moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper { display: none !important; }
      
      /* Unlock Body Scroll */
      body.gdpr-infobar-visible { overflow: visible !important; height: auto !important; }

      /* Force Content Visibility */
      .elementor-invisible, .elementor-widget-container, iframe {
        opacity: 1 !important;
        visibility: visible !important;
        animation: none !important;
      }

      /* Fix 3rd Party Widgets */
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

	// D. SCROLL
	await page.evaluate(async () => {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		const totalHeight = document.body.scrollHeight;
		for (let i = 0; i < totalHeight; i += 200) {
			window.scrollTo(0, i);
			await delay(100);
		}
		window.scrollTo(0, 0);
	});

	// E. BUFFER
	console.log("⏳ Waiting 10s for dashboard widgets...");
	await page.waitForTimeout(10000);
}

// =============================================================================
// 2. CONFIGURATION
// =============================================================================
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
	// ===========================================================================
	// 3. SETUP: Authentication (Network Block Strategy)
	// ===========================================================================
	test.beforeAll(async ({ browser }) => {
		console.log("🔑 Setting up authentication...");

		const context = await browser.newContext({
			storageState: undefined,
			viewport: { width: 1920, height: 1080 },
		});

		const page = await context.newPage();

		// 🚀 STEP 1: NETWORK BLOCK (The Ultimate Fix)
		// We block the GDPR plugin script from loading entirely.
		// No Script = No Bar = No Locked Screen.
		await page.route("**/*moove-gdpr*", (route) => route.abort());

		// Stealth
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", { get: () => undefined });
		});

		await page.goto("/my-courses/");

		// 🚀 STEP 2: Backup Cleanup
		// Just in case the class is added server-side, we strip it.
		await page.evaluate(() =>
			document.body.classList.remove("gdpr-infobar-visible")
		);

		// 🚀 STEP 3: "Human" Typing (Reliable)
		await page.getByLabel("Email Address", { exact: false }).click();
		await page
			.getByLabel("Email Address", { exact: false })
			.pressSequentially(process.env.TEST_EMAIL, { delay: 100 });

		await page.getByLabel("Password", { exact: false }).click();
		await page
			.getByLabel("Password", { exact: false })
			.pressSequentially(process.env.TEST_PASSWORD, { delay: 100 });

		// 🚀 STEP 4: Force Click
		// We use { force: true } to tell Playwright "I don't care if something is covering this, click it anyway."
		console.log("🖱️ Clicking Login...");
		await page
			.getByRole("button", { name: "Login", exact: false })
			.click({ force: true });

		// Verification
		console.log("⏳ Waiting for login...");
		await expect(page.locator("body")).toHaveClass(/logged-in/, {
			timeout: 45000,
		});

		// Save State
		await context.storageState({ path: "storageState.json" });
		console.log("✅ Authentication state saved");

		await context.close();
	});

	// ===========================================================================
	// 4. TEST LOOP
	// ===========================================================================
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
