import { test, expect } from '@playwright/test';
import { installBusinessMocks, setAuthenticatedSession } from './fixtures/businessMocks';

test.describe('Reports and cash closure E2E flow', () => {
  test('admin can generate a daily sales PDF report', async ({ page }) => {
    await installBusinessMocks(page, 'ADMIN');
    await setAuthenticatedSession(page, 'ADMIN');

    await page.goto('/reports');
    await page.locator('select').nth(0).selectOption('/reports/sales');
    await page.locator('select').nth(1).selectOption('daily');
    await page.getByLabel('Date').fill('2026-10-06');
    await page.getByRole('button', { name: /Generate/i }).click();

    await expect(page.getByText('Report generated successfully.')).toBeVisible();
  });

  test('manager can open cash closure form and submit a closure', async ({ page }) => {
    await installBusinessMocks(page, 'MANAGER');
    await setAuthenticatedSession(page, 'MANAGER');

    await page.goto('/cash-closure');
    await expect(page.getByRole('heading', { name: 'Cash Closure', level: 1 })).toBeVisible();
    await expect(page.getByText('Total Revenue', { exact: true })).toBeVisible();
    await expect(page.getByText('₹1,75,600.00').first()).toBeVisible();

    await page.getByLabel('Starting Balance').fill('15000');
    await page.getByLabel('Paytm Transaction').fill('12000');
    await page.getByLabel('CCMS/HP Pay').fill('8000');
    await page.getByLabel('Bank Transfer | Payments | Other Payouts').fill('2500');
    await page.getByLabel('Petrol Supplier Bank Account').fill('3000');
    await page.getByLabel('Total Available Cash').fill('345000');
    await page.getByLabel('Comments (optional)').fill('Day closed by automated test');

    await page.getByRole('button', { name: /Submit Cash Closure for the Day/i }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Cash Closure' })).toBeVisible();
    await page.getByRole('button', { name: /Confirm & Close Day/i }).click();

    await expect(page.getByRole('status')).toContainText('Business day closed successfully.');
  });
});
