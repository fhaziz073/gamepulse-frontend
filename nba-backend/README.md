# NBA Analytics Backend

NestJS API for NBA search and visualization data aggregation.

## Commands

- `npm install`
- `npm run start`
- `npm run start:dev`
- `npm run build`
- `npm run lint`

## Database setup

The app expects a PostgreSQL database named **`nba_app`** (or whatever you set in `DB_NAME`). The API-only charts still **require Postgres to be running** at startup because TypeORM connects on boot.

### Option A — Docker (simplest if you do not already use Postgres)

From this folder (`nba-backend`):

```bash
docker compose up -d
```

Then in `.env` match the compose credentials:

- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=nba_app`

If something else already uses port **5432**, edit `docker-compose.yml` to map e.g. `"5433:5432"` and set `DB_PORT=5433`.

### Option B — Postgres already installed (Homebrew / Postgres.app)

1. Start the Postgres service (e.g. `brew services start postgresql@16` or open Postgres.app).
2. Create the database (user is often your macOS username for Homebrew, or `postgres`):

```bash
# If your CLI user is a superuser:
createdb nba_app

# Or with psql as the postgres role:
psql -U postgres -h localhost -c "CREATE DATABASE nba_app;"
```

3. Put the same `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_HOST` in `.env`.

### Optional: auto-create tables from entities (dev only)

If you use the `DB` data path later, you can turn on schema sync in development:

- `DB_SYNCHRONIZE=true`

Leave it **`false`** in production.

## Environment

Set these values before running:

- `BALLDONTLIE_API_KEY`
- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: empty string)
- `DB_NAME` (default: `nba_app`)
- `DB_SYNCHRONIZE` (`true` or `false`, default: `false`)
