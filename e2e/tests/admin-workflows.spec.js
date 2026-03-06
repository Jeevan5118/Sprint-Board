const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../pages/LoginPage');
const { ProjectsPage } = require('../pages/ProjectsPage');
const { Sidebar } = require('../pages/Sidebar');
const { createApiContext, loginAndGetToken, getUsers } = require('../utils/apiClient');
const { testData } = require('../utils/testData');

test.describe('Admin Workflows', () => {
  test('Admin Adds Employee (CSV import)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const projectsPage = new ProjectsPage(page);
    const api = await createApiContext();

    const csvPath = path.join(__dirname, '..', 'tmp-employee-import.csv');
    const employee = testData.uniqueEmployee;
    fs.writeFileSync(
      csvPath,
      `email,password,first_name,last_name,role\n${employee.email},${employee.password},${employee.firstName},${employee.lastName},member\n`,
      'utf8'
    );

    try {
      await loginPage.goto();
      await loginPage.login(testData.admin.email, testData.admin.password);
      await expect(page).toHaveURL(/\/dashboard/);

      await projectsPage.goto();
      await projectsPage.importCsvButton.click();
      await projectsPage.importTypeSelect.selectOption('employees');
      await projectsPage.csvFileInput.setInputFiles(csvPath);
      await projectsPage.startImportButton.click();

      await expect(page.getByText(/import result/i)).toBeVisible();
      await expect(page.getByText(new RegExp(employee.email, 'i')).first()).toHaveCount(0);

      const token = await loginAndGetToken(api, testData.admin.email, testData.admin.password);
      const users = await getUsers(api, token);
      const created = users.find((u) => String(u.email).toLowerCase() === employee.email.toLowerCase());
      expect(created).toBeTruthy();
    } finally {
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
      await api.dispose();
    }
  });

  test('Admin Creates Project', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const projectsPage = new ProjectsPage(page);
    const sidebar = new Sidebar(page);

    await loginPage.goto();
    await loginPage.login(testData.admin.email, testData.admin.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await sidebar.click('Projects');
    await projectsPage.openCreateProjectModal();

    const today = new Date();
    const plus7 = new Date(today);
    plus7.setDate(plus7.getDate() + 7);
    const fmt = (d) => d.toISOString().slice(0, 10);

    await projectsPage.createProject({
      name: testData.uniqueProject.name,
      key: testData.uniqueProject.key,
      description: 'Project created by Playwright E2E',
      startDate: fmt(today),
      endDate: fmt(plus7)
    });

    await projectsPage.expectProjectVisible(testData.uniqueProject.name);
  });
});
