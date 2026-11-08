# StudyQuest Security Baseline

## Protected by design

- Supabase Row Level Security is enabled for user-owned data.
- Coins, Gems, Stars, XP, level and streak progression are not client-authoritative for authenticated online sessions.
- Study rewards use an idempotency key so retries do not double-pay.
- Private economy ledgers are not writable by the browser.
- AI credentials stay inside Supabase Edge Function secrets.
- React rendering avoids raw HTML injection for user text.
- Competitive progression is separated from the cosmetic economy.
- Offline data is treated as untrusted and is not the authority for competitive ranking.

## Before public launch

1. Apply all migrations to the real Supabase project.
2. Deploy `plan-tomorrow` and configure `GEMINI_API_KEY` and `GEMINI_MODEL` as server-side secrets.
3. Enable email confirmation and appropriate password policies in Supabase Auth.
4. Configure rate limits for Auth, Edge Functions and any future chat endpoints.
5. Add moderation/reporting infrastructure before enabling real student-to-student chat.
6. Add server-side purchase verification before selling Gems.
7. Run dependency auditing and a real penetration/security review before calling the service production-hardened.
8. Keep Supabase service-role keys, payment secrets, AI keys and database passwords out of the frontend and Git history.


## Additional hardening in this revision

- Client database privileges are reduced for authoritative columns instead of relying on a mutable session setting.
- The leaderboard uses a separate public projection table rather than exposing the private profiles table through a privileged view.
- AI planner requests are limited to 10 per free user per day (40 for Premium) by a database function.
- Planner task inserts are normalized to actual database columns and subject IDs; AI-only fields are never sent to Postgres.
- Planner output is capped to 30 tasks and 720 total planned minutes.
- Legacy app-state balances are migrated into the authoritative economy without allowing the browser to write the economy.
