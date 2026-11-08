# StudyQuest Profile Identity

This release adds production profile identity customization:

- User-selected profile picture, compressed client-side before upload.
- Authenticated users upload to the public `avatars` Supabase Storage bucket under their own user folder.
- Guests can use a local training avatar without uploading account data.
- Avatar themes: Ice, Fire, Aurora, Royal, Void.
- Pet badge can be positioned top, bottom, left, or right around the avatar.
- Owned pet gallery shows only pets actually unlocked/owned by the account and displays the total owned count.
- Public-safe leaderboard projection includes avatar presentation, equipped pet, pet count, country and city.
- Pet catalog remains split between Coins and Gems: each purchasable item has one authoritative currency price.

Supabase migration to apply:
`20260918150000_profile_identity_customization.sql`
`20260918151000_leaderboard_identity_rpc.sql`
