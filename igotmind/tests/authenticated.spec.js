/** @format */

const { test, expect } = require("@playwright/test");
require("dotenv").config();

// 1. HELPER: Safe Scroll + Fonts + Layout Fix (The "Winning" Logic)
async function performSafeScroll(page) {
	// A.1 STEALTH INJECTION
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "webdriver", {
			get: () => undefined,
		});
	});

	// A.2 WAIT FOR FONTS
	console.log("🎨 Waiting for custom fonts...");
	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	// B. PRE-EMPTIVE CSS: Force Layout & Visibility
	await page.addStyleTag({
		content: `
      /* 1. Kill Cookie Bar */
      #moove_gdpr_cookie_info_bar { display: none !important; }

      /* 2. Force Elementor Content Visible */
      .elementor-invisible,
      .elementor-motion-effects-element,
      .elementor-motion-effects-parent,
      .elementor-widget-container {
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        animation: none !important;
        transition: none !important;
      }

      /* 3. Force Iframes Visible */
      iframe {
        opacity: 1 !important;
        visibility: visible !important;
      }

      /* 4. WIDGET FIXES (Calendly/PayPal) */
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

	// C. WAKE UP VIDEOS
	await page.evaluate(() => {
		document.querySelectorAll("iframe").forEach((frame) => {
			frame.loading = "eager";
			frame.style.opacity = "1";
		});
	});

	// D. SCROLL LOGIC
	await page.evaluate(async () => {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		const totalHeight = document.body.scrollHeight;

		for (let i = 0; i < totalHeight; i += 200) {
			window.scrollTo(0, i);
			await delay(100);
		}
		window.scrollTo(0, 0);
	});

	// E. Final Buffer
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

		// Create new context (Ignore storageState to start fresh)
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

		// 🚀 CRITICAL FIX: Hide Cookie Bar BEFORE clicking Login
		// This prevents the "Login button is covered" error on Mobile/Safari
		await page.addStyleTag({
			content: `
        #moove_gdpr_cookie_info_bar, 
        .moove-gdpr-info-bar-hidden,
        .gdpr-infobar-wrapper { 
           display: none !important; 
           pointer-events: none !important;
        }
      `,
		});

		// Fill credentials
		await page
			.getByLabel("Email Address", { exact: false })
			.fill(process.env.TEST_EMAIL);
		await page
			.getByLabel("Password", { exact: false })
			.fill(process.env.TEST_PASSWORD);

		// Click Login (Force click to punch through any remaining overlays)
		const loginBtn = page
			.locator('input[type="submit"], button[type="submit"]')
			.first();
		await loginBtn.click({ force: true });

		// Wait for redirect verification
		await expect(page.locator("body")).toHaveClass(/logged-in/, {
			timeout: 45000,
		});

		// Save the file for the next step
		await context.storageState({ path: "storageState.json" });
		console.log("✅ Authentication state saved");

		await context.close();
	});

	// 4. NESTED GROUP: Only THESE tests use the file we just created
	test.describe("Authenticated Visual Checks", () => {
		// Use the login token only for these tests
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
