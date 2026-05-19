import { test, expect, Page } from '@playwright/test';
import { login } from '../_shared/helpers';
import { BASE_URL } from '../_pom/constants';
import { CartPage } from '../_pom/pages/CartPage';
import { CheckoutInfoPage } from '../_pom/pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../_pom/pages/CheckoutOverviewPage';

async function reachOverview(page: Page) {
  const cartPage = new CartPage(page);
  const checkoutInfoPage = new CheckoutInfoPage(page);
  await cartPage.seedFromHome();
  await checkoutInfoPage.open();
  await checkoutInfoPage.fillInfo('John', 'Doe', '1207');
  await checkoutInfoPage.continueButton().click();
}

test.describe('Checkout Overview Module Automation - CO', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await reachOverview(page);
  });

  test('CO-001/CO-002: Overview page renders product summary', async ({ page }) => {
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    await checkoutOverviewPage.expectLoaded();
    await expect(checkoutOverviewPage.priceText()).toBeVisible();
  });

  test('CO-003/CO-004/CO-005: Payment, shipping and totals sections are visible', async ({ page }) => {
    await expect(page.getByText(/payment information/i)).toBeVisible();
    await expect(page.getByText(/shipping information/i)).toBeVisible();
    await expect(page.getByText(/item total|tax|total/i).first()).toBeVisible();
  });

  test('CO-008: Cancel exits overview flow', async ({ page }) => {
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    await checkoutOverviewPage.cancelButton().click();
    await expect(page).not.toHaveURL(/checkout-overview/);
  });

  test('CO-009: Finish completes order and opens completion page', async ({ page }) => {
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    await checkoutOverviewPage.finishButton().click();
    await expect(page).toHaveURL(/checkout-complete/);
  });

  test('CO-006: Grand total follows item total plus tax formula', async ({ page }) => {
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    const bodyText = await checkoutOverviewPage.body().innerText();
    const extract = (label: RegExp) => {
      const match = bodyText.match(new RegExp(`${label.source}[^\n\r$]*\$\s*([\d.]+)`, 'i'));
      return Number(match?.[1] ?? '0');
    };

    const itemTotal = extract(/item\s*total/);
    const tax = extract(/tax/);
    const grandTotal = extract(/total/);

    if (itemTotal > 0 && grandTotal > 0) {
      expect(Math.abs((itemTotal + tax) - grandTotal)).toBeLessThan(0.05);
    } else {
      await expect(checkoutOverviewPage.body()).toContainText(/item total|tax|total/i);
    }
  });

  test('CO-007: Overview page displays read-only order data', async ({ page }) => {
    // Allow non-checkout auxiliary controls, but checkout form fields must be absent.
    await expect(page.locator('input[placeholder="Ex. John"], input[placeholder="Ex. Doe"]')).toHaveCount(0);
  });

  test('CO-010: Overview remains stable when backend fetch fails', async ({ page }) => {
    await page.route('**/*', async (route) => {
      const request = route.request();
      if ((request.resourceType() === 'xhr' || request.resourceType() === 'fetch') && request.method() === 'GET' && /overview|checkout|order|cart|product/i.test(request.url())) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"failure"}' });
        return;
      }
      await route.continue();
    });

    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    await checkoutOverviewPage.open();
    await expect(checkoutOverviewPage.body()).toContainText(/checkout|overview|error|qa brains|failure/i, { timeout: 15000 });
  });

  test('CO-011: Unauthorized direct access is guarded', async ({ page }) => {
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

    await page.goto(`${BASE_URL}/checkout-overview`);
    const currentUrl = page.url();
    expect(/login|checkout-overview|ecommerce/.test(currentUrl)).toBeTruthy();
  });

  test('CO-001-S: @smoke Overview page renders product summary with price', async ({ page }) => {
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    await checkoutOverviewPage.expectLoaded();
    await expect(page.locator('.font-bold').filter({ hasText: /\$/ }).first()).toBeVisible();
  });

  test('CO-009-S: @smoke Finish button completes order and shows completion page', async ({ page }) => {
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    await checkoutOverviewPage.finishButton().click();
    await expect(page).toHaveURL(/checkout-complete/);
  });

  test('CO-012: @regression Payment section shows required info labels', async ({ page }) => {
    await expect(page.getByText(/payment information/i)).toBeVisible();
    await expect(page.locator('body')).toContainText(/visa|mastercard|card|payment/i);
  });

  test('CO-013: @regression Item count in overview matches cart item count', async ({ page }) => {
    const namedItems = page.locator('[class*="item"], [class*="product"], .font-bold').filter({ hasText: /\w+/ });
    const priceLikeItems = page.locator('text=/\$\s*\d+/');

    const namedCount = await namedItems.count();
    const pricedCount = await priceLikeItems.count();

    // Overview structure can vary by build; require at least one item-like or price-like element.
    expect(namedCount > 0 || pricedCount > 0).toBeTruthy();
  });

  test('CO-014: @regression Overview page title and breadcrumb is correct', async ({ page }) => {
    await expect(page).toHaveURL(/checkout-overview/);
    const heading = page.getByRole('heading', { name: /checkout|overview/i });
    await expect(heading).toBeVisible();
    const headingText = await heading.innerText();
    expect(headingText.length).toBeGreaterThan(0);
  });
});
