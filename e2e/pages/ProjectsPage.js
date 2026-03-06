const { expect } = require('@playwright/test');

class ProjectsPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /^projects$/i });
    this.createProjectButton = page.getByRole('button', { name: /create project/i });
    this.projectNameInput = page.locator('input[name="name"]');
    this.projectKeyInput = page.locator('input[name="key_code"]');
    this.projectDescriptionInput = page.locator('textarea[name="description"]');
    this.projectTeamSelect = page.locator('select[name="team_id"]');
    this.projectStartDateInput = page.locator('input[name="start_date"]');
    this.projectEndDateInput = page.locator('input[name="end_date"]');
    this.projectSubmitButton = page.getByRole('button', { name: /^create project$/i });
    this.importCsvButton = page.getByRole('button', { name: /import csv/i });
    this.importTypeSelect = page.locator('select').first();
    this.csvFileInput = page.locator('input[type="file"]');
    this.startImportButton = page.getByRole('button', { name: /start import/i });
  }

  async goto() {
    await this.page.goto('/projects');
    await expect(this.heading).toBeVisible();
  }

  async openCreateProjectModal() {
    await this.createProjectButton.click();
    await expect(this.projectNameInput).toBeVisible();
  }

  async createProject({ name, key, description, startDate, endDate }) {
    await this.projectNameInput.fill(name);
    await this.projectKeyInput.fill(key);
    await this.projectDescriptionInput.fill(description || 'E2E created project');

    const options = this.projectTeamSelect.locator('option');
    const optionCount = await options.count();
    if (optionCount > 1) {
      const secondValue = await options.nth(1).getAttribute('value');
      if (secondValue) {
        await this.projectTeamSelect.selectOption(secondValue);
      }
    }

    if (startDate) {
      await this.projectStartDateInput.fill(startDate);
    }
    if (endDate) {
      await this.projectEndDateInput.fill(endDate);
    }
    await this.projectSubmitButton.click();
  }

  async expectProjectVisible(projectName) {
    await expect(this.page.getByRole('link', { name: new RegExp(projectName, 'i') })).toBeVisible();
  }
}

module.exports = { ProjectsPage };
