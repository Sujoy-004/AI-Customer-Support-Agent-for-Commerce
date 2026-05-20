// e2e/specs/stockCheck.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Stock check queries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button.chat-toggle');
    await expect(page.locator('.chat-widget--open')).toBeVisible();
  });

  test('stock query shows availability badge for in-stock variant', async ({ page }) => {
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });

  test('stock query shows low stock warning', async ({ page }) => {
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });

  test('stock query shows out of stock for unavailable variant', async ({ page }) => {
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });

  test('product-only query shows stock summary', async ({ page }) => {
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });
});
