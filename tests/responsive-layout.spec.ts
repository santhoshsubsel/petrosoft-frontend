import { test, expect } from '@playwright/test';
import { installBusinessMocks, setAuthenticatedSession } from './fixtures/businessMocks';

const viewports = [375, 768];
const pages = [
  { name: 'admin reports', role: 'ADMIN' as const, path: '/reports', heading: 'Reports' },
  { name: 'manager cash closure', role: 'MANAGER' as const, path: '/cash-closure', heading: 'Cash Closure' },
];

test.describe('Responsive application layout', () => {
  for (const scenario of pages) {
    for (const width of viewports) {
      test(`${scenario.name} fits ${width}px viewport`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await installBusinessMocks(page, scenario.role);
        await setAuthenticatedSession(page, scenario.role);

        await page.goto(scenario.path);

        const heading = page.getByRole('heading', {
          name: scenario.heading,
          level: 1,
        });
        await expect(heading).toBeVisible();

        const box = await heading.boundingBox();
        expect(box?.y).toBeGreaterThanOrEqual(64);

        const documentWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(documentWidth).toBeLessThanOrEqual(width);
      });
    }
  }
});