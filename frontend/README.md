# Project Tracker Frontend

Frontend UI for the Project Tracker application.

- Vite and React with TypeScript
- React Bootstrap UI
- React Query for server state and caching
- React Hook Form with Yup validation
- Vitest testing
- ESLint and Prettier
- Feature based architecture

---

## Table of Contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Feature based architecture rules](#feature-based-architecture-rules)
- [API integration notes](#api-integration-notes)
- [Server state and caching](#server-state-and-caching)
- [Testing](#testing)
- [Linting and formatting](#linting-and-formatting)
- [Troubleshooting](#troubleshooting)
- [Conventions](#conventions)

---

## Tech stack

- React with Vite
- TypeScript
- React Router
- React Bootstrap
- React Query (`@tanstack/react-query`)
- React Hook Form and Yup
- Vitest and Testing Library
- ESLint and Prettier

---

## Prerequisites

- Node.js LTS recommended
- npm

---

## Setup

From `frontend/`:

```powershell
npm install
npm run dev
```

Build:

```powershell
npm run build
```

Preview:

```powershell
npm run preview
```

---

## Environment variables

Create `frontend/.env` or copy from `frontend/.env.example`.

Common variables:
- `VITE_API_BASE_URL` example `http://127.0.0.1:8000`
- `VITE_AUTH_MODE` values `local` or `cookie`

Example:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_AUTH_MODE=local
```

Notes:
- Vite only exposes environment variables prefixed with `VITE_`
- Restart the dev server after changing `.env`

---

## Scripts

Run these from `frontend/`:

- `npm run dev` start dev server
- `npm run build` build production bundle
- `npm run preview` preview production build
- `npm run test:run` run tests once
- `npm test` run tests in watch mode
- `npm run test:ui` run tests with UI
- `npm run lint` lint the codebase
- `npm run format` format with Prettier
- `npm run format:check` verify formatting

---

## Project structure

```text
src/
  features/
    about/
    auth/
    home/
    projects/
      create/
      edit/
      delete/
      models/
      shared/
  shared/
    api/
    http/
    layout/
    theme/
    types/
  __tests__/
```

---

## Feature based architecture rules

- Keep feature specific UI and logic inside `src/features/<feature>`
- Keep reusable shared code in `src/shared`
- Avoid dumping ground folders such as `src/components` unless tightly scoped
- Feature to shared imports are allowed
- Shared to feature imports are not allowed
- Avoid feature to feature imports unless there is a strong reason, and prefer extracting shared logic to `src/shared`

---

## API integration notes

Endpoints:
- `GET /api/project/` list projects (paginated — see query params below)
- `POST /api/project/` create project
- `GET /api/project/:id/` project detail
- `PUT /api/project/:id/` update project
- `PATCH /api/project/:id/` partial update
- `DELETE /api/project/:id/` delete project

Related lists (always return full list, no pagination):
- `GET /api/employees/`
- `GET /api/projectmanager/`

Project list query parameters:

| Parameter        | Example                    | Description                                         |
|------------------|----------------------------|-----------------------------------------------------|
| `page`           | `?page=2`                  | Page number (default: 1)                            |
| `page_size`      | `?page_size=25`            | Results per page (default: 50, max: 200)            |
| `search`         | `?search=alpha`            | Search name and comments (case-insensitive)         |
| `status`         | `?status=Active`           | Exact match on status                               |
| `security_level` | `?security_level=Internal` | Exact match on security level                       |
| `ordering`       | `?ordering=-start_date`    | Sort field, prefix with `-` for descending          |

Project payload:
- `name`
- `status` — one of `Active`, `On Hold`, `Completed`, `Cancelled`
- `comments`
- `projectmanager` — ID on writes, nested object on reads
- `employees` — list of IDs on writes, list of nested objects on reads
- `start_date` and `end_date` in `YYYY-MM-DD`
- `security_level` — one of `Public`, `Internal`, `Confidential`, `Restricted`

---

## Server state and caching

The app uses React Query (`@tanstack/react-query`) for all server state.

Key behaviours:
- Project list data is treated as fresh for 30 seconds globally. Navigating away and back does not re-spinner if data is still fresh.
- Manager and employee lookup data (used by form dropdowns) is cached for 5 minutes and shared across Create and Edit pages — opening one after the other does not fire duplicate requests.
- The project list refetches automatically when the window regains focus.
- Manual refresh (the Refresh button and post-delete) uses `queryClient.invalidateQueries` so the table stays visible while the background fetch runs.

Query key structure (defined in `project.api.ts`):
```ts
projectKeys.list(params)   // project list with current filter/sort/page params
projectKeys.detail(id)     // single project
lookupKeys.managers()      // manager dropdown data
lookupKeys.employees()     // employee dropdown data
```

React Query Devtools are included in development builds and appear in the bottom-left corner of the browser. They are tree-shaken out of production builds automatically.

---

## Testing

Run tests once:

```powershell
npm run test:run
```

Watch mode:

```powershell
npm test
```

General guidance:
- Prefer user visible behavior tests
- Keep tests focused and avoid duplication
- Update tests when payload mapping or form behavior changes

---

## Linting and formatting

Lint:

```powershell
npm run lint
```

Format:

```powershell
npm run format
```

Check formatting:

```powershell
npm run format:check
```

---

## Troubleshooting

Vite port differs:
- Vite defaults to 5173 unless configured in `vite.config.*`

API errors and CORS:
- Confirm `VITE_API_BASE_URL` points to the backend
- For cookie mode confirm backend CORS and CSRF configuration

ESLint TypeScript parsing errors:
- Install TypeScript ESLint packages
- Confirm `.eslintrc.cjs` uses the TypeScript parser

React Query `No QueryClient set` error:
- Confirm `QueryClientProvider` wraps the app in `main.tsx`
- Confirm `@tanstack/react-query` is installed (`npm install @tanstack/react-query @tanstack/react-query-devtools`)

---

## Conventions

- Keep code condensed where clean and readable
- Use descriptive comments that explain why and edge cases
- Maintain feature boundaries and avoid cross feature imports
- Update tests alongside production changes