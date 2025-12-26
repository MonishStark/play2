<!-- @format -->

# Naturally Beautiful – Automated QA Suite

## 1. Project Overview

This directory contains the **Playwright Automation Suite** for
👉 **[https://naturallybeautifulhaircare.com](https://naturallybeautifulhaircare.com)**

It focuses on **Visual Regression & E-Commerce Validation**, ensuring the **Shop**, **Product Pages**, and **Portfolio Gallery** render correctly across all devices.

---

## 2. Architecture

The suite is designed to audit the entire sitemap to prevent visual bugs in the shopping experience.

| File                   | Description                                            | Scope   |
| :--------------------- | :----------------------------------------------------- | :------ |
| `tests/public.spec.js` | Iterates through 42 core URLs for visual checks.       | 42 URLs |
| `playwright.config.js` | Defines device viewports (iPhone, Samsung, Tablet etc) | Config  |

---

## 3. Configuration & Specifications

### Global Settings

- **Base URL:** `https://naturallybeautifulhaircare.com`
- **Execution Mode:** Fully Parallel
- **Visual Tolerance:** `maxDiffPixelRatio: 0.02` (2%) to allow for minor rendering differences.

---

Here is the **Test Scope** section formatted exactly as requested, covering all 42 endpoints from the Naturally Beautiful Hair Care sitemap.

## 4. Test Scope

### A. Core Pages & Shop (4 Endpoints)

- `/` – Home
- `/about-us/` – About Us
- `/contact-us/` – Contact Us
- `/shop/` – Main Shop Page

### B. Product Categories (8 Endpoints)

- `/product-category/essential-oils/` – Essential Oils
- `/product-category/hair-care/` – Hair Care
- `/product-category/hair-growth/` – Hair Growth
- `/product-category/hair-tools/` – Hair Tools
- `/product-category/certification/` – Certification
- `/product-category/training-and-education/` – Training & Education
- `/product-category/beauty/` – Beauty
- `/product-category/self-care/` – Self Care

### C. Product Detail Pages (5 Endpoints)

- `/product/scalp-stimulating-hair-growth-formula/` – Scalp Stimulating Formula
- `/product/10-key-tips-for-magnificent-microlocs/` – Microlocs Tips
- `/product/hot-oil-treatment-gift-set/` – Hot Oil Gift Set
- `/product/online-microtraing-certificate-course/` – Microtraining Course
- `/product/sweet-treat-pamper-kit/` – Sweet Treat Pamper Kit

### D. Portfolio Categories & Tags (10 Endpoints)

- `/portfolio-category/coloring/` – Category: Coloring
- `/portfolio-category/haistyle/` – Category: Hairstyle
- `/portfolio-category/hair-products/` – Category: Products
- `/portfolio-tag/blonde/` – Tag: Blonde
- `/portfolio-tag/gloss/` – Tag: Gloss
- `/portfolio-tag/haircut/` – Tag: Haircut
- `/portfolio-tag/colors/` – Tag: Colors
- `/portfolio-tag/hairstyle/` – Tag: Hairstyle
- `/portfolio-tag/trends/` – Tag: Trends
- `/portfolio-tag/highlights/` – Tag: Highlights

### E. Portfolio Gallery Items (15 Endpoints)

- `/portfolio-item/layers/` – Layers
- `/portfolio-item/volume/` – Volume
- `/portfolio-item/confident/` – Confident
- `/portfolio-item/elegant/` – Elegant
- `/portfolio-item/beautiful/` – Beautiful
- `/portfolio-item/bob/` – Bob
- `/portfolio-item/shades/` – Shades
- `/portfolio-item/sombre/` – Sombre
- `/portfolio-item/tail/` – Tail
- `/portfolio-item/braids/` – Braids
- `/portfolio-item/keratin/` – Keratin
- `/portfolio-item/curls/` – Curls
- `/portfolio-item/pixie/` – Pixie
- `/portfolio-item/waves/` – Waves
- `/portfolio-item/colors/` – Colors Item

---

## 5. Execution Option A: Cloud (GitHub Actions)

**Schedule:** Every Sunday at 9:30 AM IST.

1.  Navigate to the **[Actions Tab](../../actions)**.
2.  Select **Naturally Beautiful: Automation** from the left sidebar.
3.  Click **Run workflow**.
4.  **To View Results:**
    - Open the completion email or the GitHub Run page.
    - Scroll to **Artifacts**.
    - Download **`naturally-beautiful-report`** (Zip file).

---

## 6. Execution Option B: Local Setup (Developer Mode)

**For Developers:** Follow these steps to run the suite on your own machine.

### Prerequisites

- **Node.js** (v14 or higher)
- **NPM** (included with Node.js)

### Step 1: Clone & Install

```bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_FOLDER>

# Install Dependencies
npm install

# Install Browser Drivers
npx playwright install
```

````

### Step 2: Run Tests

Execute the full suite across all browsers:

```bash
npm run test

```

### Optional Commands

- **Update Snapshots:** `npm run update-snapshots` (Overwrites baseline images)
- **View Report:** `npx playwright show-report`

---

````
