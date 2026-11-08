import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const configuredOrigins = (Deno.env.get('APP_ORIGINS') ?? Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173').split(',').map((v) => v.trim()).filter(Boolean);
const corsHeadersFor = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && configuredOrigins.includes(origin) ? origin : configuredOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
});

type PlannerTask = {
  title: string;
  notes?: string;
  start_at?: string;
  duration_minutes: number;
  subject_name?: string;
};

type PlannerOutput = { title: string; tasks: PlannerTask[] };

function normalizePlan(input: unknown): PlannerOutput {
  const raw = input as Partial<PlannerOutput> | null;
  const tasks = Array.isArray(raw?.tasks) ? raw.tasks : [];
  const safeTasks = tasks.slice(0, 30).map((task) => ({
    title: String((task as PlannerTask).title ?? 'Study task').trim().slice(0, 160) || 'Study task',
    notes: String((task as PlannerTask).notes ?? '').trim().slice(0, 500) || undefined,
    start_at: typeof (task as PlannerTask).start_at === 'string' ? (task as PlannerTask).start_at : undefined,
    duration_minutes: Math.max(5, Math.min(240, Math.round(Number((task as PlannerTask).duration_minutes) || 25))),
    subject_name: String((task as PlannerTask).subject_name ?? '').trim().slice(0, 80) || undefined,
  }));
  return { title: String(raw?.title ?? ({ar:'خطة دراسة بكرة',ja:'明日の学習プラン',fr:'Plan d’étude de demain',de:'Lernplan für morgen',en:'Tomorrow Study Plan'} as Record<string,string>)[language]).trim().slice(0, 100) || 'Tomorrow Study Plan', tasks: safeTasks };
}

async function main(req: Request) {
  const corsHeaders = corsHeadersFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const aiKey = Deno.env.get('GEMINI_API_KEY');
  const aiModel = Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-3.5-flash-lite';
  if (!aiKey) return new Response(JSON.stringify({ error: 'ai_not_configured' }), { status: 503, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'missing_authorization' }), { status: 401, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });

  const body = await req.json().catch(() => ({}));
  // Remove control characters that can break prompt formatting.
  // eslint-disable-next-line no-control-regex
  const prompt = String(body.prompt ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 5000);
  const planDate = String(body.plan_date ?? '').trim();
  const timezone = String(body.timezone ?? 'UTC').trim().slice(0, 80);
  const language = ['ar','en','ja','fr','de'].includes(String(body.language)) ? String(body.language) : 'en';
  if (!prompt || !/^\d{4}-\d{2}-\d{2}$/.test(planDate) || timezone.length < 1) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
  }

  const { data: entitlement } = await supabase.from('premium_entitlements').select('status,current_period_end').eq('user_id', user.id).maybeSingle();
  const premiumActive = entitlement?.status === 'active' && (!entitlement.current_period_end || new Date(entitlement.current_period_end).getTime() > Date.now());
  const { data: quotaAllowed, error: quotaError } = await supabase.rpc('consume_planner_quota', { p_limit: premiumActive ? 40 : 10 });
  if (quotaError) {
    console.error('planner quota error', quotaError.message);
    return new Response(JSON.stringify({ error: 'quota_check_failed' }), { status: 503, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
  }
  if (!quotaAllowed) return new Response(JSON.stringify({ error: 'planner_daily_limit' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' } });

  // This endpoint is specifically the Tomorrow Planner; reject arbitrary dates.
  let tomorrow = '';
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (!y || !m || !d) throw new Error('date_parts');
    const base = new Date(`${y}-${m}-${d}T12:00:00Z`);
    base.setUTCDate(base.getUTCDate() + 1);
    tomorrow = base.toISOString().slice(0, 10);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_timezone' }), { status: 400, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
  }
  if (planDate !== tomorrow) {
    return new Response(JSON.stringify({ error: 'plan_must_be_tomorrow' }), { status: 400, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
  }

  const plannerLanguage = ({ar:'Arabic',en:'English',ja:'Japanese',fr:'French',de:'German'} as Record<string,string>)[language] || 'English';
  const plannerSystem = `You are StudyQuest's Tomorrow Planner. Turn ONLY the student's NEW tasks into schedule cards to append to the existing plan, if one exists. Never replace existing tasks. Build the schedule for ${planDate} in timezone ${timezone}. Respond with all human-readable title, task title, notes, and subject names in ${plannerLanguage}. This endpoint is a planner, not a tutor or chat assistant. Never invent assignments the student did not mention. You may estimate missing durations between 15 and 90 minutes. If exact times are missing, choose sensible study times and avoid overlap. Return ONLY JSON matching the requested schema. Every task must contain title, notes, duration_minutes, start_at, and subject_name when inferable. start_at must be a full ISO-8601 timestamp for the requested date and timezone. Do not add rewards, XP, Coins, Gems, ranks, or academic scores.`;
  const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(aiModel)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': aiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${plannerSystem}\n\nStudent's new tasks to add:\n${prompt}` }] }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 1800,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  notes: { type: 'string' },
                  start_at: { type: 'string' },
                  duration_minutes: { type: 'integer' },
                  subject_name: { type: 'string' },
                },
                required: ['title', 'notes', 'start_at', 'duration_minutes', 'subject_name'],
              },
            },
          },
          required: ['title', 'tasks'],
        },
      },
    }),
  });

  if (!aiResponse.ok) {
    const detail = await aiResponse.text();
    console.error('AI provider error', detail.slice(0, 1000));
    return new Response(JSON.stringify({ error: 'ai_provider_error', detail: detail.slice(0,1000) }), { status: 502, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
  }

  const ai = await aiResponse.json();
  const text = ai?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part?.text ?? '').join('') ?? '{}';
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = { title: 'Tomorrow Study Plan', tasks: [] }; }
const plan = normalizePlan(parsed);
  let totalMinutes = 0;
  const boundedTasks = [];
  for (const task of plan.tasks) {
    if (totalMinutes >= 720) break;
    const duration = Math.min(task.duration_minutes, 720 - totalMinutes);
    if (duration < 5) break;
    boundedTasks.push({ ...task, duration_minutes: duration });
    totalMinutes += duration;
  }
  plan.tasks = boundedTasks;

  const { error: upsertError } = await supabase.from('study_plans').upsert({
    user_id: user.id,
    plan_date: planDate,
    source: 'ai',
    prompt,
    title: plan.title,
    timezone,
    status: 'active',
  }, { onConflict: 'user_id,plan_date' });
  if (upsertError) throw upsertError;

  const { data: savedPlan, error: planError } = await supabase.from('study_plans').select('id').eq('user_id', user.id).eq('plan_date', planDate).single();
  if (planError || !savedPlan) throw planError ?? new Error('plan_not_saved');

  const { data: existingTasks, error: existingTasksError } = await supabase.from('study_plan_tasks').select('position').eq('plan_id', savedPlan.id).eq('user_id', user.id);
  if (existingTasksError) throw existingTasksError;
  const nextPosition = (existingTasks ?? []).reduce((max, task) => Math.max(max, Number(task.position)), -1) + 1;
  if (nextPosition + plan.tasks.length > 200) {
    return new Response(JSON.stringify({ error: 'plan_task_limit_reached' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id,name')
    .eq('user_id', user.id);
  if (subjectsError) throw subjectsError;
  const subjectByName = new Map((subjects ?? []).map((s: { id: string; name: string }) => [s.name.trim().toLowerCase(), s.id]));

  const taskRows = plan.tasks.map((task, index) => {
    const subjectId = task.subject_name ? subjectByName.get(task.subject_name.trim().toLowerCase()) ?? null : null;
    const parsedStart = task.start_at ? new Date(task.start_at) : null;
    return {
      plan_id: savedPlanId,
      user_id: user.id,
      subject_id: subjectId,
      position: nextPosition + index,
      title: task.title,
      notes: task.notes ?? null,
      start_at: parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart.toISOString() : null,
      duration_minutes: task.duration_minutes,
      status: 'pending',
    };
  });
  const { error: taskError } = await supabase.from('study_plan_tasks').insert(taskRows);
  if (taskError) throw taskError;
  return new Response(JSON.stringify({ ...plan, plan_id: savedPlanId }), { status: 200, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
}

serve((req) => main(req).catch((error) => {
  console.error(error);
  return new Response(JSON.stringify({ error: 'server_error', detail: String(error?.message ?? error) }), { status: 500, headers: { ...corsHeadersFor(req.headers.get('Origin')), 'Content-Type': 'application/json' } });
}));
