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

- `GET /api/projects/` list projects
- `POST /api/projects/` create project
- `GET /api/projects/<id>/` project detail
- `PUT /api/projects/<id>/` update project
- `DELETE /api/projects/<id>/` delete project

Related lists:
- `GET /api/employees/`
- `GET /api/projectmanagers/`

Project fields typically include:
- `id`
- `name`
- `status`
- `comments`
- `projectmanager` id
- `employees` list of ids
- `start_date` and `end_date` in `YYYY-MM-DD`
- `security_level` one of `Public`, `Internal`, `Confidential`, `Restricted`

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

Django test runner:

```powershell
python manage.py test
```

Pytest if configured:

```powershell
pytest
```

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
- `DJANGO_DEBUG=0`
- Strong `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS` set to real hosts
- HTTPS in production
- Run behind a production server such as Gunicorn or Uvicorn and a reverse proxy

Recommended improvements:
- Rate limiting or throttling for auth endpoints
- Structured logging
- Error tracking such as Sentry
- Security headers and content security policy
- Dependency updates and vulnerability scanning
