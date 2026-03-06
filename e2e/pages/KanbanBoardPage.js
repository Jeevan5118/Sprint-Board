const { expect } = require('@playwright/test');

class KanbanBoardPage {
  constructor(page) {
    this.page = page;
    this.columns = page.locator('.board-column');
    this.cards = page.locator('[draggable="true"]');
  }

  async goto(projectId) {
    await this.page.goto(`/projects/${projectId}/kanban`);
    await expect(this.columns.first()).toBeVisible();
  }

  async dragFirstTaskToColumn(targetTitleRegex) {
    const source = this.cards.first();
    const target = this.columns.filter({ hasText: targetTitleRegex }).first();
    await expect(source).toBeVisible();
    await expect(target).toBeVisible();
    await source.dragTo(target);
  }
}

module.exports = { KanbanBoardPage };
