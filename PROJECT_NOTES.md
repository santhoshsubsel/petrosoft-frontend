# PetroSoft UI implementation notes

The UI follows the supplied PetroSoft business flow and the supplied visual reference. Core flow represented in the navigation:
Login → role check → Dashboard → Account Setup / Customer / Product & Stock → Daily Sales → Petrol / Credit / Oil → Expenses → Cash Closure → Reports / Invoice.

The supplied business flow identifies Admin and Manager roles and requires responsive operational screens. The dashboard aggregates today's sales, product prices/quantities, tank status, vehicle stock and cash information. Cash closure presents expected cash, actual cash and excess/shortage.

Golden test values represented in the UI:
- Petroleum Sales: ₹14,41,219.86
- Oil Sales: ₹2,220.00
- Credit Sales: ₹5,22,198.57
- Expenses: ₹17,212.00
- Cash Sales: ₹9,04,029.29
- Credit Payments: ₹37,650.00
- Paytm: ₹4,11,121.00
- CCMS/HP Pay: ₹20,588.00
- Expected Cash: ₹5,09,970.29

This package is a frontend UI foundation. Replace mock data with the REST API service functions in `src/services/api.ts` and keep financial calculations in the backend calculation service, not React.
