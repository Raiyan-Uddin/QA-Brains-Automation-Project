import { expect, Locator, Page } from '@playwright/test';
import { BASE_URL } from '../constants';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(`${BASE_URL}/cart`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /your cart|cart/i })).toBeVisible();
  }

  async seedFromHome(): Promise<void> {
    await this.goto(BASE_URL);
    const add = this.page.getByRole('button', { name: /add to cart/i }).first();
    if (await add.isVisible().catch(() => false)) {
      await add.click();
    }
  }

  row() {
    return this.page.locator('#cart .cart-list > div').first();
  }

  rowCount(): Promise<number> {
    return this.page.locator('#cart .cart-list > div').count();
  }

  plusButton() {
    return this.page.locator('button').filter({ hasText: /^\+$/ }).first();
  }

  minusButton() {
    return this.page.locator('button').filter({ hasText: /^-$/ }).first();
  }

  removeButton() {
    return this.page.getByRole('button', { name: /remove/i }).first();
  }

  checkoutButton() {
    return this.page.getByRole('button', { name: /checkout/i }).first();
  }

  continueShoppingButton() {
    return this.page.getByRole('button', { name: /continue shopping/i });
  }

  totalText() {
    return this.page.locator('text=/total\s*:\s*\$?\s*\d+[\d,.]*/i').first();
  }

  body() {
    return this.page.locator('body');
  }

  async removeAllItems(): Promise<void> {
    const removeButtons = this.page.getByRole('button', { name: /remove/i });
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = this.removeButton();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
      }
    }
  }

  continueShoppingAction(): Locator {
    return this.page
      .getByRole('button', { name: /continue shopping/i })
      .or(this.page.getByRole('link', { name: /continue shopping|shop|home/i }));
  }
}
