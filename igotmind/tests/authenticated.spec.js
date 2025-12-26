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

	// C. CSS INJECTION
	await page.addStyleTag({
		content: `
      #moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper, .moove-gdpr-info-bar-hidden { 
        display: none !important; 
        pointer-events: none !important; 
        opacity: 0 !important;
        visibility: hidden !important;
        z-index: -9999 !important;
      }
      body.gdpr-infobar-visible { 
        overflow: visible !important; 
        position: static !important;
        padding-bottom: 0 !important; 
        height: auto !important;
        touch-action: auto !important;
      }
      .elementor-invisible, .elementor-widget-container, iframe {
        opacity: 1 !important;
        visibility: visible !important;
        animation: none !important;
      }
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
	// 3. SETUP: Authentication (The Fix is Here)
	// ===========================================================================
	test.beforeAll(async ({ browser }) => {
		console.log("🔑 Setting up authentication...");

		const context = await browser.newContext({
			storageState: undefined,
			viewport: { width: 1920, height: 1080 },
		});

		const page = await context.newPage();

		// Stealth
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", { get: () => undefined });
		});

		await page.goto("/my-courses/");

		// 🚀 STEP 1: Wait for Network Idle
		await page.waitForLoadState("networkidle");

		// 🚀 STEP 2: Constant Body Cleaning (Keep the bar away)
		const intervalId = setInterval(async () => {
			try {
				await page.evaluate(() =>
					document.body.classList.remove("gdpr-infobar-visible")
				);
			} catch (e) {}
		}, 500);

		// 🚀 STEP 3: "Slow Human" Typing
		// We wait slightly after typing to let the form validation scripts turn "green"
		await page.getByLabel("Email Address", { exact: false }).click();
		await page
			.getByLabel("Email Address", { exact: false })
			.pressSequentially(process.env.TEST_EMAIL, { delay: 100 });
		await page.waitForTimeout(500); // Wait for validation

		await page.getByLabel("Password", { exact: false }).click();
		await page
			.getByLabel("Password", { exact: false })
			.pressSequentially(process.env.TEST_PASSWORD, { delay: 100 });
		await page.waitForTimeout(500); // Wait for validation

		// 🚀 STEP 4: Standard Click with Stability Check
		console.log("🖱️ Clicking Login...");
		const loginBtn = page
			.locator('input[type="submit"], button[type="submit"]')
			.first();

		// Ensure button is ready to receive clicks
		await loginBtn.waitFor({ state: "visible", timeout: 5000 });

		// Standard click (triggers all site scripts)
		await loginBtn.click();

		// Verify Login Success
		console.log("⏳ Waiting for login redirect...");

		// We add a check for Error Messages to debug if it fails again
		try {
			await expect(page.locator("body")).toHaveClass(/logged-in/, {
				timeout: 45000,
			});
		} catch (error) {
			// If login fails, check if there is a visible error message on screen
			const errorMsg = await page
				.locator(".lifterlms-error, .error, .alert")
				.textContent()
				.catch(() => "No error text found");
			console.log("⚠️ Login Failed. Screen says: ", errorMsg);
			throw error; // Re-throw to fail the test properly
		}

		clearInterval(intervalId);

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
