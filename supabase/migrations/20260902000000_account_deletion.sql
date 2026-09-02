create table if not exists public.account_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  target_account_id uuid not null,
  target_auth_user_id uuid not null,
  account_type text not null check (account_type in ('actor', 'client')),
  deleted_at timestamptz not null default now()
);

revoke all on table public.account_deletion_audit from public, anon, authenticated;
grant insert on table public.account_deletion_audit to service_role;

create or replace function public.delete_account_data(
  p_account_id uuid,
  p_account_type text,
  p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_table text;
  predicates text;
  relation_exists boolean;
begin
  if p_account_type not in ('actor', 'client') then
    raise exception 'Invalid account type';
  end if;

  foreach current_table in array array[
    'demo_likes', 'actor_followers', 'messages', 'order_messages',
    'conversation_participants', 'conversations', 'offers', 'reviews',
    'deliveries', 'actor_recordings', 'recordings', 'script_demos',
    'video_demos', 'demos', 'portfolio_media_items', 'pro_site_reviews',
    'forms', 'leads', 'analytics_events', 'pro_products', 'pro_collections',
    'pro_shipping_rates', 'pro_customers', 'pro_orders', 'pro_pages',
    'portfolios', 'subscriptions', 'actor_payout_methods', 'orders',
    'store_orders', 'store_domains'
  ] loop
    select to_regclass(format('public.%I', current_table)) is not null into relation_exists;
    if not relation_exists then
      continue;
    end if;

    select string_agg(predicate, ' or ')
      into predicates
    from (
      select format('%I = $1', column_name) as predicate
      from information_schema.columns as c
      where c.table_schema = 'public'
        and c.table_name = current_table
        and column_name = 'actor_id'
      union all
      select format('%I = $1', column_name)
      from information_schema.columns as c
      where c.table_schema = 'public'
        and c.table_name = current_table
        and column_name = 'follower_id'
      union all
      select format('%I = $2', column_name)
      from information_schema.columns as c
      where c.table_schema = 'public'
        and c.table_name = current_table
        and column_name = 'client_id'
      union all
      select format('%I = $3', column_name)
      from information_schema.columns as c
      where c.table_schema = 'public'
        and c.table_name = current_table
        and column_name = 'user_id'
    ) predicates_list;

    if predicates is not null then
      execute format('delete from public.%I where %s', current_table, predicates)
        using p_account_id, p_account_id, p_auth_user_id;
    end if;
  end loop;

  if p_account_type = 'actor' then
    delete from public.actors where id = p_account_id and user_id = p_auth_user_id;
  else
    delete from public.clients where id = p_account_id and user_id = p_auth_user_id;
  end if;
end;
$$;

revoke all on function public.delete_account_data(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.delete_account_data(uuid, text, uuid) to service_role;
