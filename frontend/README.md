# HoopLab frontend

React + TypeScript + Vite single-page app for the HoopLab NBA dashboard. It talks only to the Spring Boot API over same-origin `/api` (REST) and `/ws` (WebSocket); see the [root README](../README.md) for the full architecture.

## Scripts

```bash
npm install
npm run dev        # dev server on http://localhost:5173, proxies /api and /ws to :8080
npm run lint       # eslint
npx tsc --noEmit   # type-check
npm test           # vitest
npm run build      # type-check + production build into dist/
```

## Configuration

Build-time environment variables (see root `.env.example`):

- `VITE_API_BASE_URL`: leave empty for same-origin `/api` (Docker/nginx or the Vite dev proxy). Set it only when the API is on a different origin.
- `VITE_WS_URL`: leave empty to derive the WebSocket origin from the page. Never point this at the data service on port 8000; WebSockets are served by Spring at `/ws/*`.
- `VITE_ENABLE_LOGS`: set to `true` to emit error logs in a production build (logs are on by default in dev).

## Layout

- `src/pages` route-level screens (Overview, Scoreboard, Game detail, Players, Teams, Standings, Compare, League).
- `src/components` presentational and data-bound widgets, plus `components/ui` primitives.
- `src/hooks` data hooks (React Query) and the live WebSocket subscriptions.
- `src/lib` API client, WebSocket client, formatting, and the logger shim.
- `src/types` shared response types.

## Design tokens

Colors come from CSS variables in `src/index.css` and are used through Tailwind tokens (`bg-brand`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-brand`, and so on) rather than raw palette classes, so light and dark themes stay consistent.
