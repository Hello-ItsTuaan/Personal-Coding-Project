## School Manager (Self-host)

This is a Vite + React app refactored to run without Base44. It includes a tiny local backend (`server/`) that stores data in `server/data/db.json` and exposes a REST API under `/api/*`.

### Run locally (dev)

1. Install: `npm install`
2. Start API server (port 8787): `npm run dev:server`
3. Start Vite dev server: `npm run dev`

Vite proxies `/api` to `http://localhost:8787` via `vite.config.js`.

### Run locally (production-like)

1. Build UI: `npm run build`
2. Start server (serves API + `dist/`): `npm start`

### Notes

- The AI suggestion button calls `/api/llm/invoke` which is currently not implemented (returns `501`). You can implement it server-side, or remove the AI UI.
