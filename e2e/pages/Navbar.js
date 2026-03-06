const { expect } = require('@playwright/test');

class Navbar {
  constructor(page) {
    this.page = page;
    this.container = page.locator('.navbar');
    this.logoutButton = page.getByRole('button', { name: /logout/i });
  }

  async expectVisible() {
    await expect(this.container).toBeVisible();
  }

  async logout() {
    await this.logoutButton.click();
  }
}

module.exports = { Navbar };
