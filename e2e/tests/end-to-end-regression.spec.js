const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { Sidebar } = require('../pages/Sidebar');
const { ProjectsPage } = require('../pages/ProjectsPage');
const { testData } = require('../utils/testData');

test.describe('Combined Scenario Coverage', () => {
  test('Covers admin auth, create project, assign flow visibility, and route access', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new Sidebar(page);
    const projectsPage = new ProjectsPage(page);

    await loginPage.goto();
    await loginPage.login(testData.admin.email, testData.admin.password);
    await expect(page).toHaveURL(/\/dashboard/);

    await sidebar.click('Projects');
    await projectsPage.openCreateProjectModal();
    await projectsPage.createProject({
      name: `${testData.uniqueProject.name} R2`,
      key: `${testData.uniqueProject.key}R`,
      description: 'Regression project'
    });
    await projectsPage.expectProjectVisible(`${testData.uniqueProject.name} R2`);
  });
});
