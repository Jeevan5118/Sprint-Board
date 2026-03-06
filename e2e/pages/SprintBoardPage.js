const { expect } = require('@playwright/test');

class SprintBoardPage {
  constructor(page) {
    this.page = page;
    this.boardColumns = page.locator('.board-column');
    this.issueCards = page.locator('.board-task-card, [draggable="true"]');
  }

  async goto(projectId, sprintId) {
    await this.page.goto(`/projects/${projectId}/sprints/${sprintId}/board`);
    await expect(this.boardColumns.first()).toBeVisible();
  }

  async dragFirstTaskToColumn(targetTitleRegex) {
    const source = this.issueCards.first();
    const targetColumn = this.page
      .locator('.board-column')
      .filter({ hasText: targetTitleRegex })
      .first();
    await expect(source).toBeVisible();
    await expect(targetColumn).toBeVisible();
    await source.dragTo(targetColumn);
  }
}

module.exports = { SprintBoardPage };
