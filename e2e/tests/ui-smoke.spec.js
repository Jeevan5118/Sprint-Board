const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { Sidebar } = require('../pages/Sidebar');
const { testData } = require('../utils/testData');

test.describe('Basic UI Smoke Test', () => {
  test('Key elements are visible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const sidebar = new Sidebar(page);

    await loginPage.goto();
    await loginPage.login(testData.admin.email, testData.admin.password);

    await dashboardPage.expectLoaded();
    await sidebar.expectVisible();

    await expect(dashboardPage.dashboardCards.first()).toBeVisible();

    await sidebar.click('Projects');
    await expect(page.getByRole('heading', { name: /^projects$/i })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /create project/i })).toBeVisible();
  });
});
