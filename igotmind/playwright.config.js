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
		{
			name: "Desktop Chrome",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
