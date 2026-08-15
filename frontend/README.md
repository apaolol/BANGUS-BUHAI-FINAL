<<<<<<< HEAD
# BANGUS BUHAI — Backend Test UI

A deliberately bare-bones React + Vite app whose only job is to let you click
through and confirm every backend endpoint works before the real,
Bangus-themed UI gets built. No routing library, no design system, no
animations — plain forms and tables, one file per feature area.

This is a **separate project** from `bangus-frontend/` in the backend repo
(that one is already the styled UI-in-progress and doesn't have a
Predictions screen yet). Nothing in the backend or in `bangus-frontend/` was
touched.
=======
# Bangus Buhai — Frontend

React + Vite frontend for the Bangus Buhai pond/tank monitoring app. Pairs
with the `backend/` FastAPI service (see the backend repo's README).
>>>>>>> 406f2d9af2b4181581dcc953a7b6e5d9f7153fd8

## Setup

```bash
npm install
<<<<<<< HEAD
cp .env.example .env   # edit VITE_API_URL if the backend isn't on localhost:8000
npm run dev
```

Runs at `http://localhost:5173`. The backend's default CORS origins already
include this port (see `backend/config.py`), so no backend changes are
needed.

Start the backend separately, from the repo:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The first request after startup can take ~20–30s while TensorFlow loads the
LSTM model.

## What's here

```
src/
  api.js              fetch wrapper — one function per real backend route,
                       paths/fields copied exactly from routes/*.py and models/*.py
  App.jsx             tab switcher + shared tank list + backend health check
  tabs/
    TanksTab.jsx       create / list / view (+summary) / edit / delete
    WaterLogsTab.jsx   select tank, add log, table of logs incl. status/warnings, delete
    PredictionsTab.jsx select tank, log-count progress toward 48, run prediction,
                       latest prediction, full history
    HistoryTab.jsx     tanks + water logs + predictions, filterable by tank
  components/Message.jsx  tiny error/success/info banner used everywhere
```

## Suggested test flow

1. **Tanks** — create a tank, edit it, view its detail/summary.
2. **Water Logs** — select the tank, add a log, confirm it appears with a
   computed `status`/`warnings`, delete a log to check that path too.
3. **Predictions** — watch the "X / 48 logs" progress bar. Below 48, "Run
   Prediction" will show the backend's real 400 error. Add logs (from the
   Water Logs tab) until you hit 48, then run the prediction — this calls
   the actual ML model, not a mock. Check "Latest Prediction" and "Prediction
   History" update.
4. **History** — switch the tank filter to confirm scoping works, and check
   "All tanks" aggregates correctly (there's no all-tanks predictions
   endpoint on the backend, so this view fetches per-tank and merges them).

## Notes

- Every button in this UI calls a real backend endpoint — nothing is mocked.
- Errors surface the backend's `detail` message directly (e.g. "At least 48
  water logs are required for prediction.").
- Backend status ("OK" / "unreachable") shows in the header and re-checks
  every 15s, so a stopped backend is obvious.
=======
cp .env.example .env   # edit VITE_API_URL if your backend isn't on localhost:8000
npm run dev
```

Runs at `http://localhost:5173` by default. Make sure the backend's
`CORS_ORIGINS` includes that origin (it does by default — see
`backend/config.py`).

```bash
npm run build     # production build -> dist/
npm run preview   # serve the production build locally
```

## Structure

```
src/
  api/client.js        fetch wrapper for every backend endpoint
  lib/waterQuality.js   client-side mirror of backend water-quality thresholds (display only)
  components/           GaugeRing, RangeGauge, StatusBadge, Sidebar, Modal, forms, TankCard
  pages/                Dashboard, TankDetail, Users
  styles/               tokens.css (design system), global.css, components.css
```

## Pages

- **Dashboard (`/`)** — grid of tanks with a live status gauge per card, and a
  form to add a new tank.
- **Tank detail (`/tanks/:id`)** — latest reading plotted on range gauges
  (temperature / pH / turbidity, with the optimal band shaded), latest
  feeding, and tabbed history for water logs and feedings. Lets you log new
  readings/feedings or delete the tank.
- **Growers (`/users`)** — list/add/remove users who tanks can be assigned to.

## Design notes

Palette and type are themed around a brackish milkfish pond rather than a
generic dashboard look — deep teal sidebar, sage-paper background, clay/mud
accent, moss-green/mud-gold/rust status colors. All numeric readouts use a
monospace face to read like a logbook. The gauge-ring/range-gauge motif on
cards and the tank-detail page is the app's one recurring signature element,
modeled on the analog dial gauges used pond-side.

Design tokens live in `src/styles/tokens.css` if you want to retheme.
>>>>>>> 406f2d9af2b4181581dcc953a7b6e5d9f7153fd8
