# Profile Frames — Vector Rebuild

The profile frame system remains part of the existing StudyQuest skin/economy flow, but the renderer was rebuilt around the actual profile avatar geometry.

- The user photo is a separate rounded-rectangle layer.
- Frame art is inline SVG and never baked into or cropped from a photo.
- A vector mask keeps all frame ornamentation outside the photo window.
- The frame shell follows a rounded-square profile shape rather than forcing the profile into a circle.
- Premium and standard frame IDs/prices/equipment rules already present in `profileStore.ts` are preserved.
- SVG definition IDs are now unique per mounted frame instance, so repeated frames on the leaderboard cannot collide.
- Leaderboard RPC now exposes the equipped `frame` skin so ranking cards can render the same frame identity as the profile.

Migration: `supabase/migrations/20260919062000_leaderboard_profile_frame_rpc.sql`.
