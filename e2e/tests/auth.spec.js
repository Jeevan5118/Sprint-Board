const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { testData } = require('../utils/testData');

test.describe('Authentication', () => {
  test('Admin Authentication', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(testData.admin.email, testData.admin.password);

    await expect(page).toHaveURL(/\/dashboard/);
    await dashboardPage.expectLoaded();
  });

  test('Employee Authentication', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(testData.employee.email, testData.employee.password);

    await expect(page).toHaveURL(/\/dashboard/);
    await dashboardPage.expectLoaded();
  });
});
