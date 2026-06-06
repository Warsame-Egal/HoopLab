# HoopLab

NBA analytics dashboard: live scoreboard, team map, standings, player stats, game logs, and trends. All data is fetched live from [nba_api](https://github.com/swar/nba_api) (by [swar](https://github.com/swar)) with in-memory caching in Spring Boot. There is no database.

```
React  ->  Spring Boot (Caffeine cache)  ->  FastAPI data service  ->  nba_api
                      |                              |
                      |                              +-- /live/* feeds
                      +-- /ws/* WebSocket fan-out ----+
```

The Python **data** service wraps `nba_api` because that library is Python-only. Spring Boot exposes the REST API, caches responses, and polls the live feeds to drive WebSocket updates. The React app talks only to Spring (same origin `/api` and `/ws`); it never calls the data service directly.

## Run

```bash
cp .env.example .env
docker compose up --build
```

| App | URL |
|-----|-----|
| Dashboard | http://localhost:5173 |
| API + Swagger | http://localhost:8080/swagger-ui.html |
| Live scoreboard | http://localhost:5173/scoreboard |
| Scoreboard REST | `GET /api/scoreboard?date=YYYY-MM-DD` (today if omitted) |
| Live WebSocket | `ws://localhost:5173/ws/scoreboard` (proxied to Spring; today only) |

Configuration lives in `.env` (see `.env.example`):

- `DATA_BASE_URL` points Spring at the data service. The data service on `:8000` is REST-only; do not point `VITE_WS_URL` at port 8000.
- With Docker, leave `VITE_API_BASE_URL` and `VITE_WS_URL` empty so the UI uses same-origin `/api` and `/ws` (nginx proxies to Spring).
- For cloud deploys, set `NBA_API_PROXY` so requests to stats.nba.com succeed from datacenter IPs.

## Local development (without Docker)

```bash
# 1. Data service (terminal 1)
cd data && python -m venv .venv && .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000

# 2. Spring Boot (terminal 2)
cd backend && mvn spring-boot:run

# 3. Frontend (terminal 3)
cd frontend && npm install && npm run dev   # http://localhost:5173, proxies /api and /ws to :8080
```

## Features

- **Live scoreboard**: REST plus WebSocket fan-out, with a date picker for past slates.
- **Game detail**: play-by-play and box score stream on the same game socket while live.
- **League dashboard**: team map with tonight's matchup edges, leaders, standings, tracking and hustle panels.
- **Player / team / compare**: depth tabs (splits, awards, lineups, on/off) backed by `nba_api`.
- **Favorites and alerts**: starred teams and players in `localStorage`, with optional browser notifications.

## Architecture notes

- **No database.** Spring caches with Caffeine in tiers: `live` about 5s, `semiLive` about 10 min, `static` about 1 hour, `gameFinal` about 24 hours.
- **Pass-through shapes.** Raw `nba_api` payloads (league, compare, game depth, team/player depth) are forwarded as JSON strings; only curated views (overview, standings, box score, leaders) are mapped to typed DTOs.
- **Caching lives in services.** Controllers are thin and delegate to one service per feature; `@Cacheable` sits on the service methods.
- **Consistent errors.** Spring returns `{ status, message, timestamp, path }`; the data service returns `{ status, message, path }`.
- **Resilient live layer.** First subscriber seeds the stream off the handshake thread; the poller backs off when no games are live; clients reconnect with backoff and close stale sockets after about 45s.

## Tests

```bash
cd backend  && mvn test            # JUnit + WebMvcTest slices
cd data     && pytest && ruff check app tests
cd frontend && npm run lint && npx tsc --noEmit && npm test && npm run build
```

A full endpoint smoke test against a running stack is in `backend/scripts/smoke.sh`.

## Stack

Spring Boot 3 (Java 21) with Caffeine and WebSocket, React with Vite and Tailwind, FastAPI, and `nba_api`.

## Credits and license

NBA data is sourced live from [`nba_api`](https://github.com/swar/nba_api) by [swar](https://github.com/swar). HoopLab is not affiliated with or endorsed by the NBA. Released under the [MIT License](LICENSE); see [NOTICE](NOTICE) for attributions.
