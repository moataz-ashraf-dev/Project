# StudyQuest Payments + Domain

The Premium buttons call the `create-paymob-checkout` Supabase Edge Function. The payment provider is Paymob Unified Checkout, and the app no longer presents PayPal/Apple Pay/Google Pay as separate providers when they are not separately configured; Paymob owns the available checkout methods. Paymob handles the sensitive checkout UI; the server receives the final transaction callback and verifies HMAC before activating the premium entitlement.

## Required production values

Set these as Supabase Edge Function secrets (never in React/Vite):

- `APP_URL` — your real HTTPS domain, for example `https://studyquest.example`
- `PAYMOB_SECRET_KEY` — Paymob secret key
- `PAYMOB_PUBLIC_KEY` — Paymob public key
- `PAYMOB_HMAC_SECRET` — Paymob HMAC secret
- `PAYMOB_INTEGRATION_IDS` — comma-separated live integration IDs for the payment methods you enabled
- `PREMIUM_MONTHLY_AMOUNT_CENTS` — final monthly EGP amount in the smallest unit
- `PREMIUM_YEARLY_AMOUNT_CENTS` — final yearly EGP amount in the smallest unit

The Supabase browser values remain:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not put the Paymob secret/HMAC/service-role keys in `.env` shipped with the frontend.

## Supabase

1. Apply the new migration `20260918110000_payments_premium.sql`.
2. Deploy `create-paymob-checkout`.
3. Deploy `paymob-webhook`.
4. Set the secrets above.
5. In Paymob, set the processed callback/webhook to:
   `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/paymob-webhook`
6. Set the response/redirect URL to your public app domain. Paymob documents that the server callback is the source of truth; the browser redirect is only for UX.

## Important

The current implementation creates a verified payment order and a time-limited Premium entitlement after a successful transaction. It intentionally does not claim recurring auto-renewal until a Paymob subscription/MOTO setup is actually configured. Recurring monthly/yearly billing requires creating/configuring Paymob subscription plans and a suitable recurring/MOTO integration, then processing subscription callbacks and cancellation/suspension states. The Paymob docs specify that subscription plans use recurring frequencies such as 30 or 360 days and require a MOTO integration.

## Domain vs keys

A domain does not provide Supabase or Paymob API keys. The domain is used for the public app URL and payment callbacks. Supabase keys come from the Supabase project; Paymob keys/integration IDs/HMAC secret come from the Paymob dashboard.


## Gem top-up
The same Paymob checkout can also sell Gem packs. Configure the server-side secrets `GEMS_PACK_120_AMOUNT_CENTS`, `GEMS_PACK_300_AMOUNT_CENTS`, `GEMS_PACK_700_AMOUNT_CENTS`, and `GEMS_PACK_1600_AMOUNT_CENTS` to match the public EGP display prices. Successful payments are credited server-side through the Paymob webhook and recorded in `economy_transactions` with an idempotency key.

## International payment methods and merchant-net pricing

The Premium checkout exposes cards, Apple Pay, Google Pay, and mobile wallets. Paymob documents cards, mobile wallets, Apple Pay, and Google Pay as supported payment method types; actual availability depends on the methods enabled on the merchant account and region.

Optional `PAYMOB_METHOD_INTEGRATION_IDS` can map each UI method to the exact Paymob integration ID(s). If omitted, the existing `PAYMOB_INTEGRATION_IDS` list is used and Paymob Unified Checkout shows the methods configured for that account.

For merchant-net pricing, set the `*_NET_AMOUNT_CENTS` secrets to the amount you want to receive before the configured effective payment fee. Set `PAYMENT_FEE_PERCENT` and `PAYMENT_FIXED_FEE_CENTS` to your actual blended processor fee. The Edge Functions gross up the customer charge server-side. This is a configured estimate; taxes, FX, chargebacks, refunds, or provider-specific fees can change the final settlement.

## Final economy bonuses

- New cloud registrations receive a one-time **300 Coins + 5 Gems** welcome bonus. It is granted server-side from the profile creation trigger and recorded with an idempotency key.
- Every successfully paid Premium order grants **300 Gems** as a Premium purchase gift. The webhook records the gift server-side and makes it idempotent per payment order.
- Premium payment checkout remains Paymob-backed in the current release. Cards, Apple Pay, Google Pay, and mobile-wallet selections are routed through the configured Paymob integrations; live availability depends on the merchant account's enabled methods.


## Premium purchase gifts
- Premium Monthly: successful paid purchase grants **300 Gems** once.
- Premium Yearly: successful paid purchase grants **800 Gems** once.
- Gem top-up packs keep their existing Gem amounts and do not receive the Premium gift.
- First registration grants **300 Coins + 5 Gems** once.
- Premium gift grants are idempotent per paid order, so a repeated webhook does not duplicate the gift.
