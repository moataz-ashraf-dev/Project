import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const appOrigin = (Deno.env.get('APP_URL') || '*').replace(/\/$/, '');
const cors = { 'Access-Control-Allow-Origin': appOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
function grossUpCents(targetNetCents: number) {
  const feeRate = Math.max(0, Number(Deno.env.get('PAYMENT_FEE_PERCENT') || 0)) / 100;
  const fixed = Math.max(0, Number(Deno.env.get('PAYMENT_FIXED_FEE_CENTS') || 0));
  if (feeRate >= 1) throw new Error('invalid_payment_fee_rate');
  return Math.ceil((targetNetCents + fixed) / (1 - feeRate));
}
function selectedPaymobIntegrationIds(method: string, fallback: number[]) {
  try {
    const raw = Deno.env.get('PAYMOB_METHOD_INTEGRATION_IDS');
    if (raw) {
      const map = JSON.parse(raw) as Record<string, unknown>;
      const selected = Array.isArray(map[method]) ? map[method].map(Number).filter(Boolean) : [];
      if (selected.length) return selected;
    }
  } catch { /* fall back to the merchant's configured integration list */ }
  return fallback;
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const secretKeysRaw = Deno.env.get('SUPABASE_SECRET_KEYS');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || (secretKeysRaw ? JSON.parse(secretKeysRaw).default : '');
    if (!serviceKey) return json({ error: 'supabase_server_not_configured' }, 503);
    const paymobSecret = Deno.env.get('PAYMOB_SECRET_KEY');
    const paymobPublic = Deno.env.get('PAYMOB_PUBLIC_KEY');
    const integrationIds = String(Deno.env.get('PAYMOB_INTEGRATION_IDS') || '').split(',').map(x => Number(x.trim())).filter(Boolean);
    const appUrl = (Deno.env.get('APP_URL') || '').replace(/\/$/, '');
    const monthlyNetCents = Number(Deno.env.get('PREMIUM_MONTHLY_NET_AMOUNT_CENTS') || Deno.env.get('PREMIUM_MONTHLY_AMOUNT_CENTS') || 0);
    const yearlyNetCents = Number(Deno.env.get('PREMIUM_YEARLY_NET_AMOUNT_CENTS') || Deno.env.get('PREMIUM_YEARLY_AMOUNT_CENTS') || 0);
    if (!paymobSecret || !paymobPublic || !integrationIds.length || !appUrl) return json({ error: 'payment_not_configured' }, 503);

    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'not_authenticated' }, 401);
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) return json({ error: 'not_authenticated' }, 401);

    const body = await req.json();
    const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
    const paymentMethod = String(body.payment_method || 'cards');
    if (!['cards', 'apple_pay', 'google_pay', 'wallets'].includes(paymentMethod)) return json({ error: 'invalid_payment_method' }, 400);
    const phone = String(body.phone || '').trim();
    if (!/^\+?[0-9][0-9\s()-]{7,20}$/.test(phone)) return json({ error: 'valid_phone_required' }, 400);
    const targetNet = plan === 'yearly' ? yearlyNetCents : monthlyNetCents;
    const amount = grossUpCents(targetNet);
    if (!targetNet) return json({ error: 'premium_price_not_configured' }, 503);

    const orderRef = `SQ-${user.id.slice(0, 8)}-${crypto.randomUUID()}`;
    const { data: order, error: orderError } = await admin.from('payment_orders').insert({ user_id: user.id, plan, provider: 'paymob', status: 'pending', amount_cents: amount, currency: 'EGP', merchant_reference: orderRef }).select('id').single();
    if (orderError) throw orderError;

    const metadata = { studyquest_order_id: order.id, user_id: user.id, plan, payment_method: paymentMethod, target_net_cents: targetNet, charged_cents: amount };
    const intention = await fetch('https://accept.paymob.com/v1/intention/', {
      method: 'POST',
      headers: { Authorization: `Token ${paymobSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount, currency: 'EGP', payment_methods: selectedPaymobIntegrationIds(paymentMethod, integrationIds), special_reference: orderRef,
        items: [{ name: `StudyQuest Premium ${plan}`, amount, description: `StudyQuest Premium ${plan} subscription`, quantity: 1 }],
        billing_data: { first_name: user.user_metadata?.first_name || 'StudyQuest', last_name: user.user_metadata?.last_name || 'Student', email: user.email || 'customer@example.com', phone_number: phone, apartment: 'NA', building: 'NA', street: 'NA', floor: 'NA', city: 'NA', state: 'NA', country: 'EG', postal_code: 'NA', shipping_method: 'NA' },
        extras: metadata,
        notification_url: `${Deno.env.get('SUPABASE_FUNCTIONS_URL') || supabaseUrl + '/functions/v1'}/paymob-webhook`,
        redirection_url: `${appUrl}/?payment=complete&order=${encodeURIComponent(orderRef)}`,
      }),
    });
    const payload = await intention.json();
    if (!intention.ok || !payload.client_secret) {
      const { error: failRecordError } = await admin.from('payment_orders').update({ status: 'failed', provider_payload: payload }).eq('id', order.id);
      if (failRecordError) throw failRecordError;
      return json({ error: 'paymob_intention_failed' }, 502);
    }
    const safeProviderPayload = { ...payload };
    delete safeProviderPayload.client_secret;
    const { error: providerUpdateError } = await admin.from('payment_orders').update({ provider_intention_id: payload.id, provider_order_id: payload.intention_order_id, provider_payload: safeProviderPayload }).eq('id', order.id);
    if (providerUpdateError) {
      const { error: failRecordError } = await admin.from('payment_orders').update({ status: 'failed' }).eq('id', order.id);
      if (failRecordError) console.error('Could not mark unlinked checkout order failed', failRecordError);
      throw providerUpdateError;
    }
    const checkoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(paymobPublic)}&clientSecret=${encodeURIComponent(payload.client_secret)}`;
    return json({ checkoutUrl, orderId: order.id });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : 'checkout_failed' }, 500);
  }
});

