import { expect, Page } from '@playwright/test';
import { LOGIN_URL } from '../constants';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto(LOGIN_URL);
    const visible = await this.emailInput().isVisible({ timeout: 12000 }).catch(() => false);
    if (!visible) {
      await this.goto(LOGIN_URL);
      await this.emailInput().waitFor({ state: 'visible', timeout: 12000 });
    }
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(this.emailInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.open();
    await this.emailInput().waitFor({ state: 'visible', timeout: 12000 });
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  async loginWithFallback(): Promise<void> {
    const password = process.env.TEST_PASSWORD ?? 'Password123';
    const preferredEmail = process.env.TEST_EMAIL;
    const fallbackEmails = ['test@qabrains.com', 'practice@qabrains.com', 'student@qabrains.com'];
    const emails = preferredEmail
      ? [preferredEmail, ...fallbackEmails.filter((e) => e !== preferredEmail)]
      : fallbackEmails;

    for (const email of emails) {
      await this.open();

      const emailField = this.emailInput();
      const visible = await emailField.isVisible({ timeout: 12000 }).catch(() => false);
      if (!visible) {
        await this.open();
        await emailField.waitFor({ state: 'visible', timeout: 12000 });
      }

      await emailField.fill(email);
      await this.passwordInput().fill(password);
      await this.submitButton().click();

      try {
        await this.page.waitForURL(/\/ecommerce\/?$/, { timeout: 15000 });
        return;
      } catch {
        // Try next credential.
      }
    }

    throw new Error('Unable to authenticate with available test credentials.');
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle().click();
  }

  emailInput() {
    return this.page.locator('#email');
  }

  passwordInput() {
    return this.page.locator('#password');
  }

  submitButton() {
    return this.page.getByRole('button', { name: /login/i });
  }

  passwordToggle() {
    return this.page.locator('.form-field-group button[type="button"]').last();
  }
}
