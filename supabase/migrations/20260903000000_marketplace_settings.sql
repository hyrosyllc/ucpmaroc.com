create table if not exists public.marketplace_settings (
  id boolean primary key default true check (id),
  allowed_service_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.marketplace_settings (id, allowed_service_ids)
values (
  true,
  array[
    'voice_over', 'scriptwriting', 'video_editing', 'delivery',
    'transportation', 'tutoring', 'home_services', 'wellness',
    'repair', 'events', 'marketing', 'design'
  ]
)
on conflict (id) do nothing;

alter table public.marketplace_settings enable row level security;

drop policy if exists "Marketplace settings are publicly readable" on public.marketplace_settings;
create policy "Marketplace settings are publicly readable"
  on public.marketplace_settings for select
  using (true);

drop policy if exists "Admins can update marketplace settings" on public.marketplace_settings;
create policy "Admins can update marketplace settings"
  on public.marketplace_settings for update
  using (
    exists (
      select 1
      from public.actors
      where actors.user_id = auth.uid()
        and actors.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.actors
      where actors.user_id = auth.uid()
        and actors.role = 'admin'
    )
  );

grant select on public.marketplace_settings to anon, authenticated;
grant update on public.marketplace_settings to authenticated;
