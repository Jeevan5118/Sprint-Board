const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { Sidebar } = require('../pages/Sidebar');
const { testData } = require('../utils/testData');

test.describe('Navigation Testing', () => {
  test('Verify sidebar links and routes', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new Sidebar(page);

    await loginPage.goto();
    await loginPage.login(testData.admin.email, testData.admin.password);
    await expect(page).toHaveURL(/\/dashboard/);

    await sidebar.expectVisible();

    await sidebar.click('Dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    await sidebar.click('Projects');
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('heading', { name: /^projects$/i })).toBeVisible();

    await sidebar.click('Teams');
    await expect(page).toHaveURL(/\/teams/);
    await expect(page.getByRole('heading', { name: /^teams$/i })).toBeVisible();

    await sidebar.click('Timeline');
    await expect(page).toHaveURL(/\/timeline/);
    await expect(page.getByRole('heading', { name: /timeline/i })).toBeVisible();
  });
});
