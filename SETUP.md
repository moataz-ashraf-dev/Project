# StudyQuest — Production Foundation

## 1. Install and run

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

The app can run locally without Supabase. That mode is intentionally non-competitive: local study records are kept in browser storage and are not accepted as authoritative leaderboard evidence.

## 2. Supabase account storage

StudyQuest uses Supabase Auth for accounts. The password/email account itself is stored and managed by Supabase Auth (`auth.users`). StudyQuest application data is linked to the same user ID:

- `profiles` — display name, locale, country/city, progression.
- `user_settings` — app preferences.
- `subjects` — the user's subjects.
- `study_sessions` — verified online study sessions.
- `economy_accounts` — authoritative Coins/Gems/Stars balances.
- `economy_transactions` — immutable-style economy ledger.
- `user_inventory` — owned pets/skins.
- `user_equipment` — equipped pet/skins.
- `study_plans` / `study_plan_tasks` — tomorrow plans and executable tasks.
- `leaderboard_profiles` — safe public projection used by rankings.

RLS is enabled on user-owned tables. The browser never receives a service-role key.

## 3. Browser environment

Create `.env` from `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

These are browser-safe client configuration values. Never put a Supabase service-role/secret key in the frontend.

## 4. Database

Apply every migration in `supabase/migrations/` in filename order.

The latest migration adds:

- server-opened study sessions;
- server-clock verification before competitive rewards;
- safe cancellation/stale-session handling;
- authoritative shop catalog;
- server-side pet/skin purchases;
- server-side equipment changes;
- bounded city/country/global leaderboard RPC;
- moderation-report storage;
- stronger competitive-session permissions.

## 5. Verified study flow

For an authenticated online user:

```text
Start timer
  ↓
start_study_session()
  ↓
server stores started_at + duration
  ↓
timer runs
  ↓
complete_study_session()
  ↓
server verifies elapsed time
  ↓
Economy ledger + Coins/Gems/Stars
  ↓
XP / level / streak
  ↓
Leaderboard projection
```

A modified browser can still fake its own local UI, but it cannot instantly mint competitive rewards by simply calling the reward RPC with `duration=120`.

Offline sessions remain useful for personal use but are deliberately not uploaded as competitive proof.

## 6. AI Tomorrow Planner

Deploy the Edge Function:

```bash
supabase functions deploy plan-tomorrow
supabase secrets set GEMINI_API_KEY=YOUR_KEY GEMINI_MODEL=gemini-2.5-flash-lite APP_ORIGINS=https://YOUR-DOMAIN.example
```

For local development, include `http://localhost:5173` in `APP_ORIGINS`.

The planner authenticates the user, limits requests to 10 per day for free users (40 for Premium), validates that the requested date is actually tomorrow in the supplied timezone, calls the Google Gemini API, validates/bounds the result, resolves subjects to the user's own subject IDs, and stores the plan/tasks in Supabase.

The Gemini key never enters React, `.env`, Git, or the ZIP.

## 7. Shop / economy rules

- Coins are earned through verified study and can buy ordinary cosmetics.
- Gems are a premium currency and can buy selected rare cosmetics.
- Stars are achievement/tenure style rewards and are never sold.
- No purchase can buy XP, leaderboard rank, fake study time, or streaks.
- Prices are stored server-side in `catalog_items`; the browser cannot choose its own price.

## 8. Community

The current release exposes the verified leaderboard and moderation-report foundation. Real student-to-student chat/voice should only be enabled after the server-side room/message moderation, membership, rate-limit, report/block and retention controls are deployed. The UI therefore does not pretend that a local mock voice room is a real connection.

## 9. Production checklist

Before public launch:

1. Apply all migrations to a real Supabase project.
2. Deploy `plan-tomorrow` and configure its secrets.
3. Configure Auth email confirmation/password policy/rate limits.
4. Configure production CORS (`APP_ORIGINS`).
5. Run `npm run typecheck` and `npm run build` in a clean environment.
6. Run Supabase database tests and add authenticated integration fixtures.
7. Enable payments only after server-side purchase verification is implemented.
8. Complete moderation infrastructure before enabling real student chat.
9. Run dependency audit and independent security testing.
10. Never publish `.env`, service-role keys, database passwords, payment secrets or AI keys.


## v8 economy + companion note
- A verified study day of at least 25 minutes can claim a one-time 100 Coin daily commitment bonus.
- The catalog contains 40 distinct companions: Common companions use Coins; Rare companions cost more Coins; Epic/Legendary/Mythic companions use Gems.
- The browser does not grant the daily bonus directly; the Supabase RPC is authoritative.

## Study audio and premium 3D art

- The dashboard now includes a Quran player with 114 surahs and multiple reciters using Al Quran Cloud's documented surah-audio CDN pattern. The source documents that it provides ayah and surah audio files; review source terms before commercial redistribution.
- A vocal-nasheed source link is included rather than bundling third-party audio without a license. The selected Pixabay track is marked free for use under the Pixabay Content License.
- Premium showcase artwork has been upgraded with original 3D fantasy renders while keeping the existing pet IDs/catalog/prices unchanged.

- Admin Control Center: see `ADMIN_CONTROL_CENTER.md` for enabling the owner account and managing companions/contact settings.
