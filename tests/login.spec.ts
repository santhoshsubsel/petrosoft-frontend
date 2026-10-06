import { test, expect } from '@playwright/test';
import { installBusinessMocks, loginAs } from './fixtures/businessMocks';

test('PetroSoft login test', async ({ page }) => {
  await installBusinessMocks(page, 'ADMIN');
  await loginAs(page, 'ADMIN');

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});