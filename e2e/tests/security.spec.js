const { test, expect } = require('@playwright/test');

test.describe('Security Testing', () => {
  test('Redirect to login when accessing protected admin page without auth', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });
});
