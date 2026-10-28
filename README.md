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

## Fee data

`backend/data/fees.json` holds researched tuition fees for the tracked programmes (Direct CS / AI and
CS-Adjacent), keyed `direct:ACRONYM` / `adjacent:ACRONYM`. Each entry has the headline `fee`, a short
`fee_note`, a longer `fee_detail`, the `fee_source` page, the `fee_checked` date and a `fee_status`:

| `fee_status` | Meaning |
| --- | --- |
| `published` | Read on the programme's (or a partner university's) own page |
| `unverified` | Only from a search summary or third-party listing; confirm on the programme site |
| `not_found` | No fee published, or the site couldn't be read |

`fee_year_eur` is the approximate yearly tuition for a non-EU self-funded student (`0` = no tuition,
`null` = unpublished or unclear); the Tuition fee filter bands are built from it.

The backend merges this file into the tracker rows, and edits show up without a restart. Fees change
every intake, so re-check a programme's official page before relying on a figure.

## Accounts and wishlist (Supabase)

Visitors can create an account (email + password), star programmes, set a status
(Planning / Applying / Applied / Accepted / Rejected) and keep private notes. Accounts and data live in a
free [Supabase](https://supabase.com) project, so this works on the static GitHub Pages site. Without the two
settings below the site works exactly as before, just with no sign-in or stars.

One-time setup:

1. Create a free project at supabase.com.
2. **SQL Editor** > New query > paste `supabase/schema.sql` > Run. This creates the `wishlist` table and the
   row-level security policies that limit every query to the signed-in user's own rows.
3. **Authentication > URL Configuration**: set *Site URL* to `https://umair-rai.github.io/erasmus-mundus-tracker/`
   and add that URL plus `http://localhost:5173/` and `http://127.0.0.1:8000/` under *Redirect URLs*
   (sign-up confirmation and password-reset links return there).
4. **Authentication > Providers > Email**: set the minimum password length to 8. Decide on *Confirm email*:
   on is safer, but Supabase's built-in mail sender has a very small hourly cap, so for real visitors add your
   own SMTP under *Authentication > SMTP Settings*.
5. **Project Settings > API**: copy the *Project URL* and the *anon public* key (the anon key is meant to be
   public; the policies in step 2 are what protect the data).
   - Local use: copy `frontend/.env.example` to `frontend/.env.local` and fill in both values.
   - Live site: GitHub repo > Settings > Secrets and variables > Actions > **Variables**, add
     `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then re-run the *Deploy to GitHub Pages* workflow.

Never put the `service_role` key anywhere in this repo or the site.

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
