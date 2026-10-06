import { test, expect, type Page } from '@playwright/test';

type Role = 'ADMIN' | 'MANAGER';

const ADMIN_EMAIL = 'admin@petrosoft.com';
const ADMIN_PASSWORD = 'Admin@123';
const MANAGER_EMAIL = 'manager@petrosoft.com';
const MANAGER_PASSWORD = 'Manager@123';

async function mockPetroSoftApi(page: Page, role: Role) {
  await page.route('**/api/v1/auth/login', async (route) => {
    const payload = route.request().postDataJSON();
    const email = String(payload?.email ?? '');
    const password = String(payload?.password ?? '');

    if (role === 'ADMIN' && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock-admin-token',
            user: {
              id: 'admin-user-1',
              name: 'Admin User',
              email: ADMIN_EMAIL,
              role: 'ADMIN',
            },
          },
        }),
      });
      return;
    }

    if (role === 'MANAGER' && email === MANAGER_EMAIL && password === MANAGER_PASSWORD) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock-manager-token',
            user: {
              id: 'manager-user-1',
              name: 'Manager User',
              email: MANAGER_EMAIL,
              role: 'MANAGER',
            },
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Invalid email or password.',
      }),
    });
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          userId: role === 'ADMIN' ? 'admin-user-1' : 'manager-user-1',
          accountId: 'account-1',
          roleId: role === 'ADMIN' ? 'admin-role' : 'manager-role',
          role,
          email: role === 'ADMIN' ? ADMIN_EMAIL : MANAGER_EMAIL,
        },
      }),
    });
  });

  await page.route('**/api/v1/reports/sales**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        totals: {
          dailySales: 125000,
          expenses: 12000,
          creditSales: 35000,
          oilSales: 8000,
        },
        dailySales: [
          { businessDate: new Date().toISOString(), totalAmount: 125000, status: 'ACTIVE' },
        ],
      }),
    });
  });

  await page.route('**/api/v1/products**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 'p1', name: 'Petrol', productType: 'PETROL', currentPrice: 104.5, active: true },
          { id: 'p2', name: 'Diesel', productType: 'DIESEL', currentPrice: 95.3, active: true },
        ],
      }),
    });
  });

  await page.route('**/api/v1/tanks**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 't1', name: 'Tank 1', productId: 'p1', capacity: 20000, minCapacity: 2000, available: 8200, active: true },
          { id: 't2', name: 'Tank 2', productId: 'p2', capacity: 22000, minCapacity: 2500, available: 9300, active: true },
        ],
      }),
    });
  });

  await page.route('**/api/v1/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 'u1', name: 'Admin User', email: ADMIN_EMAIL, status: 'ACTIVE', role: 'ADMIN' },
          { id: 'u2', name: 'Manager User', email: MANAGER_EMAIL, status: 'ACTIVE', role: 'MANAGER' },
        ],
      }),
    });
  });

  await page.route('**/api/v1/daily-sales**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ id: 'daily-1', businessDate: new Date().toISOString(), status: 'ACTIVE' }],
      }),
    });
  });
}

test.describe('PetroSoft authentication and access control', () => {
  test('admin can login and land on dashboard', async ({ page }) => {
    await mockPetroSoftApi(page, 'ADMIN');

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Enter email or username' }).fill(ADMIN_EMAIL);
    await page.getByPlaceholder('Enter your password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('manager can login and land on dashboard', async ({ page }) => {
    await mockPetroSoftApi(page, 'MANAGER');

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Enter email or username' }).fill(MANAGER_EMAIL);
    await page.getByPlaceholder('Enter your password').fill(MANAGER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('invalid credentials show the auth error state', async ({ page }) => {
    await mockPetroSoftApi(page, 'ADMIN');

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Enter email or username' }).fill('wrong@petrosoft.com');
    await page.getByPlaceholder('Enter your password').fill('WrongPass!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('guest user is redirected away from protected routes', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('manager cannot access admin-only user management route', async ({ page }) => {
    await mockPetroSoftApi(page, 'MANAGER');

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Enter email or username' }).fill(MANAGER_EMAIL);
    await page.getByPlaceholder('Enter your password').fill(MANAGER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.goto('/users');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('admin can access user management route', async ({ page }) => {
    await mockPetroSoftApi(page, 'ADMIN');

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Enter email or username' }).fill(ADMIN_EMAIL);
    await page.getByPlaceholder('Enter your password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.goto('/users');
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  });

  test.fixme('logout clears the session and returns to login', async ({ page }) => {
    await mockPetroSoftApi(page, 'ADMIN');

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Enter email or username' }).fill(ADMIN_EMAIL);
    await page.getByPlaceholder('Enter your password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await page.locator('button[title="Logout"]').click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });
});
