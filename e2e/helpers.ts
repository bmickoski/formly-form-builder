import { expect, type Page } from '@playwright/test';

export async function applyStarterLayout(page: Page, presetLabel?: string): Promise<void> {
  if (presetLabel) {
    await page.locator('mat-form-field').filter({ hasText: 'Starter layout' }).click();
    await page.getByRole('option', { name: presetLabel }).click();
  }
  const nativeDialogPromise = waitForNativeDialog(page);
  await page.getByRole('button', { name: 'Apply Layout' }).click();
  await confirmMaterialDialogIfPresent(page, 'Apply');
  await nativeDialogPromise;
  await expect(page.locator('.fb-canvas .fb-node-title').first()).toBeVisible();
}

export async function clearBuilder(page: Page): Promise<void> {
  const nativeDialogPromise = waitForNativeDialog(page);
  await page.getByRole('button', { name: 'Clear' }).click();
  await confirmMaterialDialogIfPresent(page, 'Clear');
  await nativeDialogPromise;
}

async function waitForNativeDialog(page: Page): Promise<void> {
  try {
    const dialog = await page.waitForEvent('dialog', { timeout: 750 });
    await dialog.accept();
  } catch {
    // No native dialog shown; Material confirm dialog is used instead.
  }
}

async function confirmMaterialDialogIfPresent(page: Page, confirmButtonLabel: string): Promise<void> {
  const dialog = page.locator('mat-dialog-container').last();
  if (!(await dialog.isVisible({ timeout: 1500 }).catch(() => false))) return;
  await dialog.getByRole('button', { name: confirmButtonLabel }).click();
}
