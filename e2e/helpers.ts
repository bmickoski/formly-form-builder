import { expect, type Page } from '@playwright/test';

export async function applyStarterLayout(page: Page, presetLabel?: string): Promise<void> {
  await clickTopbarMenuItem(page, 'Layout', presetLabel ?? 'Simple Form');
  const nativeDialogPromise = waitForNativeDialog(page);
  await confirmMaterialDialogIfPresent(page, 'Apply');
  await nativeDialogPromise;
  await expect(page.locator('.fb-canvas .fb-node-title').first()).toBeVisible();
}

export async function clearBuilder(page: Page): Promise<void> {
  await clickTopbarMenuItem(page, 'File', 'Clear canvas');
  const nativeDialogPromise = waitForNativeDialog(page);
  await confirmMaterialDialogIfPresent(page, 'Clear');
  await nativeDialogPromise;
}

export async function clickTopbarMenuItem(page: Page, menuLabel: string, itemLabel: string): Promise<void> {
  await page
    .locator('.fb-topbar')
    .getByRole('button', { name: new RegExp(menuLabel, 'i') })
    .click();
  await page.getByRole('menuitem', { name: new RegExp(itemLabel, 'i') }).click();
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
