import { expect, type Page } from '@playwright/test';

export async function applyStarterLayout(page: Page): Promise<void> {
  page.once('dialog', async (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Apply Layout' }).click();
  await expect(page.locator('.fb-canvas .fb-node-title').first()).toBeVisible();
}

export async function clearBuilder(page: Page): Promise<void> {
  page.once('dialog', async (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear' }).click();
}
