import { expect, Page } from '@playwright/test';
import { BASE_URL } from '../constants';
import { BasePage } from './BasePage';

export class ProductDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(productId: number): Promise<void> {
    await this.goto(`${BASE_URL}/product-details?id=${productId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading').first()).toBeVisible();
    await expect(this.priceText()).toBeVisible();
  }

  plusButton() {
    return this.page.locator('button').filter({ hasText: /^\+$/ }).first();
  }

  minusButton() {
    return this.page.locator('button').filter({ hasText: /^−$/ }).first();
  }

  addToCartButton() {
    return this.page.getByRole('button', { name: /add to cart/i });
  }

  cartBadge() {
    return this.page.locator('.bg-qa-clr').first();
  }

  backToProductsButton() {
    return this.page.locator('button').filter({ hasText: 'Back to Products' }).first();
  }

  favoriteToggle() {
    return this.page.locator('button').filter({ has: this.page.locator('svg') }).first();
  }

  productImage() {
    return this.page.locator('img[alt]').first();
  }

  priceText() {
    return this.page.locator('text=/\\$\\s*\\d+/').first();
  }
}
