<!-- @format -->

# I Got Mind – Automated QA Suite

## 1. Project Overview

This folder contains the **Playwright Automation Suite** for
👉 **[https://igotmind.ca](https://igotmind.ca)**

It performs **full-site functional testing and visual regression** across **23 endpoints**, covering both **public pages** and the **authenticated student dashboard**.

---

## 2. Architecture

The suite uses a **parallelized test architecture** for speed and reliability.
Tests are split into two independent specifications to allow **concurrent execution**.

| File                          | Description                                   | Scope                              |
| :---------------------------- | :-------------------------------------------- | :--------------------------------- |
| `tests/public.spec.js`        | Validates public-facing marketing pages       | 12 URLs                            |
| `tests/authenticated.spec.js` | Validates login flow and restricted dashboard | 11 internal pages (single session) |

---

## 3. Configuration & Specifications

### Global Settings (`playwright.config.js`)

- **Base URL:** `https://igotmind.ca`
- **Execution Mode:** Fully parallel (`fullyParallel: true`)
- **Workers:** 2 (one worker per spec file)
- **Global Timeout:** 60 seconds (Default)
- **Visual Tolerance:** `maxDiffPixelRatio: 0.02` (2%) to allow minor font/rendering differences.

---

## 4. Test Scope

### A. Public Pages (12 Endpoints)

- `/` – Home
- `/about/` – About Us
- `/sports/` – Sports Programs
- `/business/` – Corporate Programs
- `/4-the-boys/` – Scholarship
- `/book-now/` – Contact Us
- `/forsportsandeducation/` – Non-Profit
- `/my-courses/` – Login Page
- `/my-courses/lost-password/` – Password Reset
- `/tlw/` – The Little Warriors
- `/membership/front-of-line-membership/` – Membership Flow
- `/purchase/` – Purchase Flow

### B. Authenticated Journey (Dashboard)

- `/my-courses/` (Dashboard)
- `/my-courses/my-courses/` - My Courses
- `/my-courses/my-grades/` - My Grades
- `/my-courses/my-memberships/` - My Memberships
- `/my-courses/my-private-area/` - Private Area
- `/my-courses/my-achievements/` - Achievements
- `/my-courses/my-certificates/` - Certificates
- `/my-courses/my-notes/` - My Notes
- `/my-courses/notifications/` - Notifications
- `/my-courses/edit-account/` - Edit Account
- `/my-courses/redeem-voucher/` - Redeem Voucher
- `/my-courses/orders/` - Order History

---

## 5. Execution Option A: Cloud Dashboard (Recommended)

**For Support Team & Managers:** No installation required.

1.  Navigate to the **GitHub Repository**.
2.  Click the **Actions** tab at the top.
3.  Select **I Got Mind: Automation** from the left sidebar.
4.  Click the **Run workflow** button (right side).
5.  Wait for completion (~5-8 mins).
6.  The report would be shared to your provided mail.

> **Note on Credentials:** Cloud execution uses **GitHub Secrets**.
> Ensure `IGOTMIND_TEST_EMAIL` and `IGOTMIND_TEST_PASSWORD` are configured in **Settings > Secrets and variables > Actions**.

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

### Step 2: Configure Local Credentials

Create a `.env` file in the project root:

```env
IGOTMIND_TEST_EMAIL=test@gmail.com
IGOTMIND_TEST_PASSWORD=your_secure_password

```

### Step 3: Run Tests

Execute the full suite across all browsers:

```bash
npm run test

```

### Optional Commands

- **Update Snapshots:** `npm run update-snapshots` (Overwrites baseline images)
- **View Report:** `npx playwright show-report`

---

````
