# Notbetreurung – Place Giveaway App

A minimal web app to give away a place for a specific date and let others take it. Frontend is React (Vite), backend is PHP + MySQL.

For full project and API documentation, see `DOCUMENTATION.md`.
For cloud deploy guides, see:
- `DEPLOYMENT-NETLIFY-RENDER-PLANETSCALE.md`
- `DEPLOYMENT-INFINITYFREE-NETLIFY.md`

## Features

- Dates are managed manually in the database (no UI to add dates)
- For each date:
  - Create an offer: enter child name and select group A/B/C/D
  - See a list of offers
  - Each offer can be taken once by entering a child name
  - Once taken, the button greys out and shows the taker name

## Project Structure

- `backend/` – PHP API (PDO, no external deps)
- `backend/sql/schema.sql` – Database schema and sample seed
- `frontend/` – React app (Vite)

## Prerequisites

- PHP 8.1+
- MySQL 8.x (or MariaDB equivalent)
- Node.js 18+

## Database Setup

1. Create a database, e.g. `notbetreurung`.
2. Import the schema and seed:

```sh
mysql -u root -p notbetreurung < backend/sql/schema.sql
```

3. Update DB credentials in `backend/config.php`.

## Backend (PHP) Setup

1. Update `backend/config.php` with your DB settings.
2. Start the PHP built-in server for local dev:

```sh
php -S localhost:8000 -t backend/public
```

The API base URL will be `http://localhost:8000/api`.

## Frontend (React) Setup

1. Install dependencies and run the dev server:

```sh
cd frontend
npm install
npm run dev
```

2. The app runs at `http://localhost:5173` (Vite default). It will call the backend at `http://localhost:8000/api`.

Netlify builds
- This repo includes `netlify.toml` with `base=frontend`, `publish=dist`, and `command="npm install && npm run build"`.
- If you configured a build command in the Netlify UI, it overrides the file (you’ll see `commandOrigin: ui` in logs). Either clear the UI command to use `netlify.toml`, or set it to `npm install && npm run build`.

If your backend runs on a different origin, update `API_BASE` in `frontend/src/api.js` and ensure CORS in `backend/public/index.php` allows it.

## Docker Setup (recommended for quick start)

Run the whole stack (MySQL, PHP backend, Nginx frontend) with Docker:

```sh
docker compose up --build
```

- Frontend: http://localhost:8080
- API is available at http://localhost:8080/api (proxied)

Details and environment variables are documented in `DOCUMENTATION.md`.

### Notes on Docker images

- Backend uses the official `php:8.2-apache` image and serves `backend/public`.
- Frontend uses `nginx:alpine` to serve the Vite build and reverse-proxy `/api` to the backend.
- Database uses `mysql:8.0`.

### Do I need to create the database manually?

No on first run. When you run `docker compose up` for the first time, the `db` service creates the `notbetreurung` database and automatically applies `backend/sql/schema.sql` (because it is mounted into `/docker-entrypoint-initdb.d`). This also seeds a few sample dates.

If you already ran Docker before this schema mount existed, or your DB volume already exists, the init script will NOT re-run. In that case you have two options:

1) Import the schema manually (non-destructive):

```sh
docker compose exec -T db mysql -uroot -pexample notbetreurung < backend/sql/schema.sql
```

2) Reset the DB volume (DANGEROUS – wipes all data) and re-create:

```sh
docker compose down -v
docker compose up --build
```

### How to add dates when using Docker

Dates are managed manually. Use `mysql` inside the db container:

```sh
# Insert a date (label optional)
docker compose exec -T db mysql -uroot -pexample notbetreurung \
  -e "INSERT INTO dates (date_value, label) VALUES ('2025-10-20', NULL);"

# Verify
docker compose exec -T db mysql -uroot -pexample notbetreurung \
  -e "SELECT id, date_value, label FROM dates ORDER BY date_value;"
```

## API Overview

- `GET /api/dates` → List all dates
- `GET /api/offers?date_id=...` → List offers for a date
- `POST /api/offers` → Create a new offer
  - JSON: `{ "date_id": number, "child_name": string, "group": "A"|"B"|"C"|"D" }`
- `POST /api/offers/{id}/take` → Take an offer once
  - JSON: `{ "taker_name": string }`

Responses are JSON. Errors include a JSON `{ error: string }` and appropriate HTTP status.

## Notes

- Dates are inserted manually into `dates` table. Sample seed adds a few future dates. Modify as needed.
- The `offers` table stores both the giver child name and an optional taker name once claimed.
- Concurrency: taking an offer uses a conditional UPDATE to prevent double takes.
