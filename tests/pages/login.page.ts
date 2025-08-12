/**
 * Login Page Object Model
 */

import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly signupLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.signupLink = page.locator('a[href="/signup"]');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot password")');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForRedirect(email: string, password: string, expectedUrl: string) {
    await this.login(email, password);
    await this.page.waitForURL(expectedUrl, { timeout: 10000 });
  }

  async verifyErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async verifyLoginFormVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async clickSignupLink() {
    await this.signupLink.click();
    await this.page.waitForURL('**/signup');
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async waitForLoadingComplete() {
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }
}