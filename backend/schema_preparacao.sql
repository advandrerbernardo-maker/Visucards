-- VISUCARDS v0.4 | ESQUEMA PREPARADO; NÃO INSTALADO
-- Execute SOMENTE em projeto Supabase exclusivo, nunca no Recebi+.
-- Atenção: cotas e pagamento exigem Edge Functions seguras e testes reais de RLS.
create extension if not exists pgcrypto;
create table public.visu_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 1000),
  note text not null default '' check (char_length(note) <= 500),
  source_label text not null default '' check (char_length(source_label) <= 240),
  visual_style text not null default 'caderno' check (visual_style in ('caderno','quadrinhos','minimalista')),
  created_at timestamptz not null default now(),
  unique(id,user_id)
);
create index visu_cards_user_idx on public.visu_cards(user_id,created_at desc);
create table public.visu_reviews (
  card_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  next_due date not null,
  level smallint not null default 0 check (level between 0 and 4),
  last_reviewed date,
  updated_at timestamptz not null default now(),
  primary key(card_id,user_id),
  foreign key(card_id,user_id) references public.visu_cards(id,user_id) on delete cascade
);
create index visu_reviews_user_due_idx on public.visu_reviews(user_id,next_due);
create table public.visu_combos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  premium_included boolean not null default false,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.visu_combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.visu_combos(id) on delete cascade,
  position integer not null check (position >= 0),
  title text not null,
  body text not null,
  note text not null default '',
  source_label text not null default '',
  is_preview boolean not null default false,
  unique(combo_id,position)
);
create index visu_combo_items_combo_idx on public.visu_combo_items(combo_id);
create table public.visu_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  combo_id uuid not null references public.visu_combos(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key(user_id,combo_id)
);
create table public.visu_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('active','trialing','past_due','canceled','expired')),
  current_period_end timestamptz not null,
  provider_subscription_id text unique,
  created_at timestamptz not null default now()
);
create index visu_subscriptions_user_idx on public.visu_subscriptions(user_id,current_period_end desc);
create table public.visu_month_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_start date not null,
  pdf_count integer not null default 0 check (pdf_count >= 0),
  card_count integer not null default 0 check (card_count >= 0),
  primary key(user_id,month_start)
);
revoke all on public.visu_cards,public.visu_reviews,public.visu_combos,
 public.visu_combo_items,public.visu_entitlements,public.visu_subscriptions,public.visu_month_usage from anon,authenticated;
grant select on public.visu_cards,public.visu_reviews to authenticated;
grant insert (user_id,title,body,note,source_label,visual_style) on public.visu_cards to authenticated;
grant update (title,body,note,source_label,visual_style) on public.visu_cards to authenticated;
grant delete on public.visu_cards to authenticated;
grant insert (card_id,user_id,next_due,level,last_reviewed,updated_at) on public.visu_reviews to authenticated;
grant update (next_due,level,last_reviewed,updated_at) on public.visu_reviews to authenticated;
grant delete on public.visu_reviews to authenticated;
grant select on public.visu_combos,public.visu_combo_items to anon,authenticated;
grant select on public.visu_entitlements,public.visu_subscriptions,public.visu_month_usage to authenticated;
alter table public.visu_cards enable row level security;
alter table public.visu_reviews enable row level security;
alter table public.visu_combos enable row level security;
alter table public.visu_combo_items enable row level security;
alter table public.visu_entitlements enable row level security;
alter table public.visu_subscriptions enable row level security;
alter table public.visu_month_usage enable row level security;
create policy visu_cards_read on public.visu_cards for select to authenticated using ((select auth.uid())=user_id);
create policy visu_cards_insert on public.visu_cards for insert to authenticated with check ((select auth.uid())=user_id);
create policy visu_cards_update on public.visu_cards for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy visu_cards_delete on public.visu_cards for delete to authenticated using ((select auth.uid())=user_id);
create policy visu_reviews_read on public.visu_reviews for select to authenticated using ((select auth.uid())=user_id);
create policy visu_reviews_insert on public.visu_reviews for insert to authenticated with check ((select auth.uid())=user_id);
create policy visu_reviews_update on public.visu_reviews for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy visu_reviews_delete on public.visu_reviews for delete to authenticated using ((select auth.uid())=user_id);
create policy visu_combos_public on public.visu_combos for select to anon,authenticated using (published);
create policy visu_combo_items_preview on public.visu_combo_items for select to anon using (
 is_preview and exists(select 1 from public.visu_combos b where b.id=combo_id and b.published)
);
create policy visu_combo_items_access on public.visu_combo_items for select to authenticated using (
 exists(select 1 from public.visu_combos b where b.id=combo_id and b.published)
 and (is_preview or exists(select 1 from public.visu_entitlements e
    where e.combo_id=visu_combo_items.combo_id and e.user_id=(select auth.uid()) and e.revoked_at is null)
 or (exists(select 1 from public.visu_combos b where b.id=combo_id and b.premium_included)
 and exists(select 1 from public.visu_subscriptions s where s.user_id=(select auth.uid())
 and s.status in ('active','trialing') and s.current_period_end>now())))
);
create policy visu_entitlement_owner_read on public.visu_entitlements for select to authenticated using ((select auth.uid())=user_id);
create policy visu_subscription_owner_read on public.visu_subscriptions for select to authenticated using ((select auth.uid())=user_id);
create policy visu_usage_owner_read on public.visu_month_usage for select to authenticated using ((select auth.uid())=user_id);
-- NUNCA permitir escrita client-side em visu_entitlements/visu_subscriptions/visu_month_usage.
-- Backend futuro deve validar arquivos reais e webhooks antes de gerar cards ou vender combos.
