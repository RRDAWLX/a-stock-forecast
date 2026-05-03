# AGENTS.md

## Ignore files

- `prompt.md` — not useful for development
- `server/app/model/` — copied from Kronos repo, import paths adapted for this project. Do NOT lint, format, or modify these files. They are excluded from ruff and lint-staged.

## Dev commands

**Backend** (from repo root):
```bash
cd server && uv run scripts/run_dev.py   # starts uvicorn, reads port from config.jsonc
cd server && uv run python scripts/preload_model.py  # first-time: download model weights to server/models/
```

**Frontend** (from repo root):
```bash
cd frontend && pnpm install && pnpm dev   # pnpm dev runs node scripts/dev.js, which reads port from config.jsonc
```

**Port sync** — after editing `config.jsonc` ports, run:
```bash
cd server && uv run scripts/sync_ports.py  # syncs backend port into frontend/.env.development
```

## Lint / format

```bash
pnpm run lint:frontend     # cd frontend && next lint
pnpm run lint:backend      # cd server && uv run ruff check .
pnpm run format:frontend   # cd frontend && prettier --write
pnpm run format:backend    # cd server && uv run ruff format .
```

Pre-commit hook (husky + lint-staged) runs these automatically. See `package.json` lint-staged config.

## Architecture

- **Config hub**: Root `config.jsonc` — central source of truth for ports (`frontend`, `backend`) and K-line parameters (`realDataDays`, `predOutputDays`, `overlapDays`). Both frontend and backend read this file at startup.
- **Backend entry**: `server/app/main.py` → FastAPI app with CORS `allow_origins=["*"]`
- **API routes**: `/api/stock?code=600519` (K-line + prediction), `/api/history` (SSE search history)
- **Prediction flow**: `app/api/stock.py` → `app/services/predictor.py` → `KronosPredictor.predict()` in `app/model/`
- **Frontend**: Next.js App Router + TypeScript + Tailwind CSS v4 + lightweight-charts

## Model weights

- `server/models/kronos-tokenizer/` and `server/models/kronos-model/` — gitignored, must be downloaded via `preload_model.py`
- Model uses `huggingface_hub.PyTorchModelHubMixin`, not `transformers.AutoModel`

## Key constraints

- Changing ports in `config.jsonc` requires running `sync_ports.py` to update `frontend/.env.development`
- `server/data/search_history.json` is gitignored runtime state
- Python >= 3.10, Node >= 18 required