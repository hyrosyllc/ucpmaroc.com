-- Add auto-top-up configuration columns to actors table.
alter table public.actors
  add column if not exists auto_topup_enabled boolean default false,
  add column if not exists auto_topup_threshold integer default 50,
  add column if not exists auto_topup_amount numeric(10, 2) default 20.00;

create index if not exists actors_auto_topup_enabled_idx
  on public.actors(auto_topup_enabled)
  where auto_topup_enabled = true;
