# StudyQuest — Gemini AI setup

StudyQuest now uses Google Gemini for both AI features:

- **Tomorrow Planner:** turns the student's free-form list into real scheduled tasks/cards. It does not tutor or chat.
- **Smart Study Assistant:** answers study questions, can read an attached study image, and can use Google Search grounding when verification/current information is useful. Grounded answers return source links.

## Server-side secrets

Set these as Supabase Edge Function secrets, never in React or `.env`:

- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash-lite`
- `APP_ORIGINS=https://YOUR-DOMAIN.example`

Google AI Studio provides Gemini API keys. Keep the key server-side; the browser never receives it.

## Current product limits

- Free account: up to 100 Study Assistant requests/day at the StudyQuest application layer.
- Premium account: up to 500 Study Assistant requests/day.
- Tomorrow Planner: 10 plans/day free, 40/day Premium.
- Google's own Gemini API free-tier and rate limits still apply. These are provider limits, not StudyQuest promises of unlimited usage.

## Grounding and images

The assistant enables Gemini's Google Search grounding. This lets Gemini search current web information and return grounding citations. It also accepts PNG/JPEG/WebP/GIF study images up to the StudyQuest upload limit.
