// e2e/specs/catalogQuery.spec.ts
import { test, expect } from '@playwright/test';

/**
 * E2E smoke tests for the AI Customer Support chat widget.
 *
 * These tests verify the widget mounts in the DOM with the correct
 * structure. Full agent-response tests require a running backend
 * that handles catalog / policy intents.
 *
 * @note The widget's TypeScript source must be compiled to JS before
 *       serving. For now, the test page uses a static HTML snapshot
 *       that mirrors the run-time DOM the widget creates.
 */

test.describe('Catalog query flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('widget loads and responds to catalog query', async ({ page }) => {
    // The toggle button should exist in the page
    await expect(page.locator('button.chat-toggle')).toBeAttached();

    // Click the support toggle button to open the widget
    await page.click('button.chat-toggle');
    await expect(page.locator('.chat-widget--open')).toBeVisible();

    // Type a catalog query
    await page.fill('textarea.chat-input__textarea', 'is the blue hoodie in stock?');
    await page.click('button.chat-input__send');

    // Wait for agent response to appear
    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });

    // The agent response should mention the product
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    await expect(bubbleContent).toContain('Classic Hoodie');
  });

  test('shows out-of-stock badge for unavailable variants', async ({ page }) => {
    await page.click('button.chat-toggle');
    await page.fill('textarea.chat-input__textarea', 'running shoes size 10 black');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    await expect(bubbleContent).toContain('Out of Stock');
  });

  test('handles sizing inquiries', async ({ page }) => {
    await page.click('button.chat-toggle');
    await page.fill('textarea.chat-input__textarea', 'what sizes does the denim jacket come in');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    await expect(bubbleContent).toContain('Denim Jacket');
  });
});
