import { expect, Page } from '@playwright/test';
import { BASE_URL } from '../constants';
import { BasePage } from './BasePage';

export class CheckoutInfoPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(`${BASE_URL}/checkout-info`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /checkout.*information|your information/i })).toBeVisible();
    await expect(this.firstNameInput()).toBeVisible();
    await expect(this.lastNameInput()).toBeVisible();
    await expect(this.zipInput()).toBeVisible();
  }

  firstNameInput() {
    return this.page.locator('input[placeholder="Ex. John"]');
  }

  lastNameInput() {
    return this.page.locator('input[placeholder="Ex. Doe"]');
  }

  zipInput() {
    return this.page.locator('input').nth(3);
  }

  continueButton() {
    return this.page.getByRole('button', { name: /continue/i });
  }

  cancelButton() {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  async fillInfo(firstName: string, lastName: string, zip: string): Promise<void> {
    await this.firstNameInput().fill(firstName);
    await this.lastNameInput().fill(lastName);
    await this.zipInput().fill(zip);
  }
}
