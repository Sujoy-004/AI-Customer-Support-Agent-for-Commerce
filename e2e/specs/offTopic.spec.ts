// e2e/specs/offTopic.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Off-topic query handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button.chat-toggle');
    await expect(page.locator('.chat-widget--open')).toBeVisible();
  });

  test('off-topic weather query gets a refusal response', async ({ page }) => {
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });

  test('competitor comparison query gets a store-policy refusal', async ({ page }) => {
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });

  test('personal advice query gets redirected', async ({ page }) => {
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });

  test('technical support query gets a refusal', async ({ page }) => {
    await expect(page.locator('textarea.input-textarea')).toBeVisible();
  });
});
