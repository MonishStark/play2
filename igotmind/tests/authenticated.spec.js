/** @format */

const { test, expect } = require("@playwright/test");
require("dotenv").config();

const CREDENTIALS = {
	email: process.env.TEST_EMAIL,
	password: process.env.TEST_PASSWORD,
};

// =============================================================================
// 1. HELPER: The "Swiss Army Knife" for Stability (Updated from our recent wins)
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

	// C. CSS INJECTION (Your reliable old code + Widget Fixes)
	await page.addStyleTag({
		content: `
      /* Your Original Fixes */
      #moove_gdpr_cookie_info_bar { display: none !important; } 
      .slick-track { visibility: hidden !important; }
      .clock-animation { visibility: hidden !important; }
      *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
      }

      /* Widget Fixes (Calendly/PayPal) */
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
      
      /* Force body unlock for mobile */
      body.gdpr-infobar-visible { overflow: visible !important; height: auto !important; }
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
	console.log("⏳ Waiting 5s for widgets...");
	await page.waitForTimeout(5000);
}

// =============================================================================
// 2. PAGES TO AUDIT
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

test.describe("I Got Mind - Student Dashboard (Individual)", () => {
	// ===========================================================================
	// 3. SETUP: Log In Fresh BEFORE EVERY TEST
	// ===========================================================================
	test.beforeEach(async ({ page }) => {
		test.setTimeout(120000); // Give each test 2 minutes
		console.log("🔑 Logging in...");

		await page.goto("/my-courses/");

		// Inject CSS immediately to kill the cookie bar
		await page.addStyleTag({
			content: `#moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper { display: none !important; }`,
		});

		// YOUR OLD LOGIC: Human Typing
		await page
			.getByLabel("Email Address", { exact: false })
			.pressSequentially(CREDENTIALS.email, { delay: 100 });
		await page
			.getByLabel("Password", { exact: false })
			.pressSequentially(CREDENTIALS.password, { delay: 100 });

		// YOUR OLD LOGIC: Click the Button
		await page.getByRole("button", { name: "Login", exact: false }).click();

		// Verify Login Success
		await expect(page.locator("body")).toHaveClass(/logged-in/, {
			timeout: 30000,
		});
		console.log("✅ Logged in successfully");
	});

	// ===========================================================================
	// 4. INDIVIDUAL TESTS
	// ===========================================================================
	for (const internalPage of internalPages) {
		test(`Visual: ${internalPage.name}`, async ({ page }) => {
			console.log(`➡️ Navigating to: ${internalPage.name}`);

			await page.goto(internalPage.path);

			await page.waitForLoadState("domcontentloaded");

			// Run the helper to ensure widgets load and layout is stable
			await performSafeScroll(page);

			await expect(page).toHaveScreenshot(`${internalPage.name}.png`, {
				fullPage: true,
				animations: "disabled",
			});
		});
	}
});
