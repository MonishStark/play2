/** @format */

const { test, expect } = require("@playwright/test");

test.use({
	userAgent:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	locale: "en-US",
	permissions: ["geolocation"],
});

async function preparePageForScreenshot(page) {
	await page.addInitScript(() => {
		window.__PLAYWRIGHT__ = true;
	});

	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	await page.addStyleTag({
		content: `
      * {
        animation: none !important;
        transition: none !important;
      }

      .elementor-invisible,
      .elementor-motion-effects-element,
      .elementor-motion-effects-parent {
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
      }

      #moove_gdpr_cookie_info_bar {
        display: none !important;
      }
    `,
	});

	await page.evaluate(async () => {
		const delay = (ms) => new Promise((r) => setTimeout(r, ms));
		const height = document.body.scrollHeight;

		for (let y = 0; y < height; y += 250) {
			window.scrollTo(0, y);
			await delay(80);
		}

		window.scrollTo(0, 0);
	});

	await page.waitForTimeout(3000);
}

const pagesToTest = [
	{ path: "/", name: "01_Home" },
	{ path: "/about/", name: "02_About_Us" },
	{ path: "/sports/", name: "03_Sports_Programs" },
	{ path: "/business/", name: "04_Corporate_Programs" },
	{ path: "/4-the-boys/", name: "05_Scholarship" },
	{ path: "/book-now/", name: "06_Contact_Us" },
	{ path: "/forsportsandeducation/", name: "07_Non_Profit" },
	{ path: "/my-courses/", name: "08_Login_Page" },
	{ path: "/my-courses/lost-password/", name: "09_Password_Reset" },
	{ path: "/tlw/", name: "10_The_Little_Warriors" },
	{ path: "/membership/front-of-line-membership/", name: "11_Membership_Flow" },
	{ path: "/purchase/", name: "12_Purchase_Flow" },
];

test.describe("I Got Mind – Public Visual Audit", () => {
	for (const pageInfo of pagesToTest) {
		test(`Visual: ${pageInfo.name}`, async ({ page }) => {
			await page.goto(pageInfo.path, { waitUntil: "domcontentloaded" });

			await preparePageForScreenshot(page);

			await expect(page).toHaveScreenshot({
				fullPage: true,

				mask: [
					page.locator('iframe[src*="paypal"]'),
					page.locator('iframe[src*="calendly"]'),
					page.locator('div[class*="campaigns_widget"]'),
				],
			});
		});
	}
});
