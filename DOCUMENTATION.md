# Notbetreurung – Project & API Documentation

A minimal web app to give away a place for a specific date and let others take it. Frontend is React (Vite), backend is PHP + MySQL.

## Overview

- Dates are manually managed in the database (no admin UI).
- For each date:
  - Parents can “give away” a place by providing child name and selecting group A/B/C/D.
  - Other parents can take a given place once by entering their child’s name.
  - Once taken, the offer is locked and shows the taker’s name.

## Architecture

- Frontend: React 18 + Vite, simple pages:
  - `Dates` page: lists dates (buttons)
  - `Day` page: per-date listing, form to give away, list of offers and take actions
- Backend: PHP 8 (no frameworks), PDO for MySQL, single entry `backend/public/index.php` handling routes under `/api`.
- Database: MySQL (or MariaDB). Two tables: `dates` and `offers` with FK relationship.

### Directory Layout

- `backend/`
  - `public/index.php` – API router and handlers
  - `db.php` – PDO connection helper
  - `config.php` – DB credentials and CORS origins
  - `sql/schema.sql` – DB schema + seed dates
- `frontend/`
  - Vite React app (`src/` components, pages, api client)
- `README.md` – quick start
- `DOCUMENTATION.md` – this file

## Database Schema

MySQL tables (see `backend/sql/schema.sql`):

- `dates`
  - `id` INT UNSIGNED PK AUTO_INCREMENT
  - `date_value` DATE NOT NULL UNIQUE
  - `label` VARCHAR(64) NULL (optional friendly text)

- `offers`
  - `id` INT UNSIGNED PK AUTO_INCREMENT
  - `date_id` INT UNSIGNED NOT NULL FK → `dates.id` ON DELETE CASCADE
  - `child_name` VARCHAR(128) NOT NULL (giver’s child name)
  - `group` ENUM('A','B','C','D') NOT NULL
  - `taken_by_name` VARCHAR(128) NULL (taker’s child name once taken)
  - `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  - `taken_at` TIMESTAMP NULL

Notes:
- Dates must be inserted manually into `dates`.
- Offers can be taken once. Concurrency is handled by a conditional `UPDATE` checking `taken_by_name IS NULL`.

## Running Locally

### Prerequisites

- PHP 8.1+
- MySQL 8.x (or MariaDB)
- Node.js 18+

### 1) Database Setup

1. Create a database, e.g. `notbetreurung`.
2. Import schema and seed dates:

```sh
mysql -u root -p notbetreurung < backend/sql/schema.sql
```

3. Insert your own dates as needed (examples below).

### 2) Backend

1. Configure DB credentials and allowed CORS in `backend/config.php`.
2. Start the PHP dev server:

```sh
php -S localhost:8000 -t backend/public
```

- API base will be `http://localhost:8000/api`.

### 3) Frontend

1. Install dependencies and start Vite dev server:

```sh
cd frontend
npm install
npm run dev
```

2. Open the URL shown by Vite (default `http://localhost:5173`).

If your backend runs on another host/port, set `VITE_API_BASE` in `frontend` (or edit `frontend/src/api.js`) and ensure CORS is allowed in the backend config.

```sh
# Example
VITE_API_BASE=http://127.0.0.1:8000/api npm run dev
```

## Docker Setup

This project includes a `docker-compose.yml` to run MySQL, the PHP backend (Apache), and the frontend (Nginx) with an API reverse proxy.

### Quick start

```sh
docker compose up --build
```

- Frontend: http://localhost:8080
- API is proxied under `/api` on the same origin (no CORS needed).

The MySQL schema is applied automatically on first run via init script.

### Services

- `db`: `mysql:8.0`, database `notbetreurung`, root password `example` (dev only!)
- `backend`: `php:8.2-apache`, serves `backend/public` on port 80 (internal)
- `frontend`: `nginx:alpine`, serves built React app on port 80, exposed as `8080` on host

### Environment variables

Backend reads env vars (with defaults) from `backend/config.php`:

- `DB_HOST` (default `127.0.0.1`)
- `DB_PORT` (default `3306`)
- `DB_DATABASE` (default `notbetreurung`)
- `DB_USER` (default `root`)
- `DB_PASSWORD` (default empty)
- `CORS_ORIGINS` (comma-separated; default dev origins)

Compose sets these so backend can reach `db` container. Frontend build receives `VITE_API_BASE=/api` and Nginx proxies `/api` to backend.

### Common commands

```sh
# Build and start
docker compose up --build -d

# View logs
docker compose logs -f

# Stop and remove containers (keep DB data volume)
docker compose down

# Reset DB data (DANGER: deletes data)
docker compose down -v
```

### Troubleshooting

- API 404 at `/api/...` after `docker compose up`:
  - Rebuild to apply Apache rewrite config and `.htaccess`:
    - `docker compose build backend && docker compose up -d`
  - Ensure frontend proxies to backend: `frontend/nginx.conf` has `location /api/ { proxy_pass http://backend/api/; }`
  - Confirm backend is healthy: `docker compose logs backend`

## Managing Dates Manually

Insert dates into `dates` table. `label` is optional; if not provided, the frontend formats the date.

```sql
-- Insert a specific date
INSERT INTO dates (date_value, label) VALUES ('2025-10-15', NULL);

-- Insert several dates with labels
INSERT INTO dates (date_value, label) VALUES
  ('2025-10-16', 'Thu 16 Oct'),
  ('2025-10-17', 'Fri 17 Oct');
```

To list dates:

```sql
SELECT id, date_value, label FROM dates ORDER BY date_value ASC;
```

To delete a date (removes its offers due to FK cascade):

```sql
DELETE FROM dates WHERE id = 123;
```

## API Reference

- Base URL: `http://<host>:<port>/api`
- Content-Type: `application/json`
- Error shape: `{ "error": "message" }`

### GET /api/dates

Returns all available dates (manually inserted).

Response 200:
```json
[
  { "id": 1, "date": "2025-10-15", "label": null },
  { "id": 2, "date": "2025-10-16", "label": "Thu 16 Oct" }
]
```

cURL:
```sh
curl http://localhost:8000/api/dates
```

### GET /api/offers?date_id=ID

List all offers for a specific date.

Query params:
- `date_id` (number, required)

Response 200:
```json
[
  {
    "id": 10,
    "date_id": 1,
    "child_name": "Emma",
    "group": "A",
    "taken_by_name": null,
    "created_at": "2025-10-05 09:10:11",
    "taken_at": null
  }
]
```

Errors:
- 400 `{ "error": "Missing or invalid date_id" }`

cURL:
```sh
curl "http://localhost:8000/api/offers?date_id=1"
```

### POST /api/offers

Create a new offer for a date.

Body:
```json
{ "date_id": 1, "child_name": "Emma", "group": "A" }
```

Validation:
- `date_id` > 0 and must exist in `dates`
- `child_name` non-empty string
- `group` one of `A|B|C|D`

Response 201:
```json
{
  "id": 11,
  "date_id": 1,
  "child_name": "Emma",
  "group": "A",
  "taken_by_name": null,
  "created_at": "2025-10-05T09:15:00+00:00",
  "taken_at": null
}
```

Errors:
- 400 `{ "error": "Invalid payload: date_id, child_name, group required" }`
- 404 `{ "error": "Unknown date_id" }`

cURL:
```sh
curl -X POST http://localhost:8000/api/offers \
  -H 'Content-Type: application/json' \
  -d '{"date_id":1, "child_name":"Emma", "group":"A"}'
```

### POST /api/offers/{id}/take

Claim an existing offer exactly once.

Body:
```json
{ "taker_name": "Luca" }
```

Semantics:
- Atomic update prevents double-take. If already taken, returns 409.

Response 200:
```json
{
  "id": 11,
  "date_id": 1,
  "child_name": "Emma",
  "group": "A",
  "taken_by_name": "Luca",
  "created_at": "2025-10-05 09:15:00",
  "taken_at": "2025-10-05 09:20:33"
}
```

Errors:
- 400 `{ "error": "taker_name required" }`
- 409 `{ "error": "Offer already taken or does not exist" }`

cURL:
```sh
curl -X POST http://localhost:8000/api/offers/11/take \
  -H 'Content-Type: application/json' \
  -d '{"taker_name":"Luca"}'
```

## Frontend Behavior

- `Dates` page fetches `/api/dates` and renders a grid of date buttons.
- `Day` page:
  - Loads `/api/offers?date_id=:id` and shows a form to create offers.
  - Each offer row:
    - If not taken: input for taker child name + green “I want take this place” button
    - If taken: greyed state with “Taken by <name>”.

## Configuration

- Backend CORS: set allowed origins in `backend/config.php` (`cors_origins`). Use `['*']` for open dev.
- Frontend API base: set `VITE_API_BASE` or edit `frontend/src/api.js`.

## Deployment Notes

- Backend: serve `backend/public` via Apache/Nginx; ensure URL rewriting (if needed) keeps `/api/*` pointing to `public/index.php`.
- Frontend: `npm run build` then serve `frontend/dist/` via any static host; update `VITE_API_BASE` to your public API.
- Security: consider authentication, rate limiting, HTTPS, input length validation, and audit logging for production.

## Known Limitations & Ideas

- No authentication or authorization.
- No UI to add dates (manual DB insert by design).
- Minimal validation; consider stricter name length and character sets.
- Add i18n, group filters, and email notifications as future improvements.
