# Deploy: Netlify (Frontend) + Render (Backend) + PlanetScale (MySQL)

This guide shows a free-tier friendly deployment for ~50 users.

## 1) PlanetScale (MySQL)

1) Create a database
- In PlanetScale dashboard → New Database → name: `notbetreurung`.

2) Get credentials
- In the database → Connect → General → note values:
  - HOST (e.g. `aws.connect.psdb.cloud`)
  - USERNAME (e.g. `pxxxxxxxx`)
  - PASSWORD (e.g. `pscale_pw_xxx...`)
  - DATABASE (e.g. `notbetreurung`)

3) Apply schema (PlanetScale-friendly: no foreign keys)
- Open SQL console and run (copy-paste):

```sql
CREATE TABLE IF NOT EXISTS dates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  date_value DATE NOT NULL UNIQUE,
  label VARCHAR(64) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS offers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  date_id INT UNSIGNED NOT NULL,
  child_name VARCHAR(128) NOT NULL,
  `group` ENUM('A','B','C','D') NOT NULL,
  taken_by_name VARCHAR(128) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  taken_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_offers_date (date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed a few dates
INSERT INTO dates (date_value, label) VALUES
  (DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL),
  (DATE_ADD(CURDATE(), INTERVAL 2 DAY), NULL),
  (DATE_ADD(CURDATE(), INTERVAL 3 DAY), NULL);
```

Notes
- PlanetScale disables foreign keys; the app works without them.
- You can add dates later any time by running INSERT statements in the console.

## 2) Render (Backend)

1) Create a Web Service
- Render dashboard → New → Web Service → “Build from repository” → select your Git repo.
- Runtime: Docker
- Root directory: `.` (repo root)
- Dockerfile path: `backend/Dockerfile`

2) Environment variables (use your PlanetScale credentials)
- `DB_HOST` = e.g. `aws.connect.psdb.cloud`
- `DB_PORT` = `3306`
- `DB_DATABASE` = e.g. `notbetreurung`
- `DB_USER` = e.g. `pxxxxxxxx`
- `DB_PASSWORD` = e.g. `pscale_pw_xxxxxxxxx`
- `CORS_ORIGINS` = your Netlify URL, e.g. `https://notbetreurung.netlify.app`

3) Deploy
- Deploy and wait for “Live”.
- Note the base URL, e.g. `https://notbetreurung-backend.onrender.com` (API at `/api`).

If you see DB connection errors:
- PlanetScale requires TLS. Most setups work without extra config. If needed, provide CA or disable server cert verification via PDO options (contact me to wire this in if required by your region).

## 3) Netlify (Frontend)

1) New site from Git
- Connect your repo in Netlify.

2) Build settings
- Base directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `frontend/dist`

Tip: The repo includes `netlify.toml` that sets these. If your Netlify UI shows “commandOrigin: ui” in logs, the UI overrides the file. Clear the custom build command in the UI to use `netlify.toml`, or set the UI command to `npm install && npm run build`.

3) Environment variables
- `VITE_API_BASE` = your Render API base, e.g. `https://notbetreurung-backend.onrender.com/api`

4) Deploy
- After deploy, Netlify gives a URL like `https://notbetreurung.netlify.app`.
- Optional: add your custom domain, then include it in `CORS_ORIGINS` on Render.

## Wiring and Verification

- Ensure `CORS_ORIGINS` on Render includes your Netlify URL (and any custom domain).
- Visit your Netlify URL and confirm the Dates load.
- Direct API test:

```sh
curl https://notbetreurung-backend.onrender.com/api/dates
```

## Example Values (replace with your own)

Render (backend):
- `DB_HOST=aws.connect.psdb.cloud`
- `DB_PORT=3306`
- `DB_DATABASE=notbetreurung`
- `DB_USER=pxxxxxxxx`
- `DB_PASSWORD=pscale_pw_xxxxxxxxxxxxxxxxx`
- `CORS_ORIGINS=https://notbetreurung.netlify.app`

Netlify (frontend):
- `VITE_API_BASE=https://notbetreurung-backend.onrender.com/api`

## Maintaining Data (PlanetScale)

- Add a date:
```sql
INSERT INTO dates (date_value, label) VALUES ('2025-11-01', NULL);
```
- List dates:
```sql
SELECT id, date_value, label FROM dates ORDER BY date_value;
```
- Remove a date:
```sql
DELETE FROM dates WHERE id = 123;
```

If you want, I can add `render.yaml` and `netlify.toml` to codify these settings for one‑click deployments.
