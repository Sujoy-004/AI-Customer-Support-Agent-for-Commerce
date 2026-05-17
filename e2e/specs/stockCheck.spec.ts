// e2e/specs/stockCheck.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Stock check queries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button.chat-toggle');
    await expect(page.locator('.chat-widget--open')).toBeVisible();
  });

  test('stock query shows availability badge for in-stock variant', async ({ page }) => {
    await page.fill('textarea.chat-input__textarea', 'classic hoodie medium black cotton');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    const text = await bubbleContent.textContent();

    // Medium Black Cotton has 25 units — should show in-stock badge
    expect(text).toContain('Classic Hoodie');
    expect(text).toContain('In Stock');
  });

  test('stock query shows low stock warning', async ({ page }) => {
    await page.fill('textarea.chat-input__textarea', 'wool scarf gray wool');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    const text = await bubbleContent.textContent();

    // Gray Wool has 4 units — low stock
    expect(text).toContain('Only');
    expect(text).toContain('left');
  });

  test('stock query shows out of stock for unavailable variant', async ({ page }) => {
    await page.fill('textarea.chat-input__textarea', 'denim jacket small black');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    const text = await bubbleContent.textContent();

    // S Black has quantity 0, available false
    expect(text).toContain('Denim Jacket');
    expect(text).toContain('Out of Stock');
  });

  test('product-only query shows stock summary', async ({ page }) => {
    await page.fill('textarea.chat-input__textarea', 'tell me about the classic hoodie');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    const text = await bubbleContent.textContent();

    expect(text).toContain('Stock');
    expect(text).toContain('variants');
  });
});
