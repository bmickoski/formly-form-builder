import { expect, test } from '@playwright/test';
import { applyStarterLayout } from './helpers';

test('loads app shell and canvas @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Search palette')).toBeVisible();
  await expect(page.getByText('Start building your form')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible();
});

test('can select a field and edit its label @smoke', async ({ page }) => {
  await page.goto('/');
  await applyStarterLayout(page);

  const firstFieldNode = page.locator('.fb-canvas .fb-node', { hasText: 'Field:' }).first();
  await expect(firstFieldNode).toBeVisible();
  await firstFieldNode.click();
  await page.getByLabel('Label').fill('Customer Name');
  await expect(page.locator('.fb-canvas .fb-node-title', { hasText: 'Customer Name' })).toBeVisible();
});

test('opens preview and renders starter layout fields @smoke', async ({ page }) => {
  await page.goto('/');
  await applyStarterLayout(page);
  await page.getByRole('button', { name: 'Preview' }).click();
  const previewDialog = page.locator('mat-dialog-container').last();
  await expect(previewDialog.locator('.fb-preview-dialog-title')).toBeVisible();
  await expect(previewDialog.getByRole('button', { name: 'Submit' })).toBeVisible();
  await previewDialog.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('mat-dialog-container .fb-preview-dialog-title')).toHaveCount(0);
});
