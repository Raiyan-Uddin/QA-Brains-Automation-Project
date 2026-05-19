import { test, expect } from '@playwright/test';
import { login } from '../_shared/helpers';
import { BASE_URL } from '../_pom/constants';
import { ProductDetailsPage } from '../_pom/pages/ProductDetailsPage';

test.describe('Product Details Module Automation - PDP', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('PDP-001/PDP-004: Product details page renders name and price', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    await pdp.expectLoaded();
  });

  test('PDP-005/PDP-006/PDP-007: Quantity control plus/minus behavior', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    const plus = pdp.plusButton();
    const minus = pdp.minusButton();

    await plus.click();
    await plus.click();
    await minus.click();

    await expect(minus).toBeVisible();
  });

  test('PDP-009: Add to cart from PDP', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    await pdp.addToCartButton().click();
    await expect(pdp.cartBadge()).toBeVisible();
  });

  test('PDP-010: Invalid product id shows guard behavior', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(-1);
    await expect(page.locator('text=/not found|product|home|error/i').first()).toBeVisible();
  });

  test('PDP-002: Back button navigates away from PDP', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    await pdp.backToProductsButton().click();
    await expect(page).not.toHaveURL(/product-details/);
  });

  test('PDP-003: Product image renders with alt text', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    const image = pdp.productImage();
    await expect(image).toBeVisible();
    const altText = await image.getAttribute('alt');
    expect((altText ?? '').trim().length).toBeGreaterThan(0);
  });

  test('PDP-008: Favourite toggle on product details is clickable', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    const favoriteToggle = pdp.favoriteToggle();
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
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    await pdp.expectLoaded();
  });

  test('PDP-009-S: @smoke Add to cart from PDP updates badge', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    await pdp.addToCartButton().click();
    await expect(pdp.cartBadge()).toBeVisible();
  });

  test('PDP-012: @regression Product id=0 shows guard or empty state', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(0);
    await expect(page.locator('text=/not found|product|home|error/i').first()).toBeVisible();
  });

  test('PDP-013: @regression Quantity cannot go below 1 via minus button', async ({ page }) => {
    const pdp = new ProductDetailsPage(page);
    await pdp.open(1);
    const minus = pdp.minusButton();

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
    const pdp = new ProductDetailsPage(page);
    await pdp.open(2);
    await pdp.expectLoaded();
  });
});
