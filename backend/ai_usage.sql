-- VISUCARDS AI: executar SOMENTE no projeto Supabase exclusivo VISUCARDS.
-- Este arquivo não foi executado em qualquer banco. Nunca aplicar no Recebi+.
-- Segurança: sem escrita do cliente, limite atômico por usuário autenticado.
create table if not exists public.visu_ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  calls integer not null default 0 check (calls between 0 and 10),
  created_at timestamptz not null default now(),
  primary key (user_id,day)
);

alter table public.visu_ai_daily_usage enable row level security;
revoke all on public.visu_ai_daily_usage from public,anon,authenticated;
-- Somente a Edge Function validada acessa como service_role.

create or replace function public.visu_ai_reserve(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public,pg_temp
as $$
declare new_calls integer;
begin
  if p_user is null then return false; end if;
  insert into public.visu_ai_daily_usage(user_id,day,calls)
    values (p_user,(now() at time zone 'UTC')::date,1)
    on conflict (user_id,day) do update
      set calls=public.visu_ai_daily_usage.calls+1
      where public.visu_ai_daily_usage.calls < 10
    returning calls into new_calls;
  return new_calls is not null;
end;
$$;
revoke all on function public.visu_ai_reserve(uuid) from public,anon,authenticated;
grant execute on function public.visu_ai_reserve(uuid) to service_role;

-- Validar em um projeto separado após aplicar:
-- select relrowsecurity from pg_class where oid='public.visu_ai_daily_usage'::regclass;
-- select grantee,privilege_type from information_schema.routine_privileges
--  where routine_name='visu_ai_reserve';
