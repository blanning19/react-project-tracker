# Project Tracker (Django + DRF + Vite/React)

Full-stack Project Tracker application:

- `backend/`: Django + DRF API (PostgreSQL) — see `backend/README.md`
- `frontend/`: Vite/React UI — see `frontend/README.md`

This repo uses a **feature-based frontend architecture** (`src/features/*` + `src/shared/*`) with a Controller/View pattern to keep logic and rendering cleanly separated. See [`docs/architecture.md`](docs/architecture.md) for a full breakdown.

---

## Quick Start (Local Dev)

### 1) PostgreSQL

Create a database and user (example values match `backend/.env.example`):

- DB: `myappdb`
- User: `postgres`
- Password: `admin`

### 2) Backend

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# create/update tables
python manage.py migrate

# create an admin user (optional)
python manage.py createsuperuser

python manage.py runserver
```

Environment variables:
- Copy `backend/.env.example` to `backend/.env` and edit values as needed.
- `DJANGO_DEBUG=1` enables dev mode.

### 3) Frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

Environment variables:
- Copy `frontend/.env.example` to `frontend/.env` (or edit existing) and set:
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
  - `VITE_AUTH_MODE=local` (default) or `cookie` (best-practice option)

---

## Common Commands

### Backend (`backend/`)

```powershell
# Run the API
python manage.py runserver

# Apply migrations
python manage.py migrate

# Run tests
pytest
```

### Frontend (`frontend/`)

```powershell
# Run the UI
npm run dev

# Run tests
npm run test:run

# E2E tests (backend must be running)
npm run test:e2e

# Lint
npm run lint
```

---

## Auth Mode Summary

The frontend supports two auth modes controlled by `VITE_AUTH_MODE`:

- `local` (default): access token in-memory + sessionStorage, refresh token in localStorage
- `cookie` (best practice): refresh token stored in an HttpOnly cookie; requires CORS/CSRF configuration

For full details and required backend variables, see `backend/README.md` and `frontend/README.md`.

---

## Production Hardening Checklist (Next Steps)

- Set `DJANGO_DEBUG=0`
- Set a strong `DJANGO_SECRET_KEY`
- Configure `DJANGO_ALLOWED_HOSTS` to real hostnames
- Run behind HTTPS and keep the `DEBUG=False` security settings enabled
