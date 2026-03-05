# Project Tracker Frontend

Frontend UI for the Project Tracker application.

- Vite and React with TypeScript
- React Bootstrap UI
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

The frontend expects endpoints similar to:
- `GET /api/projects/`
- `POST /api/projects/`
- `GET /api/projects/:id/`
- `PUT /api/projects/:id/`
- `DELETE /api/projects/:id/`

Related lists:
- `GET /api/employees/`
- `GET /api/projectmanagers/`

Project payload includes:
- `name`
- `status`
- `comments`
- `projectmanager` id
- `employees` list of ids
- `start_date` and `end_date` in `YYYY-MM-DD`
- `security_level` one of `Public`, `Internal`, `Confidential`, `Restricted`

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

---

## Conventions

- Keep code condensed where clean and readable
- Use descriptive comments that explain why and edge cases
- Maintain feature boundaries and avoid cross feature imports
- Update tests alongside production changes
