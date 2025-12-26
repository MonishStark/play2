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
	console.log("🎨 Waiting for custom fonts...");
	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	// C. CSS INJECTION (Visual Fixes Only)
	await page.addStyleTag({
		content: `
      /* 1. HIDE Cookie Bar & Overlays */
      #moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper, .moove-gdpr-info-bar-hidden { 
        display: none !important; 
        pointer-events: none !important; 
        visibility: hidden !important;
      }
      
      /* 2. UNLOCK Body Scroll */
      body.gdpr-infobar-visible { 
        overflow: visible !important; 
        padding-bottom: 0 !important; 
        height: auto !important;
      }

      /* 3. Force Widgets Visible */
      .elementor-invisible, .elementor-widget-container, iframe {
        opacity: 1 !important;
        visibility: visible !important;
        animation: none !important;
      }

      /* 4. Fix External Widgets */
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

	// D. VIDEOS
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
	// 3. SETUP: Authentication (Reverted to Old "Human" Logic)
	// ===========================================================================
	test.beforeAll(async ({ browser }) => {
		console.log("🔑 Setting up authentication...");

		const context = await browser.newContext({
			storageState: undefined,
			viewport: { width: 1920, height: 1080 },
		});

		const page = await context.newPage();

		// Stealth Mode
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", { get: () => undefined });
		});

		// 🚀 STEP 1: Pre-Inject CSS (Kill Cookie Bar Instantly)
		await page.addInitScript(() => {
			const style = document.createElement("style");
			style.innerHTML = `
            #moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper { display: none !important; pointer-events: none !important; }
            body.gdpr-infobar-visible { overflow: visible !important; position: static !important; }
        `;
			document.head.appendChild(style);
		});

		await page.goto("/my-courses/");

		// Wait for the form to settle
		await page.waitForLoadState("domcontentloaded");

		// 🚀 STEP 2: Use "Human" Typing (From your Old Code)
		// Using `pressSequentially` triggers the validation scripts that `fill` might miss.
		await page.getByLabel("Email Address", { exact: false }).click();
		await page
			.getByLabel("Email Address", { exact: false })
			.pressSequentially(process.env.TEST_EMAIL, { delay: 100 });

		await page.getByLabel("Password", { exact: false }).click();
		await page
			.getByLabel("Password", { exact: false })
			.pressSequentially(process.env.TEST_PASSWORD, { delay: 100 });

		// 🚀 STEP 3: Click the Button using YOUR Old Selector
		// We switched back to `getByRole` because `input[type=submit]` was likely clicking the wrong thing.
		console.log("🖱️ Clicking Login...");

		// We use Promise.all to explicitly wait for the navigation event
		// This prevents the "waiting for login redirect" step from starting too early
		await Promise.all([
			page
				.waitForNavigation({ timeout: 60000 })
				.catch(() => console.log("⚠️ Navigation timeout (might be AJAX)")),
			page.getByRole("button", { name: "Login", exact: false }).click(),
		]);

		// 🚀 STEP 4: Verification
		console.log("⏳ Verifying Login...");

		// If this fails, we take a screenshot to see exactly WHAT is on screen (Error msg? Still on login?)
		try {
			await expect(page.locator("body")).toHaveClass(/logged-in/, {
				timeout: 30000,
			});
		} catch (e) {
			console.log("❌ Login Verification Failed. Taking debug screenshot...");
			await page.screenshot({
				path: "login-failure-debug.png",
				fullPage: true,
			});
			throw e; // Fail the test
		}

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
