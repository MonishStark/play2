/** @format */

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
	testDir: "./tests",

	fullyParallel: true,
	retries: 0,
	workers: process.env.CI ? 2 : undefined,

	reporter: [["html"], ["json", { outputFile: "results.json" }]],

	timeout: 5 * 60 * 1000,

	use: {
		baseURL: "https://igotmind.ca",

		trace: "on-first-retry",
		screenshot: "only-on-failure",

		launchOptions: {
			args: ["--disable-blink-features=AutomationControlled"],
			ignoreDefaultArgs: ["--enable-automation"],
		},
	},

	expect: {
		timeout: 30000,
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.02,
			threshold: 0.3,
			timeout: 60000,
		},
	},

	projects: [
		{ name: "Desktop Chrome", use: { ...devices["Desktop Chrome"] } },

		{
			name: "iPhone 17",
			use: {
				browserName: "chromium",
				channel: "chrome",
				viewport: { width: 393, height: 852 },
				deviceScaleFactor: 1,
				isMobile: true,
				hasTouch: true,
				userAgent:
					"Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1",
			},
		},
	],
});
