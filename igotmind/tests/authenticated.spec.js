/** @format */

const { test, expect } = require("@playwright/test");
require("dotenv").config();

// 1. HELPER: Safe Scroll
async function performSafeScroll(page) {
	await page.evaluate(async () => {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		for (let i = 0; i < document.body.scrollHeight; i += 100) {
			window.scrollTo(0, i);
			await delay(100);
		}
		window.scrollTo(0, 0);
	});
	await page.waitForTimeout(2000);
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
	// 3. SETUP: Login once and save authentication state
	test.beforeAll(async ({ browser }) => {
		console.log("🔑 Setting up authentication...");
		const context = await browser.newContext();
		const page = await context.newPage();

		// Navigate to login page
		await page.goto("/my-courses/");

		// Fill credentials from environment variables
		await page
			.getByLabel("Email Address", { exact: false })
			.fill(process.env.TEST_EMAIL);
		await page
			.getByLabel("Password", { exact: false })
			.fill(process.env.TEST_PASSWORD);
		await page.getByRole("button", { name: "Login", exact: false }).click();

		// Verify login success
		await expect(page.locator("body")).toHaveClass(/logged-in/, {
			timeout: 30000,
		});

		// Save authentication state
		await context.storageState({ path: "storageState.json" });
		console.log("✅ Authentication state saved");

		await context.close();
	});

	// 4. USE SAVED AUTHENTICATION STATE FOR ALL TESTS
	test.use({ storageState: "storageState.json" });

	// 5. INDIVIDUAL TEST FOR EACH PAGE
	for (const internalPage of internalPages) {
		test(`Visual: ${internalPage.name}`, async ({ page }) => {
			console.log(`➡️ Testing: ${internalPage.name}`);

			// Navigate to page
			await page.goto(internalPage.path);

			// Wait for content & Scroll
			await page.waitForLoadState("domcontentloaded");
			await performSafeScroll(page);

			// Take screenshot
			await expect(page).toHaveScreenshot(`${internalPage.name}.png`, {
				fullPage: true,
			});
		});
	}
});
