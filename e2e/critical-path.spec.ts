import { expect, test } from '@playwright/test';
import { applyStarterLayout, clearBuilder } from './helpers';

test('exports valid formly json @critical', async ({ page }) => {
  await page.goto('/');
  await applyStarterLayout(page);

  await page.getByRole('button', { name: 'Export Formly JSON' }).click();
  const jsonArea = page.locator('textarea');
  await expect(jsonArea).toBeVisible();
  const value = await jsonArea.inputValue();
  const parsed = JSON.parse(value);
  expect(Array.isArray(parsed)).toBeTruthy();
  expect(value).toContain('"props"');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(jsonArea).toHaveCount(0);
});

test('builder json round-trip import restores layout @critical', async ({ page }) => {
  await page.goto('/');
  await applyStarterLayout(page);
  const titlesBefore = await page.locator('.fb-canvas .fb-node-title').count();
  expect(titlesBefore).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Export Builder JSON' }).click();
  const exportArea = page.locator('textarea');
  await expect(exportArea).toBeVisible();
  const builderJson = await exportArea.inputValue();
  expect(builderJson).toContain('"rootId"');
  await page.getByRole('button', { name: 'Done' }).click();

  await clearBuilder(page);
  await expect(page.locator('.fb-canvas .fb-node-title')).toHaveCount(0);

  await page.getByRole('button', { name: 'Import Builder JSON' }).click();
  const importArea = page.locator('textarea');
  await importArea.fill(builderJson);
  await page.getByRole('button', { name: 'Import', exact: true }).click();

  await expect(page.locator('.fb-canvas .fb-node-title')).toHaveCount(titlesBefore);
});

test('switch renderer to bootstrap and preview uses bootstrap mode @critical', async ({ page }) => {
  await page.goto('/');
  await applyStarterLayout(page);

  await page.locator('mat-form-field').filter({ hasText: 'Preview UI' }).click();
  await page.getByRole('option', { name: 'Bootstrap' }).click();

  await page.getByRole('button', { name: 'Preview' }).click();
  const previewDialog = page.locator('mat-dialog-container');
  await expect(previewDialog.getByText('(Bootstrap)')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
});
