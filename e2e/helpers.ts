import { expect, type Page } from '@playwright/test';

export async function applyStarterLayout(page: Page, presetLabel?: string): Promise<void> {
  if (presetLabel) {
    await page.locator('mat-form-field').filter({ hasText: 'Starter layout' }).click();
    await page.getByRole('option', { name: presetLabel }).click();
  }
  page.once('dialog', async (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Apply Layout' }).click();
  await expect(page.locator('.fb-canvas .fb-node-title').first()).toBeVisible();
}

export async function clearBuilder(page: Page): Promise<void> {
  page.once('dialog', async (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear' }).click();
}
