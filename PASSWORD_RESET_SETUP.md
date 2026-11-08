# StudyQuest Password Reset

## What was fixed
The password-reset flow now opens the **New Password** form even when Supabase consumes the recovery URL before React receives the `PASSWORD_RECOVERY` event (a common localhost/dev timing issue).

The app now:
- listens for `PASSWORD_RECOVERY`;
- detects the recovery URL immediately on page load;
- checks the active Supabase recovery session as a fallback;
- opens the new-password + confirmation form automatically.

## Local development
Set this in `.env`:

```env
VITE_PASSWORD_RESET_REDIRECT_URL=http://127.0.0.1:5173/
```

Then add the same URL in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.

If you use `http://localhost:5173/` instead, use that exact URL in both places.

## Important
Do not put service-role keys or payment secrets in `.env` or in the frontend.
