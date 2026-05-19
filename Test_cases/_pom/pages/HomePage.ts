import { expect, Page } from '@playwright/test';
import { BASE_URL } from '../constants';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(BASE_URL);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /products/i })).toBeVisible();
  }

  async openCartFromHeader(): Promise<void> {
    await this.page.locator('.profile span[role="button"]').first().click();
  }

  async openProfileMenu(): Promise<void> {
    await this.page.locator('button[aria-haspopup="menu"]').first().click();
  }

  async logout(): Promise<void> {
    await this.openProfileMenu();
    await this.page.getByRole('menuitem', { name: /log out|logout/i }).click();
  }

  async selectSortOption(optionPattern: RegExp): Promise<void> {
    await this.sortCombo().click();
    await this.page.locator('[role="option"]', { hasText: optionPattern }).first().click();
  }

  async getProductNames(): Promise<string[]> {
    return (await this.page.locator('a.text-lg.font-semibold.font-oswald.text-gray-900').allInnerTexts())
      .map((name) => name.trim())
      .filter(Boolean);
  }

  async getVisiblePrices(): Promise<number[]> {
    const texts = await this.page.locator('.text-lg.font-bold.text-black').allInnerTexts();
    return texts.map((p) => Number(p.replace(/[^\d.]/g, ''))).filter((n) => !Number.isNaN(n));
  }

  async addFirstProductToCart(): Promise<void> {
    await this.page.getByRole('button', { name: /add to cart/i }).first().click();
  }

  cartBadge() {
    return this.page.locator('.bg-qa-clr').first();
  }

  sortCombo() {
    return this.page.locator('[role="combobox"]').first();
  }
}
