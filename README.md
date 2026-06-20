# Donnybrook Garage Duty Lookup — Full-Stack Version

A database-backed version of the duty lookup app. Replaces the single static
HTML file (with all 997 duties baked in) with:

- **`public/index.html`** — the same lookup app you already know, but it now
  fetches duty data live from the database instead of having it embedded.
- **`public/admin.html`** — a new edit form. Search a duty, change any
  field, save — no rebuild, no zip upload, changes are live immediately.
- **`netlify/functions/duty.mts`** — the API the above two pages talk to.
- **`netlify/database/migrations/`** — creates the database table and loads
  all 997 existing duties into it (one-time, runs automatically on first
  deploy).

## Setup (one-time)

1. **Create a new GitHub repository** (e.g. `donnybrook-duty-lookup`) and
   push this folder's contents to it.

2. **In Netlify**: go to your team (salimo20) → **Add new project** →
   **Import an existing project** → connect the GitHub repo you just made.
   Netlify will detect `netlify.toml` automatically — no build settings to
   configure.

3. **Deploy.** On the first deploy, Netlify will:
   - Install `@netlify/database`
   - Run the migrations (create the `duties` table, load all 997 duties)
   - Deploy the `duty.mts` function at `/api/duty`
   - Publish `public/index.html` and `public/admin.html`

4. **Done.** Your main lookup page is at the new site's URL, and the editor
   is at `<your-site>/admin.html`.

## Using the editor

Go to `/admin.html`, type a roster number (e.g. `DZ5/9X`), pick the day,
tap **Find Duty**. Edit any field — times, locations, hours, or the list of
timing-point stops — then **Save Changes**. The main lookup page reflects
the change immediately on the next search (no rebuild needed).

## What's preserved from the original app

Every fix from the static version carries over unchanged, since the same
JS logic (just re-pointed at the API) is reused:
- Midnight-crossing sort (NIGHT/LATE duties)
- Handover arrows (← from / → to)
- SPCL labelling (Garage-run detection)
- Shift-type badges incl. "Early & Workout"
- Terminus colour-coding
- CSV download, safety banner, Dublin Bus theme

## Setting the admin password

The editor (`/admin.html`) is now password-protected. Before deploying:

1. Pick a password (anything reasonably strong — not "admin123").
2. In Netlify: your site → **Site configuration → Environment variables**
   → **Add a variable** → key `ADMIN_PASSWORD`, value: your chosen password.
   Mark it as a **secret**.
3. Redeploy (or it'll apply automatically on your next deploy).

Without this env var set, the editor will refuse all save attempts (it
fails safely — no password means no edits, not "edits allowed").

The main lookup page (`/index.html`) and duty search stay open with no
password — only the **save** action in the editor is protected.

## Notes

- The `admin.html` page currently has **no login/password** — anyone with
  the URL can edit duties. If that's a concern, the next step would be to
  add a simple password gate (Netlify has a built-in site-password option,
  or we can add proper auth). Worth doing before sharing the link widely.
- The original static `index.html` + `build_full.py` workflow still exists
  untouched in your project files — this full-stack version is additive,
  not a replacement, until you're happy with it.
