-- Theme version deprecation and content-addressed bundles.
-- Builds on 20261016000000 and 20261017000000. No-op where those tables do not exist.

do $$
begin
  if to_regclass('public.marketplace_theme_versions') is null then
    raise notice 'marketplace_theme_versions not found; skipping';
    return;
  end if;

  alter table public.marketplace_theme_versions add column if not exists bundle_hash text;
  alter table public.marketplace_theme_versions add column if not exists deprecated_at timestamptz;
  alter table public.marketplace_theme_versions add column if not exists deprecation_note text;
end $$;

-- Public bucket for immutable bundles at <theme_id>/<sha256>.json. Only the service role writes (no policies on purpose).
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('theme-bundles', 'theme-bundles', true)
    on conflict (id) do update set public = true;
  end if;
end $$;

-- A deprecated version stays loadable by sites already pinned to it, but cannot be restored or newly chosen.
create or replace function public.set_theme_version_deprecated(
  p_theme_id uuid,
  p_version integer,
  p_deprecated boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner boolean;
  v_admin boolean;
  v_published integer;
begin
  select exists (select 1 from public.marketplace_themes t join public.actors a on a.id = t.developer_id
                 where t.id = p_theme_id and a.user_id = auth.uid()) into v_owner;
  select exists (select 1 from public.actors where user_id = auth.uid() and role = 'admin') into v_admin;
  if not (v_owner or v_admin) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select published_version into v_published from public.marketplace_themes where id = p_theme_id;
  if p_deprecated and v_published is not distinct from p_version then
    raise exception 'the live version cannot be deprecated; make another version live first' using errcode = 'P0001';
  end if;

  update public.marketplace_theme_versions
     set deprecated_at = case when p_deprecated then now() else null end,
         deprecation_note = case when p_deprecated then left(p_note, 500) else null end
   where theme_id = p_theme_id and version = p_version and status = 'approved';
  if not found then
    raise exception 'only an approved version can be deprecated' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.set_theme_version_deprecated(uuid, integer, boolean, text) from public, anon;
grant execute on function public.set_theme_version_deprecated(uuid, integer, boolean, text) to authenticated;

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
   where theme_id = p_theme_id and version = p_version and status = 'approved'
     and compiled_bundle is not null and deprecated_at is null;
  if not found then
    raise exception 'only an approved, non-deprecated version can be restored' using errcode = 'P0001';
  end if;

  perform set_config('app.theme_internal', '1', true);
  update public.marketplace_themes
     set compiled_bundle = v_ver.compiled_bundle, published_version = v_ver.version, updated_at = now()
   where id = p_theme_id;
end;
$$;

-- Views: add the hash and deprecation info (columns appended so existing selects keep working).
do $$
begin
  if to_regclass('public.marketplace_theme_versions') is null then
    return;
  end if;

  execute $view$
    create or replace view public.marketplace_themes_public as
      select t.id, t.name, t.description, t.preview_color, t.site_price, t.global_price, t.developer_id,
             t.status, t.compiled_bundle, t.updated_at, t.published_version, v.bundle_hash
      from public.marketplace_themes t
      left join public.marketplace_theme_versions v
        on v.theme_id = t.id and v.version = t.published_version
      where t.compiled_bundle is not null
  $view$;

  execute $view$
    create or replace view public.marketplace_theme_versions_public as
      select theme_id, version, compiled_bundle, content_hash, bundle_hash, created_at, deprecated_at, deprecation_note
      from public.marketplace_theme_versions
      where status = 'approved' and compiled_bundle is not null
  $view$;

  grant select on public.marketplace_themes_public to anon, authenticated;
  grant select on public.marketplace_theme_versions_public to anon, authenticated;
end $$;
