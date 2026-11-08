# StudyQuest Coin Economy

- Verified study earns **1 Coin per verified study minute**.
- The maximum study-earned Coins are **50 per calendar day** across all sessions.
- A 60-minute verified session can therefore award only 50 Coins; later study that day awards 0 Coins until the next day.
- There is no separate +100 daily Coin bonus.
- The first three Common companions cost **100 / 150 / 200 Coins**, so a consistent student can reach two companions within the first week while later companions take longer.
- Higher Common and Rare companions scale upward; Epic/Legendary/Mythic companions continue to use Gems.
- Sparky remains a 2-study-day starter companion and no longer grants a 250-Coin windfall.
- Online balances and rewards are enforced by Supabase RPCs and the economy ledger.
- Guest/training mode follows the same 50-Coin daily cap locally.

The companion art now has a lightweight 3D/parallax presentation using the existing image assets, so it works on web and Capacitor without adding a heavy 3D engine. It is a visual 3D treatment rather than a `.glb` model viewer.

## High-quality companion pricing

- Common and Rare companions keep their normal lower prices.
- Epic, Legendary, and Mythic companions now use a 5,000 Coin baseline.
- The curated Premium companion set is still Premium-gated; non-Premium users see a Premium lock instead of a misleading purchase action.
- Gem prices are unchanged.

### Welcome bonuses
- First cloud registration: **300 Coins + 5 Gems**, once per account.
- Successful Premium purchase: **300 Gems** gift per paid Premium order.

