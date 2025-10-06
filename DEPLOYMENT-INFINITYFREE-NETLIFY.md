# Deploy: InfinityFree (Backend) + Netlify (Frontend)

A free-tier setup using InfinityFree for PHP+MySQL backend and Netlify for the React frontend.

## Overview
- Backend (PHP + MySQL): InfinityFree
- Frontend (static): Netlify
- API base: `https://<your-epizy-subdomain>.epizy.com/api`

## 1) InfinityFree – Backend and Database

1) Create hosting + subdomain
- In InfinityFree Client Area: create a free hosting account and subdomain, e.g. `yourname.epizy.com`.

2) Create MySQL database
- Control Panel → MySQL Databases → create DB.
- Note values (examples):
  - DB Host: `sqlXXX.epizy.com` (not `localhost`)
  - DB Name: `epiz_12345678_notbetreurung`
  - DB User: `epiz_12345678`
  - DB Password: `<your password>`

3) Upload backend files
- Open File Manager (or use FTP) and navigate to `htdocs/` (document root).
- Create folder `api/` under `htdocs`.
- Upload these files from the repo, mapping as follows:
  - `backend/public/index.php` → `htdocs/api/index.php`
  - `backend/public/.htaccess` → `htdocs/api/.htaccess`
  - `backend/db.php` → `htdocs/db.php`
  - `backend/config.php` → `htdocs/config.php`

This mirrors the code’s includes: `api/index.php` requires `../db.php`, and `db.php` requires `./config.php`.

4) Configure database + CORS
- Edit `htdocs/config.php` and set environment-style values:
  - `DB_HOST = sqlXXX.epizy.com`
  - `DB_PORT = 3306`
  - `DB_DATABASE = epiz_12345678_notbetreurung`
  - `DB_USER = epiz_12345678`
  - `DB_PASSWORD = <your password>`
  - `CORS_ORIGINS = https://<your-netlify-site>.netlify.app`

5) Create tables and seed dates
- Control Panel → phpMyAdmin → select your DB.
- Import schema: use `backend/sql/schema.sql` (recommended). If you get FK errors, use the FK-free schema below.

FK-free schema (alternative):
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

6) Verify API
- Visit `https://<your-subdomain>.epizy.com/api/dates` — should return JSON.
- If you see 404, ensure `htdocs/api/.htaccess` is present. InfinityFree supports rewrites.
- Ensure PHP version is 8.0+ (Control Panel → Select PHP Version); the code uses `str_starts_with`.

## 2) Netlify – Frontend

1) New site from Git
- Base directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `frontend/dist`

2) Environment variables
- `VITE_API_BASE = https://<your-subdomain>.epizy.com/api`

3) Deploy
- After deploy, you get `https://<your-netlify-site>.netlify.app`.

## 3) CORS and Domains
- If you later add a custom domain on Netlify, add it to `CORS_ORIGINS` in `htdocs/config.php` on InfinityFree.
- Re-upload `config.php` after changes.

## 4) Managing Dates
- Use phpMyAdmin (InfinityFree Control Panel):
```sql
INSERT INTO dates (date_value, label) VALUES ('2025-11-01', NULL);
SELECT id, date_value, label FROM dates ORDER BY date_value;
```

## Troubleshooting
- 404 on `/api/dates`: upload `.htaccess` to `htdocs/api/` and verify rewrites.
- CORS errors in browser console: confirm your exact Netlify URL is listed in `CORS_ORIGINS`.
- PHP errors: check InfinityFree error logs in the Control Panel; ensure PHP 8.0+.
