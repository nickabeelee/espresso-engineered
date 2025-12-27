# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: SvelteKit UI (TypeScript). Routes in `frontend/src/routes`, reusable components/services in `frontend/src/lib`.
- `backend/`: Fastify API (TypeScript). Source in `backend/src`, config in `backend/.env`, tests in `backend/`.
- `shared/`: Shared TypeScript types (`shared/types`) used across frontend/backend.
- `supabase/`: Schema reference and migrations (`supabase/migrations`). RLS is required on all tables.
- `docs/`: Architecture, data model, and system definition.
- `.kiro/`: Product/tech/structure guidance and specs (authoritative for scope and workflow).

## Build, Test, and Development Commands
From repo root:
- `npm run dev:frontend`: Start SvelteKit dev server.
- `npm run dev:backend`: Start Fastify API on port `8080`.
- `npm run build:all`: Build shared, backend, and frontend.
- `npm run test:all`: Run all tests.
- `npm run test:frontend` / `npm run test:backend` / `npm run test:shared`: Package-specific tests.

## Coding Style & Naming Conventions
- TypeScript everywhere; follow existing file patterns and formatting.
- Use lowerCamelCase for variables/functions and UpperCamelCase for types/classes.
- Svelte components and stores should stay lightweight; keep auth/session state in `frontend/src/lib`.

## UI Component Standards
- **Chips**: Always use the standardized `Chip` component with semantic variants (neutral, accent, success, warning, error). Never create custom chip styles. Choose variants based on meaning: neutral for general info, accent for personal highlights, success for positive status, warning for cautionary states, error for negative status. See `docs/ee-ui-execution-standard.md` section 8 for complete chip standards.
- **Icon Buttons**: Follow the standard color tokens (neutral, accent, warning, error, success) as defined in the UI execution standard.

## Auth & Data Access (Important)
- Supabase Auth issues JWTs; app logic uses `barista` as the user model.
- `barista.id` maps 1:1 with `auth.users.id` (no direct `auth.users` queries in app logic).
- Enforce RLS for all tables; policies should reference `auth.uid()` and `barista.id`.

## Admin Endpoint Usage Pattern
- The backend provides two sets of endpoints for entity operations:
  - **Regular endpoints** (e.g., `/api/bags/:id`) - enforce ownership/permission rules
  - **Admin endpoints** (e.g., `/api/admin/bags/:id`) - bypass ownership for admin operations
- **Frontend Implementation Pattern**: When implementing admin functionality, check both admin status and ownership:
  ```typescript
  const isAdmin = $barista?.is_admin === true;
  const isOwner = entity.owner_id === $barista?.id;
  
  if (isAdmin && !isOwner) {
    // Use adminService.updateEntity() - calls /api/admin/entity/:id
    response = await adminService.updateEntity(id, data);
  } else {
    // Use apiClient.updateEntity() - calls /api/entity/:id  
    response = await apiClient.updateEntity(id, data);
  }
  ```
- **Key Principle**: Admins should seamlessly edit any entity without permission errors, while regular users are restricted to their own entities.

## Testing Guidelines
- Frontend: Vitest (`frontend/src/**/*.test.ts`).
- Backend: Jest (`backend/jest.config.js`).
- Property-based tests use `fast-check` (see spec guidance).
- Name tests `*.test.ts` and colocate near the code they validate.

## Commit & Pull Request Guidelines
- Use short, imperative commit messages (e.g., “Stabilize auth redirects…”).
- Workflow: feature branches → `main` (per tech steering).
- PRs should include a brief summary, tests run (or “not run”), and UI screenshots when relevant.

## Security & Configuration Tips
- Keep secrets in `.env` files; commit only `.env.example` templates.
- Apply Supabase migrations in `supabase/migrations` before testing auth or data changes.
- Offline drafts and sync behavior are core requirements—avoid breaking local storage flows.
