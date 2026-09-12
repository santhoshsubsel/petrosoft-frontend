# PetroSoft UI

Modern responsive petrol-station management UI built with **Vite + React + TypeScript + Tailwind CSS + Zustand + Axios + React Router DOM + Lucide React + Recharts**.

## Included
- Admin / Manager role preview
- Responsive sidebar + topbar
- Dashboard with sales KPI cards, fuel table, tank status, sales trend and transactions
- Daily Sales Entry
- Credit / Customer Management
- Tank Management
- Add Stock / Products / Expenses placeholders ready for API wiring
- Cash Closure UI with expected vs actual cash
- Reports
- Account Setup
- User Management
- Axios API client with JWT token interceptor
- Zustand stores for auth and UI state

## Run
```bash
npm install
npm run dev
```

Default API base URL: `http://localhost:4000/api/v1`.
Set `VITE_API_BASE_URL` in `.env` for your backend.

## Suggested backend endpoints
The UI is structured around the PetroSoft business flow: `/auth/login`, `/account`, `/products`, `/tanks`, `/inventory/stock-in`, `/daily-sales`, `/credit-sales`, `/customers/:id/payments`, `/oil/invoices`, `/expenses`, `/daily-sales/:id/cash-closure`, and `/reports/*`.
