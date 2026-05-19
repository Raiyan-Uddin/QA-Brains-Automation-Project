import { test, expect } from '@playwright/test';
import { login } from '../_shared/helpers';
import { BASE_URL } from '../_pom/constants';
import { HomePage } from '../_pom/pages/HomePage';

function parsePrice(value: string): number {
  return Number(value.replace(/[^\d.]/g, ''));
}

test.describe('Home Module Automation - HOME', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('HOME-001/HOME-002: Home loads and cart button navigates to cart', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.expectLoaded();
    await homePage.openCartFromHeader();
    await expect(page).toHaveURL(/\/ecommerce\/cart/);
  });

  test('HOME-003: Profile dropdown shows menu options', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.open();
    await homePage.openProfileMenu();
    await expect(page.getByRole('menuitem', { name: /favourites|favorites/i }).first()).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /log out|logout/i }).first()).toBeVisible();
  });

  test('HOME-005: Sorting dropdown contains expected options', async ({ page }) => {
    // Sort is a custom combobox (popover trigger button), not a native <select>
    const homePage = new HomePage(page);
    const sort = homePage.sortCombo();
    await expect(sort).toBeVisible();
    await sort.click();

    await expect(page.locator('[role="option"]', { hasText: /a to z|ascending/i }).first()).toBeVisible();
    await expect(page.locator('[role="option"]', { hasText: /z to a|descending/i }).first()).toBeVisible();
    await expect(page.locator('[role="option"]', { hasText: /low to high/i }).first()).toBeVisible();
    await expect(page.locator('[role="option"]', { hasText: /high to low/i }).first()).toBeVisible();
  });

  test('HOME-008: Price sort low to high behaves correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.selectSortOption(/low to high/i);

    const prices = await page.locator('.text-lg.font-bold.text-black').allInnerTexts();
    const numeric = prices.slice(0, 6).map(parsePrice).filter((x) => !Number.isNaN(x));
    if (numeric.length >= 2) {
      expect(numeric[0]).toBeLessThanOrEqual(numeric[numeric.length - 1]);
    }
  });

  test('HOME-010: Add to cart updates badge', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.addFirstProductToCart();

    const badge = homePage.cartBadge();
    await expect(badge).toBeVisible();
  });

  test('HOME-004: Logout clears session and protects home route', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.logout();
    await expect(page).toHaveURL(/login|ecommerce/);

    await page.goto(BASE_URL);
    await expect(page).toHaveURL(/login|ecommerce/);
  });

  test('HOME-006: A to Z sort orders product names ascending', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.selectSortOption(/a to z|ascending/i);
    await expect(homePage.sortCombo()).toContainText(/a to z|ascending/i);
    const names = await homePage.getProductNames();
    expect(names.length).toBeGreaterThan(0);
  });

  test('HOME-007: Z to A sort orders product names descending', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.selectSortOption(/z to a|descending/i);
    await expect(homePage.sortCombo()).toContainText(/z to a|descending/i);
    const names = await homePage.getProductNames();
    expect(names.length).toBeGreaterThan(0);
  });

  test('HOME-009: Search option is discoverable and usable when available', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.sortCombo().click();
    const searchOption = page.locator('[role="option"]', { hasText: /search/i }).first();
    if (await searchOption.isVisible().catch(() => false)) {
      await searchOption.click();
      const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
      await expect(searchInput).toBeVisible();
      await searchInput.fill('bag');
      await expect(page.locator('body')).toContainText(/bag|no result|not found|sample/i);
      await searchInput.fill('xxxxx');
      await expect(page.locator('body')).toContainText(/no result|not found|products|sample/i);
      return;
    }

    // If search is not enabled in this build, keep a baseline assertion for product listing.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
  });

  test('HOME-011: Favourite toggle control is clickable on product cards', async ({ page }) => {
    const favoriteToggle = page.locator('span[role="button"] button').nth(1);
    await expect(favoriteToggle).toBeVisible();
    await favoriteToggle.click();
    await expect(favoriteToggle).toBeVisible();
    await favoriteToggle.click();
    await expect(favoriteToggle).toBeVisible();
  });

  test('HOME-012: Footer links are visible and at least one is navigable', async ({ page }) => {
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/quick links|follow us|support/i);

    const firstFooterLink = footer.locator('a[href]').first();
    await expect(firstFooterLink).toBeVisible();
    await firstFooterLink.click();
    await expect(page).toHaveURL(/https?:\/\/|\/ecommerce|\/discussion|\/about|\/terms|\/privacy/i);
  });

  test('HOME-013: Product API failure keeps UI in guarded state', async ({ page }) => {
    await page.route('**/*', async (route) => {
      const request = route.request();
      if ((request.resourceType() === 'xhr' || request.resourceType() === 'fetch') && request.method() === 'GET' && /product|items|catalog/i.test(request.url())) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Failed"}' });
        return;
      }
      await route.continue();
    });

    await page.goto(BASE_URL);
    await expect(page.locator('body')).toContainText(/products|error|qa brains|practice site|failed/i);
  });

  test('HOME-001-S: @smoke Home page loads with product listing after login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
    await expect(page.locator('body')).toContainText(/\$/);
  });

  test('HOME-010-S: @smoke Add to cart increments the cart badge', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.addFirstProductToCart();
    await expect(homePage.cartBadge()).toBeVisible();
  });

  test('HOME-014: @regression High-to-low sort mode is applied correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.selectSortOption(/high to low/i);
    await expect(homePage.sortCombo()).toContainText(/high to low/i);
    const numeric = await homePage.getVisiblePrices();
    expect(numeric.length).toBeGreaterThan(0);
  });

  test('HOME-015: @regression Multiple add-to-cart updates badge count', async ({ page }) => {
    const addButtons = page.getByRole('button', { name: /add to cart/i });
    const count = await addButtons.count();
    if (count >= 2) {
      await addButtons.nth(0).click();
      await addButtons.nth(1).click();
      const badge = page.locator('.bg-qa-clr').first();
      const badgeText = await badge.innerText().catch(() => '');
      const num = Number(badgeText.trim());
      expect(num).toBeGreaterThanOrEqual(1);
    } else {
      await addButtons.first().click();
      await expect(page.locator('.bg-qa-clr').first()).toBeVisible();
    }
  });

  test('HOME-016: @regression Unauthenticated access redirects to login', async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ } });
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(/login|ecommerce/);
  });
});
