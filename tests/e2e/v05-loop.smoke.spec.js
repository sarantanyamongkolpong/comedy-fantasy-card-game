import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

const index = join(process.cwd(), 'web', 'index.html');

test.skip(!existsSync(index), 'web/ not present');

test('QA-10 landscape Deck to Battle to Rewards', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`file://${index}`);
  await expect(page.getByTestId('rotate-overlay')).toBeHidden();
  await page.getByTestId('nav-deck').click();
  await page.getByTestId('deck-confirm').click();
  await page.getByTestId('nav-battle').click();
  await page.getByTestId('end-turn').click();
  await page.getByTestId('nav-rewards').click();
  await expect(page.getByTestId('rewards-panel')).toBeVisible();
});
