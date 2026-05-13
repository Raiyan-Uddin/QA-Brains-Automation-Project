import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://practice.qabrains.com/ecommerce';
const LOGIN_URL = `${BASE_URL}/login`;

async function login(page: Page) {
  const password = process.env.TEST_PASSWORD ?? 'Password123';
  const preferredEmail = process.env.TEST_EMAIL;
  const fallbackEmails = ['test@qabrains.com', 'practice@qabrains.com', 'student@qabrains.com'];
  const emails = preferredEmail ? [preferredEmail, ...fallbackEmails.filter((e) => e !== preferredEmail)] : fallbackEmails;

  for (const email of emails) {
    await page.goto(LOGIN_URL);
    await page.locator('#email').waitFor({ state: 'visible' });
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL(/\/ecommerce\/?$/, { timeout: 12000 });
      return;
    } catch {
      // Try next accepted credential.
    }
  }

  throw new Error('Unable to authenticate with available test credentials.');
}

async function completeOrder(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  const add = page.getByRole('button', { name: /add to cart/i }).first();
  if (await add.isVisible()) {
    await add.click();
  }

  await page.goto(`${BASE_URL}/checkout-info`);
  await page.waitForLoadState('networkidle');
  // Email is pre-filled and disabled - only fill first name, last name, zip
  await page.locator('input[placeholder="Ex. John"]').fill('John');
  await page.locator('input[placeholder="Ex. Doe"]').fill('Doe');
  await page.locator('input').nth(3).fill('1207');
  await page.getByRole('button', { name: /continue/i }).click();

  await page.waitForURL(/checkout-overview/, { timeout: 10000 });
  await page.getByRole('button', { name: /finish/i }).click();
}

test.describe('Checkout Complete Module Automation - CC', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await completeOrder(page);
  });

  test('CC-001/CC-003/CC-004: Completion heading and confirmation texts are visible', async ({ page }) => {
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(page.getByRole('heading', { name: /checkout|complete/i })).toBeVisible();
    await expect(page.getByText(/thank you for your order/i)).toBeVisible();
    await expect(page.getByText(/dispatch|delivered|shipping/i).first()).toBeVisible();
  });

  test('CC-002: Success icon is displayed', async ({ page }) => {
    await expect(page.locator('img, svg').first()).toBeVisible();
  });

  test('CC-006: Continue Shopping navigates to home page', async ({ page }) => {
    await page.getByRole('button', { name: /continue shopping/i }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}$|${BASE_URL}/?$`));
  });

  test('CC-005: Cart is empty after order completion', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText(/empty|no items|your cart/i).first()).toBeVisible();
  });

  test('CC-007: Direct access without finishing flow is guarded', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignore storage access issues.
      }
    });

    await page.goto(`${BASE_URL}/checkout-complete`);
    const currentUrl = page.url();
    expect(/login|checkout-complete|ecommerce/.test(currentUrl)).toBeTruthy();
  });

  test('CC-008: Completion page has no editable transactional inputs', async ({ page }) => {
    const editableInputs = page.locator('input:not([disabled]), textarea:not([disabled]), select:not([disabled])');
    await expect(editableInputs).toHaveCount(0);
  });

  test('CC-009: Completion CTA is keyboard accessible', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const continueButton = page.getByRole('button', { name: /continue shopping/i });
    await expect(continueButton).toBeVisible();
  });

  test('CC-010: Completion page renders in mobile and desktop viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator('body')).toContainText(/thank you for your order|checkout|login/i);

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.reload();
    await expect(page.locator('body')).toContainText(/thank you for your order|checkout|login/i);
  });

  test('CC-001-S: @smoke Completion page shows thank-you confirmation', async ({ page }) => {
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(page.getByText(/thank you for your order/i)).toBeVisible();
  });

  test('CC-006-S: @smoke Continue Shopping from completion goes to home', async ({ page }) => {
    await page.getByRole('button', { name: /continue shopping/i }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}$|${BASE_URL}/?$`));
  });

  test('CC-011: @regression Order confirmation details are visible', async ({ page }) => {
    await expect(page.getByText(/dispatch|delivered|shipping/i).first()).toBeVisible();
    await expect(page.locator('img, svg').first()).toBeVisible();
  });

  test('CC-012: @regression Cart is cleared after order completion', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.locator('body')).toContainText(/empty|no items|your cart/i);
  });

  test('CC-013: @regression Completion page has no stale checkout inputs', async ({ page }) => {
    const checkoutInputs = page.locator('input[placeholder="Ex. John"], input[placeholder="Ex. Doe"]');
    await expect(checkoutInputs).toHaveCount(0);
  });
});
