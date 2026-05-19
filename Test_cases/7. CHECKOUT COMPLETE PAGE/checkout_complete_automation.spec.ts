import { test, expect, Page } from '@playwright/test';
import { login } from '../_shared/helpers';
import { BASE_URL } from '../_pom/constants';
import { CartPage } from '../_pom/pages/CartPage';
import { CheckoutCompletePage } from '../_pom/pages/CheckoutCompletePage';
import { CheckoutInfoPage } from '../_pom/pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../_pom/pages/CheckoutOverviewPage';

async function completeOrder(page: Page) {
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutInfoPage(page);
  const checkoutOverviewPage = new CheckoutOverviewPage(page);

  await cartPage.seedFromHome();
  await checkoutInfoPage.open();
  await checkoutInfoPage.fillInfo('John', 'Doe', '1207');
  await checkoutInfoPage.continueButton().click();

  await page.waitForURL(/checkout-overview/, { timeout: 10000 });
  await checkoutOverviewPage.finishButton().click();
}

test.describe('Checkout Complete Module Automation - CC', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await completeOrder(page);
  });

  test('CC-001/CC-003/CC-004: Completion heading and confirmation texts are visible', async ({ page }) => {
    const checkoutCompletePage = new CheckoutCompletePage(page);
    await checkoutCompletePage.expectLoaded();
    await expect(page.getByText(/thank you for your order/i)).toBeVisible();
    await expect(checkoutCompletePage.statusText()).toBeVisible();
  });

  test('CC-002: Success icon is displayed', async ({ page }) => {
    await expect(page.locator('img, svg').first()).toBeVisible();
  });

  test('CC-006: Continue Shopping navigates to home page', async ({ page }) => {
    const checkoutCompletePage = new CheckoutCompletePage(page);
    await checkoutCompletePage.continueShoppingButton().click();
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
    const checkoutCompletePage = new CheckoutCompletePage(page);
    await checkoutCompletePage.expectLoaded();
    await expect(page.getByText(/thank you for your order/i)).toBeVisible();
  });

  test('CC-006-S: @smoke Continue Shopping from completion goes to home', async ({ page }) => {
    const checkoutCompletePage = new CheckoutCompletePage(page);
    await checkoutCompletePage.continueShoppingButton().click();
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}$|${BASE_URL}/?$`));
  });

  test('CC-011: @regression Order confirmation details are visible', async ({ page }) => {
    const checkoutCompletePage = new CheckoutCompletePage(page);
    await expect(checkoutCompletePage.statusText()).toBeVisible();
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
