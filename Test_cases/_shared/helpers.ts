import { Page } from '@playwright/test';
import { LoginPage } from '../_pom/pages/LoginPage';

export const BASE_URL = 'https://practice.qabrains.com/ecommerce';
export const LOGIN_URL = `${BASE_URL}/login`;

/**
 * Authenticates using env credentials with automatic fallback.
 * Tries TEST_EMAIL first, then well-known practice credentials.
 */
export async function login(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.loginWithFallback();
}

/**
 * Adds the first available product to the cart from the home page.
 * Safe to call when the cart already has items.
 */
export async function seedCart(page: Page): Promise<void> {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const add = page.getByRole('button', { name: /add to cart/i }).first();
  if (await add.isVisible({ timeout: 5000 }).catch(() => false)) {
    await add.click();
  }
}

/**
 * Navigates through checkout info form to reach checkout-overview.
 * Assumes user is already logged in and cart has at least one item.
 */
export async function fillCheckoutInfo(
  page: Page,
  opts: { firstName?: string; lastName?: string; zip?: string } = {},
): Promise<void> {
  const { firstName = 'John', lastName = 'Doe', zip = '1207' } = opts;

  await page.goto(`${BASE_URL}/checkout-info`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  await page.locator('input[placeholder="Ex. John"]').fill(firstName);
  await page.locator('input[placeholder="Ex. Doe"]').fill(lastName);
  await page.locator('input').nth(3).fill(zip);
  await page.getByRole('button', { name: /continue/i }).click();
}

/**
 * Completes a full order flow: login → seed cart → checkout info → overview → finish.
 */
export async function completeOrder(page: Page): Promise<void> {
  await login(page);
  await seedCart(page);
  await fillCheckoutInfo(page);
  await page.waitForURL(/checkout-overview/, { timeout: 12000 });
  await page.getByRole('button', { name: /finish/i }).click();
}

/**
 * Clears all auth state (cookies + storage) to simulate an unauthenticated browser.
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage access issues in strict browser contexts.
    }
  });
}
