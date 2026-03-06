const { expect } = require('@playwright/test');

class LandingPage {
  constructor(page) {
    this.page = page;
    this.heroTitle = page.getByRole('heading', {
      name: /plan sprints, run kanban, and ship with confidence/i
    });
    this.signInLink = page.getByRole('link', { name: /sign in/i }).first();
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.heroTitle).toBeVisible();
  }
}

module.exports = { LandingPage };
