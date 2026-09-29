# PetroSoft Frontend Implementation Notes

## Completed
- Preserved the existing PetroSoft layout direction, sidebar width, dark navy navigation, blue brand palette and responsive breakpoints.
- Replaced page-level mock data with Axios-backed REST service calls for the operational screens.
- Added reusable UI components for page headers, loading/error/empty states, search toolbars, status badges and role gates.
- Added `AuthContext` for authenticated user/role sharing and `UIContext` for sidebar state sharing.
- Added route-level RBAC: Admin-only Account Setup and User Management; Manager sees operational screens only.
- Added a generic resource service to normalize common `{ success, data }`, `{ data }`, array, `items` and `results` API response shapes.
- Kept financial calculations backend-driven; the frontend only renders values returned by APIs.
- Account Setup now reads/writes account data and loads Products, Tanks and Nozzles from the API instead of local mock arrays.
- Logo upload remains Base64 and is sent through the Account API, with a 2 MB frontend limit.

## Config
Set `VITE_API_BASE_URL` in `.env` to the backend API root, for example:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Backend responsibility
Frontend role visibility is for UX only. The backend must continue to enforce JWT authentication and permission checks for every protected endpoint.

## Endpoint assumptions
The UI uses the PetroSoft route structure already established in the project: `/auth/login`, `/account`, `/users`, `/products`, `/tanks`, `/nozzles`, `/daily-sales`, `/credit`, `/customers`, `/inventory`, `/expenses`, `/cash-closure`, `/oil-sales`, and `/reports`.
