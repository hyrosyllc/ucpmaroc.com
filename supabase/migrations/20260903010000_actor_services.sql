create table if not exists public.actor_services (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actors(id) on delete cascade,
  service_id text not null,
  enabled boolean not null default false,
  description text,
  rate numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actor_id, service_id)
);

alter table public.actor_services enable row level security;

drop policy if exists "Enabled actor services are publicly readable" on public.actor_services;
create policy "Enabled actor services are publicly readable"
  on public.actor_services for select
  using (enabled or exists (
    select 1 from public.actors
    where actors.id = actor_services.actor_id
      and actors.user_id = auth.uid()
  ));

drop policy if exists "Actors manage their own services" on public.actor_services;
create policy "Actors manage their own services"
  on public.actor_services for all
  using (exists (
    select 1 from public.actors
    where actors.id = actor_services.actor_id
      and actors.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.actors
    where actors.id = actor_services.actor_id
      and actors.user_id = auth.uid()
  ));

grant select on public.actor_services to anon, authenticated;
grant insert, update, delete on public.actor_services to authenticated;
