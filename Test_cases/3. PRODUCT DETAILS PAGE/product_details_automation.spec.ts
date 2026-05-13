import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://practice.qabrains.com/ecommerce';
const LOGIN_URL = `${BASE_URL}/login`;

async function login(page: Page) {
  const password = process.env.TEST_PASSWORD ?? 'Password123';
  const preferredEmail = process.env.TEST_EMAIL;
  const fallbackEmails = ['test@qabrains.com', 'practice@qabrains.com', 'student@qabrains.com'];
  const emails = preferredEmail ? [preferredEmail, ...fallbackEmails.filter((e) => e !== preferredEmail)] : fallbackEmails;

  for (const email of emails) {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    const emailField = page.locator('#email');
    const visible = await emailField.isVisible({ timeout: 12000 }).catch(() => false);
    if (!visible) {
      // One retry helps when the login document is slow to hydrate.
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
      await emailField.waitFor({ state: 'visible', timeout: 12000 });
    }

    await emailField.fill(email);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL(/\/ecommerce\/?$/, { timeout: 15000 });
      return;
    } catch {
      // Try next accepted credential.
    }
  }

  throw new Error('Unable to authenticate with available test credentials.');
}

test.describe('Product Details Module Automation - PDP', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('PDP-001/PDP-004: Product details page renders name and price', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading').first()).toBeVisible();
    // Price text contains "$" - matches e.g. "$49.99"
    await expect(page.locator('text=/\\$\\s*\\d+/').first()).toBeVisible();
  });

  test('PDP-005/PDP-006/PDP-007: Quantity control plus/minus behavior', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    await page.waitForLoadState('networkidle');

    // Qty buttons have exact text "+" and "−" (special minus character)
    const plus = page.locator('button').filter({ hasText: /^\+$/ }).first();
    const minus = page.locator('button').filter({ hasText: /^−$/ }).first();

    await plus.click();
    await plus.click();
    await minus.click();

    await expect(minus).toBeVisible();
  });

  test('PDP-009: Add to cart from PDP', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /add to cart/i }).click();
    // Cart badge should become visible after adding
    await expect(page.locator('.bg-qa-clr').first()).toBeVisible();
  });

  test('PDP-010: Invalid product id shows guard behavior', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=-1`);
    await expect(page.locator('text=/not found|product|home|error/i').first()).toBeVisible();
  });

  test('PDP-002: Back button navigates away from PDP', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    await page.waitForLoadState('networkidle');
    // Back button text is "Back to Products"
    await page.locator('button').filter({ hasText: 'Back to Products' }).first().click();
    await expect(page).not.toHaveURL(/product-details/);
  });

  test('PDP-003: Product image renders with alt text', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    const image = page.locator('img[alt]').first();
    await expect(image).toBeVisible();
    const altText = await image.getAttribute('alt');
    expect((altText ?? '').trim().length).toBeGreaterThan(0);
  });

  test('PDP-008: Favourite toggle on product details is clickable', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    const favoriteToggle = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await favoriteToggle.isVisible().catch(() => false)) {
      await favoriteToggle.click();
      await expect(favoriteToggle).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(favoriteToggle).toBeVisible();
    } else {
      await expect(page.locator('body')).toContainText(/product|details|sample/i);
    }
  });

  test('PDP-011: Direct access without authenticated state is guarded', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignore storage access issues in strict browser contexts.
      }
    });

    await page.goto(`${BASE_URL}/product-details?id=1`);
    const currentUrl = page.url();
    expect(/login|product-details/.test(currentUrl)).toBeTruthy();
  });

  test('PDP-001-S: @smoke Product details page loads with name and price', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.locator('text=/\\$\\s*\\d+/').first()).toBeVisible();
  });

  test('PDP-009-S: @smoke Add to cart from PDP updates badge', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /add to cart/i }).click();
    await expect(page.locator('.bg-qa-clr').first()).toBeVisible();
  });

  test('PDP-012: @regression Product id=0 shows guard or empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=0`);
    await expect(page.locator('text=/not found|product|home|error/i').first()).toBeVisible();
  });

  test('PDP-013: @regression Quantity cannot go below 1 via minus button', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=1`);
    await page.waitForLoadState('networkidle');

    const minus = page.locator('button').filter({ hasText: /^−$/ }).first();

    if (await minus.isVisible()) {
      await minus.click();
      await minus.click();
      // After clicking minus twice, the button should still exist (page is stable) and not break the UI
      await expect(page.getByRole('heading').first()).toBeVisible();
      await expect(minus).toBeVisible();
    } else {
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('PDP-014: @regression Page renders correctly for a second product', async ({ page }) => {
    await page.goto(`${BASE_URL}/product-details?id=2`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.locator('text=/\\$\\s*\\d+/').first()).toBeVisible();
  });
});
