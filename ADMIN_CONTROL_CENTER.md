# StudyQuest Admin Control Center

The app now includes a separate Admin tab. It is visible only to a Supabase Auth user whose **app_metadata** contains:

```json
{"role":"admin"}
```

## Give your account admin access

In Supabase SQL Editor, replace the email with the email of your owner account:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'YOUR-OWNER-EMAIL@example.com';
```

Then sign out and sign in again so the new JWT contains the role.

## What the dashboard controls

- Add new companions at any time.
- Upload a companion image to the private admin upload workflow / public catalog delivery bucket.
- Choose **Premium only** or **Standard**.
- Change rarity, Coin price, Gem price, sort order, and purchase availability.
- Archive an existing companion without deleting its historical ownership records.
- Change Support email, WhatsApp URL, Telegram URL, and the support message.
- Changes are stored in Supabase, not only in browser localStorage.

## Security model

- Catalog reads are available to authenticated users.
- Catalog writes use a security-definer admin RPC and require `app_metadata.role=admin`.
- Premium-only purchases are enforced server-side from the catalog flag; the client cannot bypass the restriction by calling the purchase RPC directly.
- Catalog images are uploaded only by admins.
- Payment secrets are not stored in this dashboard or in the frontend.

## Important

Run the migration `20260918250000_admin_control_center.sql` before using the dashboard. The frontend has a static catalog fallback so the app can still render if the cloud is temporarily unavailable, but admin changes require the configured Supabase project.
