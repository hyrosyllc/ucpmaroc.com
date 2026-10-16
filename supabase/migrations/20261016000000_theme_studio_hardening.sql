-- Theme Studio hardening: who may write bundles/status, and who may read theme source.
-- Guarded so it is a no-op where the legacy marketplace_themes table does not exist.

do $$
begin
  if to_regclass('public.marketplace_themes') is null then
    raise notice 'marketplace_themes not found; skipping theme hardening';
    return;
  end if;

  alter table public.marketplace_themes add column if not exists rejection_reason text;
  alter table public.marketplace_themes add column if not exists reviewed_at timestamptz;
  alter table public.marketplace_themes add column if not exists reviewed_by uuid;

  alter table public.marketplace_themes enable row level security;
end $$;

-- Only admins (and the service role) may set the compiled bundle or decide review outcomes.
-- Developers may only submit (draft/rejected/approved -> pending_review) or withdraw (pending_review -> draft).
create or replace function public.guard_marketplace_theme_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- service role / internal jobs
  end if;

  if exists (select 1 from public.actors where user_id = auth.uid() and role = 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.compiled_bundle := null;
    new.status := 'draft';
    new.rejection_reason := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    return new;
  end if;

  new.compiled_bundle := old.compiled_bundle;
  new.rejection_reason := old.rejection_reason;
  new.reviewed_at := old.reviewed_at;
  new.reviewed_by := old.reviewed_by;
  new.developer_id := old.developer_id;

  if new.status is distinct from old.status then
    if not (
      (old.status in ('draft', 'rejected', 'approved') and new.status = 'pending_review')
      or (old.status = 'pending_review' and new.status = 'draft')
    ) then
      new.status := old.status;
    end if;
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.marketplace_themes') is null then
    return;
  end if;

  drop trigger if exists guard_marketplace_theme_write on public.marketplace_themes;
  create trigger guard_marketplace_theme_write
    before insert or update on public.marketplace_themes
    for each row execute function public.guard_marketplace_theme_write();
end $$;

-- Source files stay private: replace any SELECT-only policies with owner/admin access.
-- Bundles (the minified code browsers already receive) are served through the public view below.
do $$
declare
  p record;
begin
  if to_regclass('public.marketplace_themes') is null then
    return;
  end if;

  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'marketplace_themes' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.marketplace_themes', p.policyname);
  end loop;

  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'marketplace_themes' and cmd = 'ALL'
  loop
    raise notice 'REVIEW: policy "%" on marketplace_themes applies to all commands and may still expose theme source', p.policyname;
  end loop;

  create policy "Developers and admins read theme source"
    on public.marketplace_themes for select
    using (
      exists (select 1 from public.actors a where a.id = marketplace_themes.developer_id and a.user_id = auth.uid())
      or exists (select 1 from public.actors a where a.user_id = auth.uid() and a.role = 'admin')
    );

  -- security_invoker is off on purpose: the view runs as its owner so it can read the private table.
  execute $view$
    create or replace view public.marketplace_themes_public as
      select id, name, description, preview_color, site_price, global_price, developer_id, status, compiled_bundle, updated_at
      from public.marketplace_themes
      where compiled_bundle is not null
  $view$;

  grant select on public.marketplace_themes_public to anon, authenticated;
end $$;
