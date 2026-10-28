# Erasmus Mundus Tracker

FastAPI backend + React/TypeScript frontend. There is no database: the backend reads the
Excel files in this folder directly and re-reads a file whenever it changes on disk.

| File | Tab |
| --- | --- |
| `Direct_CS.xlsx` (sheet `All Direct CS-AI`) | Direct CS / AI |
| `InDirect_CS.xlsx` (sheets `All Remaining Adjacent`, `Open Oct28-Dec31`) | CS-Adjacent |
| `All_Scholarships.xlsx` (sheet `All EMJM`) | Catalogue |

Each `Read Me` sheet is shown as "Notes & legend". A note whose first word matches a
programme's acronym (e.g. `MIPDaL discrepancy`) is shown as a warning on that programme.

## Run (development)

```powershell
# terminal 1 - API on :8000
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn app.main:app --reload

# terminal 2 - UI on :5173 (proxies /api to :8000)
cd frontend
npm install
npm run dev
```

## Run (single server)

```powershell
cd frontend; npm run build
cd ..\backend; .venv\Scripts\uvicorn app.main:app
```

Open http://127.0.0.1:8000. Set `DATA_DIR` to read the spreadsheets from another folder.
Sheet names and column headers are mapped in `backend/app/loader.py`; unmapped headers are
logged as warnings.

## Live site (GitHub Pages)

https://umair-rai.github.io/erasmus-mundus-tracker/

GitHub Pages can't run the API, so the live site reads static JSON from `frontend/public/data/`.
Pushing to `main` rebuilds and redeploys it (`.github/workflows/pages.yml`).

The spreadsheets (`*.xlsx`) are not in the repository: only the data the site displays is published.
To refresh the live data after editing a spreadsheet:

```powershell
cd backend; .venv\Scripts\python export_static.py
cd ..; git add frontend/public/data; git commit -m "Update data"; git push
```

To preview the static build locally: `cd frontend; npm run build:static`, then serve `frontend/dist`.
