import { expect, Page } from '@playwright/test';
import { BASE_URL } from '../constants';
import { BasePage } from './BasePage';

export class CheckoutCompletePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(`${BASE_URL}/checkout-complete`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-complete/);
    await expect(this.page.getByRole('heading', { name: /checkout|complete/i })).toBeVisible();
  }

  continueShoppingButton() {
    return this.page.getByRole('button', { name: /continue shopping/i });
  }

  body() {
    return this.page.locator('body');
  }

  statusText() {
    return this.page.getByText(/dispatch|delivered|shipping/i).first();
  }
}
