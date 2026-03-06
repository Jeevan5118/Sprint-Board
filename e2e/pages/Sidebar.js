const { expect } = require('@playwright/test');

class Sidebar {
  constructor(page) {
    this.page = page;
    this.container = page.locator('.sidebar');
  }

  link(name) {
    return this.page.getByRole('link', { name: new RegExp(name, 'i') });
  }

  async click(name) {
    await this.link(name).click();
  }

  async expectVisible() {
    await expect(this.container).toBeVisible();
  }
}

module.exports = { Sidebar };
