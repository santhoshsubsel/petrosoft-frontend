import { test, expect } from '@playwright/test';
import { installBusinessMocks, setAuthenticatedSession } from './fixtures/businessMocks';

test.describe('Admin module tests', () => {
  test('admin account setup loads', async ({ page }) => {
    await installBusinessMocks(page, 'ADMIN');
    await setAuthenticatedSession(page, 'ADMIN');

    await page.goto('/account');

    await expect(page.getByRole('heading', { name: 'Account Setup' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' }).first()).toBeVisible();
  });

  test('admin user management loads and shows users', async ({ page }) => {
    await installBusinessMocks(page, 'ADMIN');
    await setAuthenticatedSession(page, 'ADMIN');

    await page.goto('/users');

    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Admin User' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Manager User' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'manager@petrosoft.com' })).toBeVisible();
  });

  test('admin reports page loads and accepts report configuration', async ({ page }) => {
    await installBusinessMocks(page, 'ADMIN');
    await setAuthenticatedSession(page, 'ADMIN');

    await page.goto('/reports');

    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
    await page.locator('select').nth(0).selectOption('/reports/sales');
    await page.locator('select').nth(1).selectOption('daily');
    await page.getByLabel('Date').fill('2026-10-06');
    await page.getByRole('button', { name: /Generate/i }).click();

    await expect(page.getByText('Report generated successfully.')).toBeVisible();
  });
});
