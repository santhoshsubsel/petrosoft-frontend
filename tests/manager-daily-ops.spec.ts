import { test, expect } from '@playwright/test';
import { installBusinessMocks, setAuthenticatedSession } from './fixtures/businessMocks';

const scenarios = [
  { name: 'track-sales', path: '/track-sales', heading: 'Track Petrol Sales', action: 'Add Stock' },
  { name: 'cash-closure', path: '/cash-closure', heading: 'Cash Closure', action: 'Submit Cash Closure for the Day' },
  { name: 'lubricant-sales', path: '/lubricant-sales', heading: 'Track Lubricant Oil Sales', action: 'Open cart' },
];

test.describe('Manager daily operations tests', () => {
  for (const scenario of scenarios) {
    test(`manager can open ${scenario.name}`, async ({ page }) => {
      await installBusinessMocks(page, 'MANAGER');
      await setAuthenticatedSession(page, 'MANAGER');

      await page.goto(scenario.path);

      await expect(page.getByRole('heading', { name: scenario.heading, level: 1 })).toBeVisible();
      await expect(page.getByRole('button', { name: new RegExp(scenario.action, 'i') })).toBeVisible();
    });
  }

  test('manager can open stock modal from quick action', async ({ page }) => {
    await installBusinessMocks(page, 'MANAGER');
    await setAuthenticatedSession(page, 'MANAGER');

    await page.goto('/track-sales');
    await page.getByRole('button', { name: /Add Stock/i }).click();

    await expect(page.getByRole('heading', { name: 'Add Stock' })).toBeVisible();
    await expect(page.getByLabel('Product')).toBeVisible();
    await expect(page.getByLabel('Tank')).toBeVisible();
  });

  test('manager can open expense modal from quick action', async ({ page }) => {
    await installBusinessMocks(page, 'MANAGER');
    await setAuthenticatedSession(page, 'MANAGER');

    await page.goto('/track-sales');
    await page.getByRole('button', { name: /Add Expense/i }).click();

    await expect(page.getByRole('heading', { name: 'Add Expense' })).toBeVisible();
    await expect(page.getByLabel('Expense Type')).toBeVisible();
    await expect(page.getByLabel('Amount')).toBeVisible();
  });
});
