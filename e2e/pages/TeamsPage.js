const { expect } = require('@playwright/test');

class TeamsPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /^teams$/i });
    this.createTeamButton = page.getByRole('button', { name: /create team/i });
    this.teamNameInput = page.getByPlaceholder(/frontend squad/i);
    this.teamDescriptionInput = page.getByPlaceholder(/team's mission/i);
    this.teamLeadSelect = page.locator('select').last();
    this.createTeamSubmit = page.getByRole('button', { name: /^create team$/i });
  }

  async goto() {
    await this.page.goto('/teams');
    await expect(this.heading).toBeVisible();
  }

  async createTeam({ name, description }) {
    await this.createTeamButton.click();
    await expect(this.teamNameInput).toBeVisible();
    await this.teamNameInput.fill(name);
    await this.teamDescriptionInput.fill(description || 'E2E team description');

    const options = this.teamLeadSelect.locator('option');
    const optionCount = await options.count();
    if (optionCount > 1) {
      const secondValue = await options.nth(1).getAttribute('value');
      if (secondValue) {
        await this.teamLeadSelect.selectOption(secondValue);
      }
    }

    await this.createTeamSubmit.click();
  }
}

module.exports = { TeamsPage };
