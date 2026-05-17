// e2e/specs/offTopic.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Off-topic query handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button.chat-toggle');
    await expect(page.locator('.chat-widget--open')).toBeVisible();
  });

  test('off-topic weather query gets a refusal response', async ({ page }) => {
    await page.fill('textarea.chat-input__textarea', 'what is the weather like today');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');

    // The refusal service should say it only helps with store-related questions
    const text = await bubbleContent.textContent();
    expect(text).toMatch(/store|product|policy/i);
  });

  test('competitor comparison query gets a store-policy refusal', async ({ page }) => {
    await page.fill('textarea.chat-input__textarea', 'how do your prices compare to amazon');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    const text = await bubbleContent.textContent();
    expect(text).toMatch(/only provide|our store|competitor/i);
  });

  test('personal advice query gets redirected', async ({ page }) => {
    await page.fill('textarea.chat-input__textarea', 'i need some relationship advice');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    const text = await bubbleContent.textContent();
    expect(text).toMatch(/personal advice|product|feature/i);
  });

  test('technical support query gets a refusal', async ({ page }) => {
    await page.fill('textarea.chat-input__textarea', 'my computer is broken');
    await page.click('button.chat-input__send');

    await expect(page.locator('.chat-bubble--agent')).toBeVisible({ timeout: 10000 });
    const bubbleContent = page.locator('.chat-bubble--agent .chat-bubble__content');
    const text = await bubbleContent.textContent();
    expect(text).toMatch(/technical support|store inquiry|device/i);
  });
});
