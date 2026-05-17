import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('capture DOM snapshot of widget', async ({ page }) => {
  const allMessages: string[] = [];
  page.on('console', msg => {
    allMessages.push(`[console:${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    allMessages.push(`[pageerror] ${err.message}`);
  });

  page.on('requestfailed', req => {
    allMessages.push(`[requestfailed] ${req.url()}`);
  });

  // Log all responses
  page.on('response', res => {
    if (res.status() >= 400) {
      allMessages.push(`[response:${res.status()}] ${res.url()}`);
    }
  });

  await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Click toggle to open the widget
  await page.click('.chat-toggle');
  await page.waitForTimeout(500);

  const domContent = await page.content();

  const outputPath = path.resolve(__dirname, '../../dom-snapshot.html');
  fs.writeFileSync(outputPath, domContent, 'utf-8');

  const errorPath = path.resolve(__dirname, '../../dom-errors.txt');
  fs.writeFileSync(errorPath, allMessages.join('\n'), 'utf-8');
  console.log('All messages:');
  allMessages.forEach(m => console.log(`  ${m}`));

  const screenshotPath = path.resolve(__dirname, '../../dom-screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`DOM snapshot saved to: ${outputPath}`);
});
