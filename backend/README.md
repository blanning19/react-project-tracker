# Project Tracker Backend

Backend API for the Project Tracker application.

- Django and Django REST Framework
- PostgreSQL
- Optional cookie based refresh auth mode

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Database and Migrations](#database-and-migrations)
- [Running the Server](#running-the-server)
- [Seeding Data](#seeding-data)
- [Admin](#admin)
- [API Notes](#api-notes)
- [Auth Modes](#auth-modes)
- [CORS and CSRF](#cors-and-csrf)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Production Notes](#production-notes)

---

## Tech Stack

- Django
- Django REST Framework
- django-filter
- PostgreSQL
- Optional environment loading with `python-dotenv`

---

## Prerequisites

- Python 3.11 or newer recommended
- PostgreSQL 14 or newer recommended
- Windows PowerShell commands are shown, but the steps work on macOS and Linux with equivalent commands

---

## Setup

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

---

## Environment Variables

1) Copy the example file:

```powershell
Copy-Item .env.example .env
```

2) Update `backend/.env` as needed.

Common variables (names may vary depending on `backend/crud/settings.py`):

Django:
- `DJANGO_DEBUG=1`
- `DJANGO_SECRET_KEY=...`
- `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1`

PostgreSQL:
- `DB_NAME=myappdb`
- `DB_USER=postgres`
- `DB_PASSWORD=admin`
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`

Cookie mode support (only if enabled in your settings):
- `DJANGO_AUTH_REFRESH_COOKIE=0|1`
- `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- `CSRF_TRUSTED_ORIGINS=http://localhost:5173`

Pagination:
- `DRF_PAGE_SIZE=50` default page size for the project list (default: 50)

Tips:
- Treat `.env` as a secret. Track `.env.example`, not `.env`.
- Restart the server after changing `.env`.

---

## Database and Migrations

Create a database and user that match your `.env.example`.

Run migrations:

```powershell
python manage.py migrate
```

Create migrations after model changes:

```powershell
python manage.py makemigrations
python manage.py migrate
```

Show applied migrations:

```powershell
python manage.py showmigrations
```

---

## Running the Server

```powershell
python manage.py runserver
```

Default URL:
- `http://127.0.0.1:8000/`

---

## Seeding Data

A management command is included to populate the database with sample projects for development and testing.

Place the command file at:
```
backend/api/management/commands/seed_projects.py
```

You will need the directory structure with empty `__init__.py` files if they do not exist:
```
backend/api/management/__init__.py
backend/api/management/commands/__init__.py
```

Usage:

```powershell
# Seed 50 projects using existing managers and employees
python manage.py seed_projects

# Seed a different number of projects
python manage.py seed_projects --count 100

# Delete all existing projects first, then seed
python manage.py seed_projects --clear

# Delete all projects, managers, and employees, then seed everything from scratch
python manage.py seed_projects --clear-all
```

Notes:
- If no managers or employees exist, the command creates a set of named seed records automatically.
- `--clear` removes projects only. Managers and employees are kept.
- `--clear-all` removes projects, managers, and employees, then rebuilds all from scratch.
- Running without `--clear` is safe to repeat — projects with duplicate names are skipped.

---

## Admin

Create a superuser:

```powershell
python manage.py createsuperuser
```

Admin site:
- `http://127.0.0.1:8000/admin/`

---

## API Notes

Typical endpoints (router names may vary):

- `GET /api/project/` list projects (paginated)
- `POST /api/project/` create project
- `GET /api/project/<id>/` project detail
- `PUT /api/project/<id>/` update project
- `PATCH /api/project/<id>/` partial update
- `DELETE /api/project/<id>/` delete project

Related lists (no pagination — always returns full list):
- `GET /api/employees/`
- `GET /api/projectmanager/`

### Project list query parameters

The list endpoint supports filtering, searching, ordering, and pagination:

| Parameter        | Example                   | Description                                      |
|------------------|---------------------------|--------------------------------------------------|
| `page`           | `?page=2`                 | Page number (default: 1)                         |
| `page_size`      | `?page_size=25`           | Results per page (default: 50, max: 200)         |
| `search`         | `?search=alpha`           | Search project name and comments (case-insensitive) |
| `status`         | `?status=Active`          | Exact match on status                            |
| `security_level` | `?security_level=Internal`| Exact match on security level                    |
| `ordering`       | `?ordering=-start_date`   | Sort field, prefix with `-` for descending       |

Valid `ordering` fields: `name`, `status`, `start_date`, `end_date`, `security_level`, `modified`

List response envelope:
```json
{
  "count": 50,
  "next": "http://...",
  "previous": null,
  "results": [...]
}
```

Project fields:
- `id`
- `name`
- `status` — one of `Active`, `On Hold`, `Completed`, `Cancelled`
- `comments`
- `projectmanager` — nested object on reads, ID on writes
- `employees` — list of nested objects on reads, list of IDs on writes
- `start_date` and `end_date` in `YYYY-MM-DD`
- `security_level` — one of `Public`, `Internal`, `Confidential`, `Restricted`

---

## Auth Modes

The frontend supports two modes using `VITE_AUTH_MODE`. Backend configuration must align.

Local token mode:
- Access token in memory and sessionStorage
- Refresh token in localStorage

Cookie refresh mode:
- Refresh token stored in an HttpOnly cookie
- Refresh calls include credentials

---

## CORS and CSRF

Cookie refresh mode requires correct cross origin configuration.

Backend `.env` example:
- `DJANGO_AUTH_REFRESH_COOKIE=1`
- `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- `CSRF_TRUSTED_ORIGINS=http://localhost:5173`

Common symptoms:
- Refresh works in Postman but fails in browser: credentials or CORS mismatch
- 403 errors: CSRF trusted origins missing or misconfigured

---

## Testing

Pytest:

```powershell
pytest
```

Run a specific test file:

```powershell
pytest api/tests/test_projects_crud.py
```

Test files:
- `test_auth.py` — login and `/me` endpoint
- `test_auth_throttle.py` — login rate limiting
- `test_jwt_refresh.py` — token refresh and rejection
- `test_project_auth.py` — endpoint authentication and logout blacklisting
- `test_project_filtering.py` — pagination, filtering, search, ordering, lookup endpoints
- `test_project_queries.py` — N+1 query prevention
- `test_project_validation.py` — field validation and TextChoices enforcement
- `test_projects_crud.py` — full CRUD including PATCH and nested serializer reads

---

## Troubleshooting

Database connection errors:
- Confirm Postgres is running
- Confirm `.env` DB values match the DB and user
- Confirm port 5432 is reachable

Migration failures:
- Run `python manage.py showmigrations`
- Fix data constraint issues and rerun migrations

CORS and CSRF issues:
- Confirm allowed origins match the frontend origin exactly
- Confirm refresh requests include credentials in cookie mode

Requirements install issues:
- Confirm you activated the venv
- Upgrade pip: `python -m pip install --upgrade pip`
- Ensure `requirements.txt` is UTF-8 encoded

---

## Production Notes

Minimum hardening:
- HTTPS / reverse proxy
- Run behind a production server such as Gunicorn or Uvicorn and a reverse proxy

Recommended improvements:
- Structured logging
- Error tracking such as Sentry
- Security headers and content security policy
- Dependency updates and vulnerability scanning