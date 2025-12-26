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
      /* 1. HIDE Cookie Bar (Don't delete it, just make it invisible/unclickable) */
      #moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper, .moove-gdpr-info-bar-hidden { 
        display: none !important; 
        pointer-events: none !important; 
        opacity: 0 !important;
        visibility: hidden !important;
        z-index: -1000 !important;
      }
      
      /* 2. UNLOCK Body Scroll */
      body.gdpr-infobar-visible { 
        overflow: visible !important; 
        position: static !important;
        padding-bottom: 0 !important; 
        height: auto !important;
      }

      /* 3. Force Elementor & Iframes */
      .elementor-invisible, .elementor-widget-container, iframe {
        opacity: 1 !important;
        visibility: visible !important;
        animation: none !important;
      }

      /* 4. Fix Widgets */
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
	// 3. SETUP: Authentication
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

		// 🚀 STEP 1: Pre-Inject CSS (Like Old Code)
		// We add this BEFORE navigation so it applies instantly
		await page.addInitScript(() => {
			const style = document.createElement("style");
			style.innerHTML = `
            #moove_gdpr_cookie_info_bar, .gdpr-infobar-wrapper { display: none !important; pointer-events: none !important; }
            body.gdpr-infobar-visible { overflow: visible !important; position: static !important; }
        `;
			document.head.appendChild(style);
		});

		await page.goto("/my-courses/");

		// 🚀 STEP 2: Wait for form (Network Idle)
		await page.waitForLoadState("networkidle");

		// 🚀 STEP 3: "Human Typing" (Like Old Code)
		// Some forms need 'keydown' events to enable the login button.
		// 'fill()' is too fast; 'pressSequentially' mimics a user.
		await page.getByLabel("Email Address", { exact: false }).click();
		await page
			.getByLabel("Email Address", { exact: false })
			.pressSequentially(process.env.TEST_EMAIL, { delay: 50 });

		await page.getByLabel("Password", { exact: false }).click();
		await page
			.getByLabel("Password", { exact: false })
			.pressSequentially(process.env.TEST_PASSWORD, { delay: 50 });

		// 🚀 STEP 4: Submit via 'Enter' Key (Safest for Mobile)
		console.log("⌨️ Pressing Enter...");
		await page.keyboard.press("Enter");

		// Fallback: If 'Enter' didn't trigger navigation after 3s, use Ghost Click
		try {
			await page.waitForTimeout(3000);
			// Check if we are still on the login page (Login button still exists)
			const loginBtn = page
				.locator('input[type="submit"], button[type="submit"]')
				.first();
			if (await loginBtn.isVisible()) {
				console.log("⚠️ Enter key ignored. Forcing JS Click...");
				await page.$eval('input[type="submit"], button[type="submit"]', (btn) =>
					btn.click()
				);
			}
		} catch (e) {}

		// Verify Login Success
		console.log("⏳ Waiting for login redirect...");
		await expect(page.locator("body")).toHaveClass(/logged-in/, {
			timeout: 60000,
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
