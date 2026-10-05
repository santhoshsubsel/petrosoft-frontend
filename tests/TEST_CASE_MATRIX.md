# PetroSoft Playwright Test Case Matrix

## Scope
This matrix reflects the actual source code in the project, including the route guards, role checks, and session handling used by the frontend.

## Authentication tests

| ID | Role | Module | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-AUTH-001 | Admin | Login | Valid admin credentials available | Open login page, enter admin email and password, click Sign In | Login succeeds, redirect to dashboard, session created |
| TC-AUTH-002 | Manager | Login | Valid manager credentials available | Open login page, enter manager email and password, click Sign In | Login succeeds, redirect to dashboard |
| TC-AUTH-003 | All | Login | Invalid password | Enter valid email but wrong password | Error message shown, user stays on login |
| TC-AUTH-004 | All | Login | Empty fields | Submit empty form | Inline validation message shown |
| TC-AUTH-005 | All | Protected route | No authenticated session | Open /dashboard or /users directly | Redirect to /login |
| TC-AUTH-006 | All | Session | Valid user session | Login and reload page | Session state restores without re-login |
| TC-AUTH-007 | All | Logout | Authenticated session | Click Logout | Session cleared, redirected to login |

## Role access tests

| ID | Role | Module | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ROLE-001 | Admin | Access | Admin session | Navigate to /users | User Management page loads |
| TC-ROLE-002 | Manager | Access | Manager session | Navigate to /users | Redirect to /dashboard |
| TC-ROLE-003 | Manager | Access | Manager session | Navigate to /track-sales | Manager sales page loads |
| TC-ROLE-004 | Admin | Access | Admin session | Navigate to /track-sales | Redirect to /dashboard |

## Admin tests

| ID | Role | Module | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-ADMIN-001 | Admin | Dashboard | Admin session | Open dashboard | Dashboard loads with revenue summary and product/tank cards |
| TC-ADMIN-002 | Admin | Users | Admin session | Open User Management | Users list or empty state is visible |
| TC-ADMIN-003 | Admin | Reports | Admin session | Open Reports page | Report generator form loads |
| TC-ADMIN-004 | Admin | Navigation | Admin session | Inspect sidebar | Admin navigation items visible |

## Manager tests

| ID | Role | Module | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-MGR-001 | Manager | Dashboard | Manager session | Open dashboard | Dashboard loads |
| TC-MGR-002 | Manager | Navigation | Manager session | Inspect sidebar | Manager-only routes visible and admin-only routes hidden |
| TC-MGR-003 | Manager | Daily sales | Manager session | Open Daily Sales route | Daily sales page loads |
| TC-MGR-004 | Manager | Cash closure | Manager session | Open Cash Closure route | Closure page loads |
| TC-MGR-005 | Manager | Track sales | Manager session | Open Track Petrol Sales | Manager sales screen appears |
| TC-MGR-006 | Manager | Oil sales | Manager session | Open Lubricant Oil Sales | Sales page loads |

## Validation & negative tests

| ID | Role | Module | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| TC-VAL-001 | All | Login validation | No login attempt | Leave email/password empty | Required validation shown |
| TC-VAL-002 | All | Login validation | Invalid credentials | Submit wrong username/password | Auth error message shown |
| TC-VAL-003 | Admin | Route validation | Manager session | Direct URL access to /users | Redirect to /dashboard |
| TC-VAL-004 | Manager | Route validation | Admin session | Direct URL access to /track-sales | Redirect to /dashboard |

## Notes
- The project uses localStorage-based session storage via AuthContext.
- Role enforcement is implemented by ProtectedRoute and RoleRoute.
- Actual business forms and calculations are implemented in manager/account pages and should be validated by UI-level or network-aware E2E tests.
- Because the frontend expects a backend API at http://localhost:3000/api/v1, the Playwright tests use route interception to emulate the backend for deterministic execution in local dev/test environments.

