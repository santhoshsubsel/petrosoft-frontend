# PetroSoft Frontend - Layout Preserved Integration

This package is based directly on the supplied PetroSoft frontend source.

Changes are intentionally limited to:
- Preserve existing layout, sidebar, topbar, pages and color palette.
- Add AuthContext and UIContext for shared state.
- Add protected routing and API-backed authentication.
- Keep Admin/Manager visibility control in the existing sidebar.
- Connect existing pages to the backend endpoints that are present.
- Keep mock UI where the supplied backend does not expose a corresponding route.
- Normalize API objects before rendering to avoid React object-child errors.

Backend base URL:
VITE_API_BASE_URL=http://localhost:3000/api/v1
