# 07 — Deployment and deliverables

## 1. Dockerfile (shape)

```dockerfile
# --- build frontend ---
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build                      # → /web/dist

# --- runtime ---
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/ ./
RUN pip install --no-cache-dir .        # installs the app package + pinned deps
COPY --from=web /web/dist ./app/static
RUN useradd -m appuser && chown -R appuser /app
USER appuser
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

- In `main.py`: mount `app/static/assets`, and serve `index.html` for any non-`/api` GET (SPA fallback).
- The frontend calls the API with **relative** URLs (`/api/...`). In dev, the Vite proxy forwards `/api` to `localhost:8000`.
- `.dockerignore`: node_modules, .git, .venv, dist, and the tests caches.

## 2. Heroku (container stack)

`heroku.yml`:
```yaml
build:
  docker:
    web: Dockerfile
```

Steps (the human runs these, since they need Heroku login and billing):
```bash
heroku login
heroku create <random-app-name>          # an anonymous name, e.g. windportal-kjhwr
heroku stack:set container -a <app>
heroku config:set ADMIN_TOKEN=<random> -a <app>   # optional
git push heroku main
heroku open -a <app>
```

- Heroku has **no free tier**. An Eco or Basic dyno costs about $5–7/month, and the Eco dyno sleeps after 30 minutes idle, which gives a ~10 s cold start. **Before recording the video and before submitting, open the app once to wake it up.** Keep the app live until the evaluation is finished.
- Alternative (no Heroku CLI): connect the GitHub repo in the Heroku dashboard → Deploy → GitHub, with the stack set to container.

## 3. README.md (required contents)

1. **Title + one-paragraph pitch** + a **live app link** at the top + a screenshot.
2. **What it does**: the two client goals and how the app answers each.
3. **Key findings (Jan 2026):** the headline numbers from docs/04 §6 and the bias insight.
4. **How to run:**
   - Docker: `docker build -t windportal . && docker run -p 8000:8000 windportal`
   - Local dev: the backend (`pip install -e backend[dev]`, `uvicorn …`) + the frontend (`npm i && npm run dev`), or `docker compose up`.
   - Refresh the data: `python -m app.data.ingest` (or `make ingest`).
   - Tests: `pytest`, `npm test`.
5. **Files and directories**: a tree with a one-line purpose for each (the brief requires this).
6. **Architecture**: the diagram from docs/03 §1 + the API table.
7. **Methodology & assumptions**: the decision-time rule, the alignment, the error sign, the metrics, and the band caveat.
8. **Limitations & next steps**: an out-of-sample band, curtailment data, solar, price-weighted error cost, alerts.
9. **AI usage disclosure (mandatory):** "This project was built with AI assistance:
   Claude Code (Claude Opus 5.5 for requirements analysis, data verification and specs;
   Claude Sonnet 5.5 for implementation). All code was reviewed, tested and run by me.
   The specs in `docs/` and `CLAUDE.md` are the prompts/instructions used."

## 4. Video script outline (≤ 10 min total, unlisted YouTube)

**Part 1 — Client pitch (≤ 5 min).** Audience: the utility's day-ahead trading lead.
1. (0:30) The problem in their words: "At 11:00 every day you commit to tomorrow's
   purchases, and wind is the biggest unknown."
2. (1:30) Live demo of the default view: the forecast you had at 11:00 vs what happened. KPI tiles:
   "Off by ~2.0 GW on average, 17.7 % of wind energy."
3. (1:00) The bias insight: "Forecasts were too high most of the time, by ~1.7 GW. Unadjusted,
   that means systematic under-buying." Present curtailment as the hypothesis to verify together.
4. (1:00) The day panel: pick the worst day and show the 80 % band, then: "This is how you'd size a safety margin."
5. (0:30) Lead time: "Waiting from 24 h to 4 h lead cuts the error by ~11 %, which informs how much to keep for intraday."
6. (0:30) Next steps: live daily feed, alerts, more fuels, a cost-weighted error.

**Part 2 — Tech-lead walkthrough (≤ 5 min).**
1. (0:45) The architecture diagram: one container, snapshot-first, and why.
2. (1:15) The data findings: endpoint quirks (the ignored `from/to`, hourly vs half-hourly data, negative horizons, 8 runs/day).
3. (1:30) The analytics core: `selection.py` and the leakage rule. Show the tests, including the reference test and the DST test.
4. (0:45) The frontend structure: query hooks, URL state, components.
5. (0:45) Dev practices: CI, ruff/eslint, Docker, the Heroku deploy, the AI-usage workflow (specs → agent → review), and the known limitations.

## 5. Submission checklist

- [ ] The GitHub repo is **public** with an **anonymous random name**, and there is no personal name in the repo name, the app name, or the commit emails if you want anonymity (consider a `noreply` email).
- [ ] The README has the files/dirs section, how to start the app, the **live link**, and the **AI disclosure**.
- [ ] The Heroku app is live and verified in **incognito**.
- [ ] The YouTube video is **Unlisted** (not Private), ≤ 10 min, has both parts, and is verified in **incognito**.
- [ ] The form is submitted: https://forms.cloud.microsoft/r/Ljmf1aWESK
- [ ] The brief file is not committed (it is gitignored).
