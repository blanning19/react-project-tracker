# Project Tracker (Django + DRF + Vite/React)

This repo contains:
- `backend/`: Django + DRF API (PostgreSQL)
- `frontend/`: Vite/React UI

## Quick start (local dev)

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

## Changes included in this update

### Root `.gitignore`
A root `.gitignore` was added to keep `node_modules/`, venvs, caches, and `.env` files out of git.

### PostgreSQL only
`settings.py` is now PostgreSQL-only. SQLite is removed from the config.

### Env-based Django config
`backend/crud/settings.py` now supports environment variables and optional `.env` loading via `python-dotenv`.

### Model uniqueness fix
`Employees.first_name` and `Employees.last_name` are no longer `unique=True`. Email is the unique identifier.
A migration was added: `api/migrations/0007_alter_employees_fields.py`.

**Migration steps (existing DB):**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
```

If you already have duplicate first/last names in the DB, this change is safe.
If you have duplicate emails, Postgres will reject the unique constraint—fix duplicates first.

### DRF viewset refactor
`ProjectManagerViewset` and `EmployeesViewset` were changed to `ReadOnlyModelViewSet`.
This adds consistent behavior (list/retrieve) and prepares for pagination and filters.

---

## Frontend token/auth hardening: minimal vs best

### Minimal (default): `VITE_AUTH_MODE=local`
- Access token: in-memory + `sessionStorage`
- Refresh token: `localStorage`

Pros:
- Minimal code and config changes
- Works without CORS credentials/CSRF tweaks

Cons:
- Refresh token in `localStorage` increases exposure if an XSS bug exists

### Best practice: `VITE_AUTH_MODE=cookie`
Enable cookie refresh by setting:

Backend (`backend/.env`):
- `DJANGO_AUTH_REFRESH_COOKIE=1`
- `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- `CSRF_TRUSTED_ORIGINS=http://localhost:5173`

Frontend (`frontend/.env`):
- `VITE_AUTH_MODE=cookie`

How it works:
- Refresh token is stored in an **HttpOnly cookie** (not accessible to JS)
- Frontend calls `POST /api/auth/refresh/` with `credentials: "include"` to get a new access token
- Logout calls `POST /api/auth/logout/` to clear the cookie

Pros:
- Stronger protection against token theft via XSS

Cons:
- Requires correct CORS + CSRF configuration
- Slightly more moving parts

---

## Production hardening checklist (next steps)
- Set `DJANGO_DEBUG=0`
- Set a strong `DJANGO_SECRET_KEY`
- Configure `DJANGO_ALLOWED_HOSTS` to real hostnames
- Run behind HTTPS and keep the `DEBUG=False` security settings enabled
- Consider:
  - rate limiting/throttling on auth endpoints
  - structured logging
  - Sentry/observability
  - CSP headers for the frontend
