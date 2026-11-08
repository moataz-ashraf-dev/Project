-- Run with `supabase test db` against a test project.
-- This file documents the minimum security invariants for the production foundation.
-- Full authenticated-user fixtures should be added in CI with Supabase test helpers.

select has_table_privilege('anon', 'public.economy_accounts', 'select') = false as anon_cannot_read_economy;
select has_table_privilege('authenticated', 'public.economy_accounts', 'update') = false as client_cannot_update_economy;
select has_table_privilege('authenticated', 'public.economy_transactions', 'insert') = false as client_cannot_insert_ledger;
select has_function_privilege('authenticated', 'public.complete_study_session(uuid,integer,text,text)', 'execute') as authenticated_can_complete_session;
