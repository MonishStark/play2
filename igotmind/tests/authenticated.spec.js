/** @format */

const { test, expect } = require("@playwright/test");
require("dotenv").config();

// =============================================================================
// 1. HELPER: The "Swiss Army Knife" for Stability
//    - Hides Cookie Bars
//    - Wakes up Calendly/PayPal
//    - Smooth Scrolls to load images
// =============================================================================
async function performSafeScroll(page) {
	// A. STEALTH: Remove "Robot" flags so security plugins don't block us
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "webdriver", { get: () => undefined });
	});

	// B. FONTS: Wait for custom fonts to prevent layout shifts
	console.log("🎨 Waiting for custom fonts...");
	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	// C. CSS INJECTION: The visual fixes
	await page.addStyleTag({
		content: `
      /* 1. Kill Cookie Bar (Visual Backup) */
      #moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper, .moove-gdpr-info-bar-hidden { 
        display: none !important; 
        pointer-events: none !important; 
        opacity: 0 !important;
      }
      
      /* 2. Fix Body Lock: prevent site from freezing scroll */
      body.gdpr-infobar-visible { 
        overflow: visible !important; 
        padding-bottom: 0 !important; 
      }

      /* 3. Force Elementor & Iframes to be visible */
      .elementor-invisible, .elementor-widget-container, iframe {
        opacity: 1 !important;
        visibility: visible !important;
        animation: none !important;
      }

      /* 4. Force 3rd Party Widgets (PayPal/Calendly) to open */
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

	// D. VIDEOS: Force them to load immediately
	await page.evaluate(() => {
		document.querySelectorAll("iframe").forEach((frame) => {
			frame.loading = "eager";
			frame.style.opacity = "1";
		});
	});

	// E. SCROLL: Smooth scroll to bottom and back to trigger lazy loading
	await page.evaluate(async () => {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		const totalHeight = document.body.scrollHeight;
		for (let i = 0; i < totalHeight; i += 200) {
			window.scrollTo(0, i);
			await delay(100);
		}
		window.scrollTo(0, 0);
	});

	// F. BUFFER: Give external widgets 10s to finish rendering
	console.log("⏳ Waiting 10s for dashboard widgets...");
	await page.waitForTimeout(10000);
}

// =============================================================================
// 2. CONFIGURATION: Pages to Audit
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
	// 3. SETUP: One-Time Login (The "Robot Army" Commander)
	// ===========================================================================
	test.beforeAll(async ({ browser }) => {
		console.log("🔑 Setting up authentication...");

		// Create new context without looking for a saved state (Fresh Start)
		const context = await browser.newContext({
			storageState: undefined,
			viewport: { width: 1920, height: 1080 },
		});

		const page = await context.newPage();

		// Stealth: Hide automation flags
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", { get: () => undefined });
		});

		await page.goto("/my-courses/");

		// 🚀 STEP 1: Wait for Network Idle
		// Ensure the site has fully loaded its scripts so we don't delete the cookie bar too early
		await page.waitForLoadState("networkidle");

		// 🚀 STEP 2: Try to Click "Accept" (The Polite Way)
		// This clears the internal blocking logic
		try {
			const acceptBtn = page.locator("#moove_gdpr_save_popup_settings_button");
			if (await acceptBtn.isVisible({ timeout: 2000 })) {
				await acceptBtn.click({ force: true });
				console.log("✅ Cookie Bar Accepted");
				await page.waitForTimeout(1000);
			}
		} catch (e) {
			console.log("ℹ️ Cookie bar skipped (not found or already accepted)");
		}

		// 🚀 STEP 3: Nuclear Cleanup (The Brute Force Way)
		// Physically delete the cookie bar HTML so it can't reappear and block us
		await page.evaluate(() => {
			document.body.classList.remove("gdpr-infobar-visible");
			const elements = document.querySelectorAll(
				"#moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper"
			);
			elements.forEach((el) => el.remove());
		});

		// Fill Credentials
		await page
			.getByLabel("Email Address", { exact: false })
			.fill(process.env.TEST_EMAIL);
		await page
			.getByLabel("Password", { exact: false })
			.fill(process.env.TEST_PASSWORD);

		// 🚀 STEP 4: The "Ghost Click" Login
		// Instead of clicking with the mouse (which hits overlays), we fire the click event directly in JS.
		// This bypasses 100% of "Click Intercepted" errors on iPhone/Safari.
		await page.$eval(
			'input[type="submit"], button[type="submit"]',
			(button) => {
				button.click();
			}
		);

		// Verify Login Success (Wait up to 45s for slow redirects)
		console.log("⏳ Waiting for login redirect...");
		await expect(page.locator("body")).toHaveClass(/logged-in/, {
			timeout: 45000,
		});

		// Save the "Logged In" state to a file
		await context.storageState({ path: "storageState.json" });
		console.log("✅ Authentication state saved");

		await context.close();
	});

	// ===========================================================================
	// 4. TEST LOOP: The "Robot Army" (Uses the saved state)
	// ===========================================================================
	test.describe("Authenticated Visual Checks", () => {
		// Load the cookies we just saved
		test.use({ storageState: "storageState.json" });

		for (const internalPage of internalPages) {
			test(`Visual: ${internalPage.name}`, async ({ page }) => {
				console.log(`➡️ Testing: ${internalPage.name}`);

				await page.goto(internalPage.path);

				// Wait for basic structure
				await page.waitForLoadState("domcontentloaded");

				// Run the helper to fix layouts and load widgets
				await performSafeScroll(page);

				// Take the snapshot
				await expect(page).toHaveScreenshot(`${internalPage.name}.png`, {
					fullPage: true,
				});
			});
		}
	});
});
