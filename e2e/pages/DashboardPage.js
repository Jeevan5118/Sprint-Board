const { expect } = require('@playwright/test');

class DashboardPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /dashboard/i });
    this.navbar = page.locator('.navbar');
    this.dashboardCards = page.locator('.dashboard-card');
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.navbar).toBeVisible();
  }
}

module.exports = { DashboardPage };
