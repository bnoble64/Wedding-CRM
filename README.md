# Wedding HQ — frontend

A private, two-person wedding planning CRM. React + Vite, talking to your Supabase
backend (schema + RLS already deployed).

## What's live in this build
- **Auth** — email/password sign-in, plus a Google button that works the moment you
  enable Google in Supabase. Signed-out users see nothing (RLS enforces it).
- **App shell** — the 12-section sidebar nav, global Quick Add, responsive to mobile.
- **Dashboard** — fully wired to your data:
  - Exploration Mode when no wedding date is set (no fake countdowns).
  - Four live summary cards: Date, Countdown, Budget, Guests — the budget card reads
    the `budget_summary` view, so gifts and the anti-double-count rule are already reflected.
  - **Potential dates** board — add candidates, then "Set as date" promotes one to the
    real wedding date and flips the whole dashboard out of Exploration Mode.
  - **Gifted budget** — log pledged/received contributions and watch available funds react.
  - Foundational-decisions progress bar.
- **Quick Add** — Vendor / Idea / Decision save for real; the rest are visible stubs.

## What's stubbed (next to build)
Planning, Vendors, Venues, Decisions, Budget, Guests, Ideas, Events, Documents,
Communications, Settings each open a placeholder. The tables behind them exist —
these are the screens still to wire up.

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your **rotated** Supabase URL + anon/publishable key.
3. `npm run dev` → open the printed localhost URL.

## Deploy on Netlify
1. Push this folder to your GitHub repo.
2. In Netlify: Add site → import from GitHub → pick the repo.
3. Build command `npm run build`, publish directory `dist` (already set in `netlify.toml`).
4. Add two environment variables in Netlify (Site settings → Environment variables):
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy. Then add your Netlify URL to Supabase → Authentication → URL Configuration
   (Site URL + redirect URLs) so login redirects land back on the site.

## Security note
Only the anon/publishable key belongs here or in Netlify. The `sb_secret_...` key must
never be committed or added to the frontend. RLS is what makes the anon key safe to ship.
