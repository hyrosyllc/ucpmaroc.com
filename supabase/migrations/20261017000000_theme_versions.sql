-- Immutable theme versions: every submission is a snapshot; approval publishes a version; rollback re-points to an approved one.
-- Builds on 20261016000000_theme_studio_hardening.sql. No-op where marketplace_themes does not exist.

do $$
begin
  if to_regclass('public.marketplace_themes') is null then
    raise notice 'marketplace_themes not found; skipping theme versions';
    return;
  end if;

  alter table public.marketplace_themes add column if not exists published_version integer;

  create table if not exists public.marketplace_theme_versions (
    id uuid primary key default gen_random_uuid(),
    theme_id uuid not null references public.marketplace_themes(id) on delete cascade,
    version integer not null,
    files jsonb not null,
    compiled_bundle jsonb,
    content_hash text not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
    rejection_reason text,
    submitted_by uuid,
    reviewed_by uuid,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    unique (theme_id, version)
  );

  create index if not exists marketplace_theme_versions_theme_idx on public.marketplace_theme_versions (theme_id, version desc);
  alter table public.marketplace_theme_versions enable row level security;
  grant select on public.marketplace_theme_versions to authenticated;

  drop policy if exists "Developers and admins read theme versions" on public.marketplace_theme_versions;
  create policy "Developers and admins read theme versions"
    on public.marketplace_theme_versions for select
    using (
      exists (
        select 1 from public.marketplace_themes t
        join public.actors a on a.id = t.developer_id
        where t.id = marketplace_theme_versions.theme_id and a.user_id = auth.uid()
      )
      or exists (select 1 from public.actors a where a.user_id = auth.uid() and a.role = 'admin')
    );
  -- No insert/update policies: versions change only through the functions below and the service role.

  -- Backfill: approved themes become version 1 (published); themes in review get a pending version 1.
  insert into public.marketplace_theme_versions (theme_id, version, files, compiled_bundle, content_hash, status)
  select t.id, 1, coalesce(t.files, '{}'::jsonb), t.compiled_bundle, md5(coalesce(t.files, '{}'::jsonb)::text),
         case when t.compiled_bundle is not null then 'approved' else 'pending' end
  from public.marketplace_themes t
  where (t.compiled_bundle is not null or t.status = 'pending_review')
    and not exists (select 1 from public.marketplace_theme_versions v where v.theme_id = t.id);

  update public.marketplace_themes t
     set published_version = 1
   where t.compiled_bundle is not null and t.published_version is null;
end $$;

-- The write guard must let these functions (and only these) update protected columns.
create or replace function public.guard_marketplace_theme_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(current_setting('app.theme_internal', true), '') = '1' then
    return new;
  end if;

  if exists (select 1 from public.actors where user_id = auth.uid() and role = 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.compiled_bundle := null;
    new.published_version := null;
    new.status := 'draft';
    new.rejection_reason := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    return new;
  end if;

  new.compiled_bundle := old.compiled_bundle;
  new.published_version := old.published_version;
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

-- Editing files while a version is in review withdraws that version.
create or replace function public.withdraw_pending_versions_on_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.files is distinct from old.files and old.status = 'pending_review' then
    update public.marketplace_theme_versions
       set status = 'withdrawn'
     where theme_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.marketplace_themes') is null then
    return;
  end if;

  drop trigger if exists withdraw_pending_versions_on_edit on public.marketplace_themes;
  create trigger withdraw_pending_versions_on_edit
    after update of files on public.marketplace_themes
    for each row execute function public.withdraw_pending_versions_on_edit();
end $$;

-- Developer submits the current files as a new version.
create or replace function public.submit_theme_version(p_theme_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_theme public.marketplace_themes%rowtype;
  v_actor uuid;
  v_next integer;
begin
  select a.id into v_actor from public.actors a where a.user_id = auth.uid();

  select * into v_theme from public.marketplace_themes where id = p_theme_id for update;
  if not found or v_theme.developer_id is distinct from v_actor then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_theme.status = 'pending_review' then
    raise exception 'already in review' using errcode = 'P0001';
  end if;
  if v_theme.files is null or v_theme.files = '{}'::jsonb then
    raise exception 'theme has no files' using errcode = 'P0001';
  end if;

  select coalesce(max(version), 0) + 1 into v_next from public.marketplace_theme_versions where theme_id = p_theme_id;

  insert into public.marketplace_theme_versions (theme_id, version, files, content_hash, status, submitted_by)
  values (p_theme_id, v_next, v_theme.files, md5(v_theme.files::text), 'pending', v_actor);

  update public.marketplace_themes set status = 'pending_review', rejection_reason = null where id = p_theme_id;
  return v_next;
end;
$$;

-- Developer (own theme) or admin re-publishes a previously approved version.
create or replace function public.rollback_theme_version(p_theme_id uuid, p_version integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ver public.marketplace_theme_versions%rowtype;
  v_owner boolean;
  v_admin boolean;
begin
  select exists (select 1 from public.marketplace_themes t join public.actors a on a.id = t.developer_id
                 where t.id = p_theme_id and a.user_id = auth.uid()) into v_owner;
  select exists (select 1 from public.actors where user_id = auth.uid() and role = 'admin') into v_admin;
  if not (v_owner or v_admin) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select * into v_ver from public.marketplace_theme_versions
   where theme_id = p_theme_id and version = p_version and status = 'approved' and compiled_bundle is not null;
  if not found then
    raise exception 'only an approved version can be restored' using errcode = 'P0001';
  end if;

  perform set_config('app.theme_internal', '1', true);
  update public.marketplace_themes
     set compiled_bundle = v_ver.compiled_bundle, published_version = v_ver.version, updated_at = now()
   where id = p_theme_id;
end;
$$;

revoke all on function public.submit_theme_version(uuid) from public, anon;
revoke all on function public.rollback_theme_version(uuid, integer) from public, anon;
grant execute on function public.submit_theme_version(uuid) to authenticated;
grant execute on function public.rollback_theme_version(uuid, integer) to authenticated;

-- Pinning: sites may load a specific approved version; the theme view keeps serving the published one.
do $$
begin
  if to_regclass('public.marketplace_theme_versions') is null then
    return;
  end if;

  execute $view$
    create or replace view public.marketplace_theme_versions_public as
      select theme_id, version, compiled_bundle, content_hash
      from public.marketplace_theme_versions
      where status = 'approved' and compiled_bundle is not null
  $view$;
  grant select on public.marketplace_theme_versions_public to anon, authenticated;
end $$;
