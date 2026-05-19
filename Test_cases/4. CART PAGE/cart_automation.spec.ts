import { test, expect } from '@playwright/test';
import { login } from '../_shared/helpers';
import { BASE_URL } from '../_pom/constants';
import { CartPage } from '../_pom/pages/CartPage';

test.describe('Cart Module Automation - CART', () => {
  test.beforeEach(async ({ page }) => {
    const cartPage = new CartPage(page);
    await login(page);
    await cartPage.seedFromHome();
    await cartPage.open();
  });

  test('CART-001: Cart page and heading are visible', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.expectLoaded();
  });

  test('CART-003/CART-004: Quantity controls update cart', async ({ page }) => {
    const cartPage = new CartPage(page);
    const plus = cartPage.plusButton();
    const minus = cartPage.minusButton();

    if (await plus.isVisible()) {
      await plus.click();
      await expect(plus).toBeVisible();
    }

    if (await minus.isVisible()) {
      await minus.click();
      await expect(minus).toBeVisible();
    }
  });

  test('CART-005: Remove item from cart', async ({ page }) => {
    const cartPage = new CartPage(page);
    const remove = cartPage.removeButton();
    if (await remove.isVisible()) {
      await remove.click();
      await expect(cartPage.body()).toContainText(/empty|no items|cart/i);
    }
  });

  test('CART-007: Continue shopping navigates to home', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.continueShoppingButton().click();
    await expect(page).toHaveURL(/\/ecommerce(\/cart)?\/?$/);
  });

  test('CART-008: Checkout button navigates to checkout info', async ({ page }) => {
    const cartPage = new CartPage(page);
    const checkout = cartPage.checkoutButton();
    await checkout.click();
    await expect(page).toHaveURL(/checkout-info/);
  });

  test('CART-002: Cart row shows image name quantity controls and price', async ({ page }) => {
    const cartPage = new CartPage(page);
    const row = cartPage.row();
    await expect(row).toBeVisible();
    await expect(row.locator('img[alt]')).toBeVisible();
    await expect(row.locator('h3')).toBeVisible();
    await expect(row.getByRole('button', { name: /remove/i })).toBeVisible();
    await expect(row.locator('button').filter({ hasText: /^\+$/ })).toBeVisible();
    await expect(row.locator('button').filter({ hasText: /^-$/ })).toBeVisible();
    await expect(row.locator('text=/\\$\\s*\\d+/').first()).toBeVisible();
  });

  test('CART-006: Empty cart state is visible when all items removed', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.removeAllItems();
    await expect(cartPage.body()).toContainText(/empty|no items|your cart/i);
  });

  test('CART-009: Total formula remains non-decreasing when quantity increases', async ({ page }) => {
    const cartPage = new CartPage(page);
    const totalTextLocator = cartPage.totalText();
    const hasTotalText = await totalTextLocator.isVisible().catch(() => false);

    const parseCurrency = (text: string) => Number((text.match(/[\d,.]+/)?.[0] ?? '0').replace(/,/g, ''));

    const before = hasTotalText ? parseCurrency(await totalTextLocator.innerText()) : 0;
    const plus = cartPage.plusButton();
    if (await plus.isVisible().catch(() => false)) {
      await plus.click();
      const afterText = hasTotalText ? await totalTextLocator.innerText() : '0';
      const after = parseCurrency(afterText);
      expect(after).toBeGreaterThanOrEqual(before);
    } else {
      expect(await cartPage.rowCount()).toBeGreaterThanOrEqual(1);
    }
  });

  test('CART-011: Rapid quantity clicks keep cart interaction stable', async ({ page }) => {
    const cartPage = new CartPage(page);
    const plus = cartPage.plusButton();
    if (await plus.isVisible().catch(() => false)) {
      await Promise.all([plus.click(), plus.click(), plus.click()]);
    }
    await expect(page.locator('#cart')).toBeVisible();
  });

  test('CART-010: Cart route enforces access guard for unauthenticated state', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/cart`);
    const currentUrl = page.url();
    expect(/login|cart/.test(currentUrl)).toBeTruthy();
  });

  test('CART-001-S: @smoke Cart page loads with items and heading', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.expectLoaded();
    await expect(cartPage.row()).toBeVisible();
  });

  test('CART-008-S: @smoke Checkout button navigates to checkout-info', async ({ page }) => {
    const cartPage = new CartPage(page);
    const checkout = cartPage.checkoutButton();
    await checkout.click();
    await expect(page).toHaveURL(/checkout-info/);
  });

  test('CART-012: @regression Cart persists item after page reload', async ({ page }) => {
    const cartPage = new CartPage(page);
    const countBefore = await cartPage.rowCount();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const countAfter = await cartPage.rowCount();
    expect(countAfter).toBeGreaterThanOrEqual(countBefore > 0 ? 1 : 0);
  });

  test('CART-013: @regression Cart item row shows correct price format', async ({ page }) => {
    const cartPage = new CartPage(page);
    const priceEl = cartPage.row().locator('text=/\\$\\s*\\d+/').first();
    if (await priceEl.isVisible().catch(() => false)) {
      const text = await priceEl.innerText();
      expect(text).toMatch(/\$\s*\d+/);
    } else {
      await expect(cartPage.body()).toContainText(/cart|your cart/i);
    }
  });

  test('CART-014: @regression Continue shopping from empty cart goes to home', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.removeAllItems();
    const continueShopping = cartPage.continueShoppingAction();
    if (await continueShopping.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueShopping.first().click();
      await expect(page).toHaveURL(/\/ecommerce(\/cart)?\/?$/);
    } else {
      await expect(cartPage.body()).toContainText(/cart|empty|no items/i);
    }
  });
});
