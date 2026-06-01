# HoopLab

NBA analytics dashboard — team map, standings, player stats, game logs, and trends.

```
React → Spring Boot → PostgreSQL
              └── Python (fetches from nba_api)
```

The Python service wraps [`nba_api`](https://github.com/swar/nba_api) because that library is Python-only. Spring Boot handles the REST API, database, and scheduled data updates.

## Run

```bash
cp .env.example .env
docker compose up --build
```

| App | URL |
|-----|-----|
| Dashboard | http://localhost:5173 |
| API + Swagger | http://localhost:8080/swagger-ui.html |

## Load data

After startup:

```bash
curl -X POST "http://localhost:8080/api/admin/ingest/backfill?seasonsBack=8"
```

If `HOOPLAB_ADMIN_API_KEY` is set in `.env`, add `-H "X-Admin-Key: your-secret"`.

## Stack

Spring Boot 3 · Java 21 · JPA · Flyway · PostgreSQL · React · Vite · FastAPI · `nba_api`
