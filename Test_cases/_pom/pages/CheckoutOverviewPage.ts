import { expect, Page } from '@playwright/test';
import { BASE_URL } from '../constants';
import { BasePage } from './BasePage';

export class CheckoutOverviewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(`${BASE_URL}/checkout-overview`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-overview/);
    await expect(this.page.getByRole('heading', { name: /checkout|overview/i })).toBeVisible();
  }

  finishButton() {
    return this.page.getByRole('button', { name: /finish/i });
  }

  cancelButton() {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  body() {
    return this.page.locator('body');
  }

  priceText() {
    return this.page.locator('.text-lg.font-bold.text-black, .font-bold').filter({ hasText: /\$/ }).first();
  }
}
