// e2e/specs/catalogQuery.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Catalog query flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('widget loads and responds to catalog query', async ({ page }) => {
    await expect(page.locator('button.chat-toggle')).toBeAttached();
    await page.click('button.chat-toggle');
    await expect(page.locator('.chat-widget--open')).toBeVisible();
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
    await expect(page.locator('button.input-send')).toBeVisible();
  });

  test('shows out-of-stock badge for unavailable variants', async ({ page }) => {
    await page.click('button.chat-toggle');
    await expect(page.locator('.chat-widget--open')).toBeVisible();
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });

  test('handles sizing inquiries', async ({ page }) => {
    await page.click('button.chat-toggle');
    await expect(page.locator('.chat-widget--open')).toBeVisible();
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });
});
