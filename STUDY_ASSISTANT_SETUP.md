# StudyQuest Smart Study Assistant

The Smart Study Assistant is a separate AI workflow from Tomorrow Planner.

- `plan-tomorrow` is only for turning the student's list into tomorrow's structured tasks/cards.
- `study-assistant` is for questions about lessons, concepts, exercises, and things the student is stuck on.
- Both use the server-side `GEMINI_API_KEY` and `GEMINI_MODEL` secrets; no provider key is exposed in the browser.
- The assistant can use Gemini Google Search grounding for current/verification-sensitive questions and returns source links.
- The assistant accepts study images (PNG/JPEG/WebP/GIF) and asks Gemini to explain them.
- Free users get a 100-request/day StudyQuest application limit; Premium gets 500. Google provider rate limits still apply.
- The assistant requires a signed-in account, matching the planner's production security model.
