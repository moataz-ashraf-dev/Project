import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

function hex(bytes: ArrayBuffer) { return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join(''); }
async function hmacSha512(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false; let x = 0; for (let i=0;i<a.length;i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0;
}
type PaymobCallback = { amount_cents?: unknown; created_at?: unknown; currency?: unknown; error_occured?: unknown; has_parent_transaction?: unknown; id?: unknown; integration_id?: unknown; is_3d_secure?: unknown; is_auth?: unknown; is_capture?: unknown; is_refunded?: unknown; is_standalone_payment?: unknown; is_voided?: unknown; order?: { id?: unknown }; owner?: unknown; pending?: unknown; source_data?: { pan?: unknown; sub_type?: unknown; type?: unknown }; success?: unknown; hmac?: unknown };
function callbackString(o: PaymobCallback) {
  const fields = [o.amount_cents,o.created_at,o.currency,o.error_occured,o.has_parent_transaction,o.id,o.integration_id,o.is_3d_secure,o.is_auth,o.is_capture,o.is_refunded,o.is_standalone_payment,o.is_voided,o.order?.id,o.owner,o.pending,o.source_data?.pan,o.source_data?.sub_type,o.source_data?.type,o.success];
  return fields.map(v => String(v ?? '')).join('');
}
const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });
    const body = await req.json(); const obj = (body?.obj || body) as PaymobCallback;
    const received = String(body?.hmac || obj?.hmac || '');
    const secret = Deno.env.get('PAYMOB_HMAC_SECRET'); if (!secret || !received) return new Response('Unauthorized', { status: 401, headers: cors });
    const computed = await hmacSha512(secret, callbackString(obj)); if (!constantTimeEqual(computed, received.toLowerCase())) return new Response('Invalid HMAC', { status: 401, headers: cors });
    const secretKeysRaw = Deno.env.get('SUPABASE_SECRET_KEYS');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || (secretKeysRaw ? JSON.parse(secretKeysRaw).default : '');
    if (!serviceKey) return new Response('Server misconfigured', { status: 503, headers: cors });
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
    const orderId = Number(obj?.order?.id); const success = Boolean(obj?.success) && !obj?.error_occured;
    const { data: order } = await admin.from('payment_orders').select('*').eq('provider_order_id', orderId).maybeSingle();
    if (!order) return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: cors });
    if (order.status === 'paid') {
      if (order.purchase_type !== 'gems' && !String(order.plan || '').startsWith('gems_')) {
        const { error: giftError } = await admin.rpc('grant_premium_purchase_gift', { p_user_id: order.user_id, p_order_id: order.id, p_gem_amount: order.plan === 'yearly' ? 800 : 300 });
        if (giftError) throw giftError;
      }
      return new Response(JSON.stringify({ ok: true, already_processed: true }), { headers: cors });
    }
    const expectedAmount = Number(order.amount_cents);
    const callbackAmount = Number(obj?.amount_cents);
    const callbackCurrency = String(obj?.currency || '');
    if (callbackCurrency !== order.currency || callbackAmount !== expectedAmount) {
      const { error: mismatchUpdate } = await admin.from('payment_orders').update({ status: 'failed', provider_transaction_id: String(obj.id), webhook_payload: body }).eq('id', order.id);
      if (mismatchUpdate) throw mismatchUpdate;
      return new Response('Amount mismatch', { status: 400, headers: cors });
    }
    if (!success) {
      const { error: failedUpdate } = await admin.from('payment_orders').update({ status: 'failed', provider_transaction_id: String(obj.id), webhook_payload: body }).eq('id', order.id);
      if (failedUpdate) throw failedUpdate;
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }
    {
      if (order.purchase_type === 'gems' || String(order.plan || '').startsWith('gems_')) {
        const gemAmount = Number(order.gem_amount || 0);
        if (!gemAmount) return new Response('Gem amount missing', { status: 500, headers: cors });
        const { error: creditError } = await admin.rpc('credit_gems_from_payment', { p_user_id: order.user_id, p_order_id: order.id, p_gem_amount: gemAmount });
        if (creditError) throw creditError;
      } else {
        const days = order.plan === 'yearly' ? 365 : 30;
        const { data: currentEntitlement, error: currentEntitlementError } = await admin.from('premium_entitlements').select('current_period_end,provider_transaction_id').eq('user_id', order.user_id).maybeSingle();
        if (currentEntitlementError) throw currentEntitlementError;
        const sameTransaction = currentEntitlement?.provider_transaction_id === String(obj.id);
        const currentEnd = currentEntitlement?.current_period_end ? new Date(currentEntitlement.current_period_end).getTime() : 0;
        const baseTime = sameTransaction ? currentEnd : Math.max(Date.now(), currentEnd);
        const until = new Date(baseTime + (sameTransaction ? 0 : days * 86400000)).toISOString();
        const { error: entitlementError } = await admin.from('premium_entitlements').upsert({ user_id: order.user_id, status: 'active', plan: order.plan, provider: 'paymob', provider_transaction_id: String(obj.id), current_period_end: until }, { onConflict: 'user_id' });
        if (entitlementError) throw entitlementError;
        const { error: giftError } = await admin.rpc('grant_premium_purchase_gift', { p_user_id: order.user_id, p_order_id: order.id, p_gem_amount: order.plan === 'yearly' ? 800 : 300 });
        if (giftError) throw giftError;
      }
    }
    const { error: paidUpdate } = await admin.from('payment_orders').update({ status: 'paid', provider_transaction_id: String(obj.id), webhook_payload: body }).eq('id', order.id);
    if (paidUpdate) throw paidUpdate;
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  } catch (e) { console.error(e); return new Response(JSON.stringify({ error: 'webhook_failed' }), { status: 500, headers: cors }); }
});
