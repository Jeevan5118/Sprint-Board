const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { Navbar } = require('../pages/Navbar');
const { testData } = require('../utils/testData');

test.describe('Logout Test', () => {
  test('User can logout and session ends', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navbar = new Navbar(page);

    await loginPage.goto();
    await loginPage.login(testData.admin.email, testData.admin.password);
    await expect(page).toHaveURL(/\/dashboard/);

    await navbar.logout();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
