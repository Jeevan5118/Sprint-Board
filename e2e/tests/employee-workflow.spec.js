const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { Sidebar } = require('../pages/Sidebar');
const { testData } = require('../utils/testData');

test.describe('Employee Project Workflow', () => {
  test('Employee views assigned projects and updates progress', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new Sidebar(page);

    await loginPage.goto();
    await loginPage.login(testData.employee.email, testData.employee.password);
    await expect(page).toHaveURL(/\/dashboard/);

    await sidebar.click('Projects');
    await expect(page).toHaveURL(/\/projects/);

    const anyProjectLink = page.locator('a[href^="/projects/"]').first();
    const projectCount = await anyProjectLink.count();
    test.skip(projectCount === 0, 'No projects available for employee in current environment.');

    await anyProjectLink.click();
    await expect(page).toHaveURL(/\/projects\/\d+$/);

    const openBoardLink = page.getByRole('link', { name: /open board/i }).first();
    const openBoardCount = await openBoardLink.count();
    test.skip(openBoardCount === 0, 'No sprint board link available in selected project.');

    await openBoardLink.click();
    await expect(page).toHaveURL(/\/projects\/\d+\/sprints\/\d+\/board/);

    const firstCard = page.locator('[draggable="true"]').first();
    const inProgressColumn = page.locator('.board-column').filter({ hasText: /in progress/i }).first();
    const movable = await firstCard.count();
    test.skip(movable === 0, 'No draggable tasks available to update progress.');

    await firstCard.dragTo(inProgressColumn);
    await expect(page.getByText(/task moved successfully/i)).toBeVisible();
  });
});
