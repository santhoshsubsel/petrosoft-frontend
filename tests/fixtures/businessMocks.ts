import type { Page } from '@playwright/test';

export type Role = 'ADMIN' | 'MANAGER';

export const credentials = {
  ADMIN: {
    email: 'admin@petrosoft.com',
    password: 'Admin@123',
  },
  MANAGER: {
    email: 'manager@petrosoft.com',
    password: 'Manager@123',
  },
};

export const defaultBusinessData = {
  products: [
    { id: 'p1', name: 'Petrol', productType: 'PETROL', currentPrice: '104.50', active: true },
    { id: 'p2', name: 'Diesel', productType: 'DIESEL', currentPrice: '95.20', active: true },
    { id: 'oil-1', name: 'Engine Oil', productType: 'OIL', currentPrice: '420.00', active: true },
  ],
  tanks: [
    { id: 't1', name: 'Tank 1', productId: 'p1', capacity: 20000, minCapacity: 2000, availableStock: 8500, active: true },
    { id: 't2', name: 'Tank 2', productId: 'p2', capacity: 22000, minCapacity: 2500, availableStock: 9800, active: true },
  ],
  nozzles: [
    { id: 'n1', name: 'Nozzle 1', tankId: 't1', productId: 'p1', openingMeter: 12000, currentMeter: 12250, active: true },
    { id: 'n2', name: 'Nozzle 2', tankId: 't2', productId: 'p2', openingMeter: 15000, currentMeter: 15110, active: true },
  ],
  customers: [
    { id: 'c1', name: 'North Transport', phone: '9876543210', email: 'north@example.com', creditLimit: 250000, creditOutstanding: 40000, address: 'Coimbatore', active: true },
    { id: 'c2', name: 'Blue Star Motors', phone: '9123456780', email: 'blue@example.com', creditLimit: 180000, creditOutstanding: 20000, address: 'Salem', active: true },
  ],
  expenseTypes: [
    { id: 'e1', name: 'Maintenance', active: true },
    { id: 'e2', name: 'Staff', active: true },
  ],
  vehicles: [
    { id: 'v1', name: 'TN-01-AB-1234', vehicleNumber: 'TN-01-AB-1234', active: true },
    { id: 'v2', name: 'TN-02-CD-5678', vehicleNumber: 'TN-02-CD-5678', active: true },
  ],
  users: [
    { id: 'u1', name: 'Admin User', email: 'admin@petrosoft.com', status: 'ACTIVE', role: 'ADMIN' },
    { id: 'u2', name: 'Manager User', email: 'manager@petrosoft.com', status: 'ACTIVE', role: 'MANAGER' },
  ],
  account: {
    id: 'acc-1',
    accountName: 'RAJ AGENCIES',
    phone: '9876543210',
    logoUrl: '',
    billingStreet: 'Main Road',
    billingCity: 'Coimbatore',
    billingPostalCode: '641001',
    billingState: 'Tamil Nadu',
    billingCountry: 'India',
    enableCustomerEmail: true,
    enableWeeklyCreditReport: true,
    enableMonthlyCreditReport: true,
    enableCustomer: true,
    onlyAdmin: false,
    configureEmail: true,
  },
  dailySales: [
    { id: 'daily-1', businessDate: new Date().toISOString(), status: 'ACTIVE', totalAmount: 125000 },
  ],
  cashClosure: {
    id: 'closure-1',
    dailySalesId: 'daily-1',
    status: 'DRAFT',
    expectedCash: 335000,
    actualCashEntered: 340500,
    difference: 5500,
    cashReceipts: 12000,
    expenses: 15000,
  },
  reportTotals: {
    totals: {
      dailySales: 125000,
      expenses: 15000,
      creditSales: 42000,
      oilSales: 8600,
    },
    dailySales: [
      { businessDate: new Date().toISOString(), totalAmount: 125000, status: 'ACTIVE' },
    ],
  },
};

export async function installBusinessMocks(page: Page, role: Role = 'ADMIN', overrides: Partial<typeof defaultBusinessData> = {}) {
  const data = { ...defaultBusinessData, ...overrides };

  await page.route('**/api/v1/auth/login', async (route) => {
    const payload = route.request().postDataJSON();
    const email = String(payload?.email ?? '');
    const password = String(payload?.password ?? '');
    const expected = credentials[role];

    if (email === expected.email && password === expected.password) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: `mock-${role.toLowerCase()}-token`,
            user: {
              id: `${role.toLowerCase()}-user`,
              name: role === 'ADMIN' ? 'Admin User' : 'Manager User',
              email,
              role,
            },
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Invalid email or password.' }),
    });
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          userId: `${role.toLowerCase()}-user`,
          accountId: 'acc-1',
          roleId: `${role.toLowerCase()}-role`,
          role,
          email: credentials[role].email,
        },
      }),
    });
  });

  await page.route('**/api/v1/account**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.account }),
    });
  });

  await page.route('**/api/v1/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.users }),
    });
  });

  await page.route('**/api/v1/products**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.products }),
    });
  });

  await page.route('**/api/v1/oil-products**', async (route) => {
    const oilProducts = data.products
      .filter((product) => product.productType === 'OIL')
      .map((product) => ({
        ...product,
        accountId: 'acc-1',
        code: 'EO-001',
        unit: 'LITRE',
        minStock: 10,
      }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: oilProducts }),
    });
  });

  await page.route('**/api/v1/oil-sales**', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }

    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Oil sale created successfully',
          data: { id: 'oil-sale-1', status: 'COMPLETED' },
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/v1/tanks**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.tanks }),
    });
  });

  await page.route('**/api/v1/nozzles**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.nozzles }),
    });
  });

  await page.route('**/api/v1/customers**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.customers }),
    });
  });

  await page.route('**/api/v1/expense-types**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.expenseTypes }),
    });
  });

  await page.route('**/api/v1/vehicles**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.vehicles }),
    });
  });

  await page.route('**/api/v1/daily-sales**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const isDetail = pathname.split('/').filter(Boolean).length > 3;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: isDetail
          ? {
              ...data.dailySales[0],
              salesLines: [
                {
                  id: 'sale-line-1',
                  productId: 'p1',
                  unitPrice: 104.5,
                  quantity: 1196.17,
                  totalAmount: data.dailySales[0].totalAmount,
                  product: { id: 'p1', name: 'Petrol', productType: 'PETROL' },
                },
              ],
              meterReadings: [],
              oilInvoices: [],
            }
          : data.dailySales,
      }),
    });
  });

  await page.route('**/api/v1/reports/sales**', async (route) => {
    const url = route.request().url();
    if (url.includes('format=pdf')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4\n%mock binary\n%%EOF'),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: data.reportTotals }),
    });
  });

  await page.route('**/api/v1/cash-closure**', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [data.cashClosure] }),
      });
      return;
    }

    if (method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { ...data.cashClosure, status: 'DRAFT' } }),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/v1/cash-closure/preview/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          ...data.cashClosure,
          totalSales: data.dailySales[0].totalAmount,
          totalRevenue:
            Number(data.dailySales[0].totalAmount) +
            Number(data.reportTotals.totals.creditSales) +
            Number(data.reportTotals.totals.oilSales),
          oilSales: data.reportTotals.totals.oilSales,
          creditSales: data.reportTotals.totals.creditSales,
          expenses: data.reportTotals.totals.expenses,
          cashSales:
            Number(data.dailySales[0].totalAmount) +
            Number(data.reportTotals.totals.oilSales) -
            Number(data.reportTotals.totals.expenses),
          expectedCash: 335000,
          actualCashEntered: 340500,
          difference: 5500,
        },
      }),
    });
  });

  await page.route('**/api/v1/cash-closure/*/close', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { ...data.cashClosure, status: 'CLOSED' } }),
    });
  });

  await page.route('**/api/v1/credits**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Credit sale created successfully',
        data: { id: 'credit-1', status: 'OPEN' },
      }),
    });
  });

  await page.route('**/api/v1/expenses**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { id: 'expense-1', status: 'OK' } }),
    });
  });

  await page.route('**/api/v1/inventory/vehicle-stock', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { id: 'vehicle-stock-1', status: 'OK' } }),
    });
  });

  await page.route('**/api/v1/inventory/sample-readings', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { id: 'sample-1', status: 'OK' } }),
    });
  });
}

export async function loginAs(page: Page, role: Role) {
  const { email, password } = credentials[role];

  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Enter email or username' }).fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/dashboard/);
}

export async function setAuthenticatedSession(page: Page, role: Role) {
  const { email } = credentials[role];
  const payload = {
    id: `${role.toLowerCase()}-user`,
    name: role === 'ADMIN' ? 'Admin User' : 'Manager User',
    email,
    role,
  };

  const cookieOptions = {
    url: 'http://localhost:5173',
    sameSite: 'Lax' as const,
  };

  await page.context().addCookies([
    {
      ...cookieOptions,
      name: 'petrosoft_token',
      value: `mock-${role.toLowerCase()}-token`,
    },
    {
      ...cookieOptions,
      name: 'petrosoft_user',
      value: encodeURIComponent(JSON.stringify(payload)),
    },
  ]);
}

export const businessScenarios = [
  { name: 'admin-account', path: '/account', heading: 'Account Setup' },
  { name: 'admin-users', path: '/users', heading: 'User Management' },
  { name: 'admin-reports', path: '/reports', heading: 'Reports' },
  { name: 'manager-track-sales', path: '/track-sales', heading: 'Track Petrol Sales' },
  { name: 'manager-cash-closure', path: '/cash-closure', heading: 'Cash Closure' },
  { name: 'manager-lubricant-sales', path: '/lubricant-sales', heading: 'Lubricant Sales' },
];
