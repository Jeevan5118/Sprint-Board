const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { testData } = require('../utils/testData');

test.describe('Form Validation', () => {
  test('Login form blocks empty submission', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.signInButton.click();
    await expect(loginPage.emailInput).toBeFocused();
  });

  test('Create Project form shows validation on bad input', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testData.admin.email, testData.admin.password);

    await page.goto('/projects');
    await page.getByRole('button', { name: /create project/i }).click();

    await page.locator('input[name="name"]').fill('Validation Project');
    await page.locator('input[name="key_code"]').fill('!');
    await page.getByRole('button', { name: /^create project$/i }).click();

    await expect(page.getByText(/project key must be 2-10 characters/i)).toBeVisible();
  });
});
