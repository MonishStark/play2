/** @format */

const { test, expect } = require("@playwright/test");

async function loadAllLazyImages(page) {
	await page.evaluate(async () => {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		for (let i = 0; i < document.body.scrollHeight; i += 300) {
			window.scrollTo(0, i);
			await delay(30);
		}
		window.scrollTo(0, 0);
	});
	await page.waitForTimeout(2000);
}

const pagesToTest = [
	{ path: "/", name: "Home" },
	{ path: "/about-us/", name: "About_Us" },
	{ path: "/shop/", name: "Shop_Main" },
	{ path: "/contact-us/", name: "Contact_Us" },

	{ path: "/product-category/essential-oils/", name: "Cat_Essential_Oils" },
	{ path: "/product-category/hair-care/", name: "Cat_Hair_Care" },
	{ path: "/product-category/hair-growth/", name: "Cat_Hair_Growth" },
	{ path: "/product-category/hair-tools/", name: "Cat_Hair_Tools" },
	{ path: "/product-category/certification/", name: "Cat_Certification" },
	{ path: "/product-category/training-and-education/", name: "Cat_Training" },
	{ path: "/product-category/beauty/", name: "Cat_Beauty" },
	{ path: "/product-category/self-care/", name: "Cat_Self_Care" },

	{
		path: "/product/scalp-stimulating-hair-growth-formula/",
		name: "Product_Scalp_Formula",
	},
	{
		path: "/product/10-key-tips-for-magnificent-microlocs/",
		name: "Product_10_Key_Tips",
	},
	{ path: "/product/hot-oil-treatment-gift-set/", name: "Product_Hot_Oil_Set" },
	{
		path: "/product/online-microtraing-certificate-course/",
		name: "Product_Microtraining",
	},
	{ path: "/product/sweet-treat-pamper-kit/", name: "Product_Sweet_Treat" },

	{ path: "/portfolio-category/coloring/", name: "Port_Cat_Coloring" },
	{ path: "/portfolio-category/haistyle/", name: "Port_Cat_Hairstyle" },
	{ path: "/portfolio-category/hair-products/", name: "Port_Cat_Products" },

	{ path: "/portfolio-item/layers/", name: "Gallery_Layers" },
	{ path: "/portfolio-item/volume/", name: "Gallery_Volume" },
	{ path: "/portfolio-item/confident/", name: "Gallery_Confident" },
	{ path: "/portfolio-item/elegant/", name: "Gallery_Elegant" },
	{ path: "/portfolio-item/beautiful/", name: "Gallery_Beautiful" },
	{ path: "/portfolio-item/bob/", name: "Gallery_Bob" },
	{ path: "/portfolio-item/shades/", name: "Gallery_Shades" },
	{ path: "/portfolio-item/sombre/", name: "Gallery_Sombre" },
	{ path: "/portfolio-item/tail/", name: "Gallery_Tail" },
	{ path: "/portfolio-item/braids/", name: "Gallery_Braids" },
	{ path: "/portfolio-item/keratin/", name: "Gallery_Keratin" },
	{ path: "/portfolio-item/curls/", name: "Gallery_Curls" },
	{ path: "/portfolio-item/pixie/", name: "Gallery_Pixie" },
	{ path: "/portfolio-item/waves/", name: "Gallery_Waves" },
	{ path: "/portfolio-item/colors/", name: "Gallery_Colors_Item" },

	{ path: "/portfolio-tag/blonde/", name: "Tag_Blonde" },
	{ path: "/portfolio-tag/gloss/", name: "Tag_Gloss" },
	{ path: "/portfolio-tag/haircut/", name: "Tag_Haircut" },
	{ path: "/portfolio-tag/colors/", name: "Tag_Colors" },
	{ path: "/portfolio-tag/hairstyle/", name: "Tag_Hairstyle" },
	{ path: "/portfolio-tag/trends/", name: "Tag_Trends" },
	{ path: "/portfolio-tag/highlights/", name: "Tag_Highlights" },
];

test.describe("Naturally Beautiful - Full Site Audit", () => {
	for (const pageInfo of pagesToTest) {
		test(`Verify Layout: ${pageInfo.name}`, async ({ page }) => {
			await page.goto(pageInfo.path);
			await page.waitForLoadState("domcontentloaded");

			await loadAllLazyImages(page);

			await expect(page).toHaveScreenshot({
				fullPage: true,
				animations: "disabled",
				timeout: 60000,
				maxDiffPixelRatio: 0.02,
			});
		});
	}
});
