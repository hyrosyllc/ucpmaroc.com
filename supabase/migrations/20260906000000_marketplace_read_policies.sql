-- Protect marketplace reads without assuming the legacy table migrations are present here.

do $$
begin
  if to_regclass('public.orders') is not null then
    execute 'alter table public.orders enable row level security';
    execute 'drop policy if exists "Marketplace participants can read orders" on public.orders';
    execute $policy$
      create policy "Marketplace participants can read orders"
        on public.orders for select
        using (
          exists (
            select 1 from public.actors
            where actors.id = orders.actor_id
              and actors.user_id = auth.uid()
          )
          or exists (
            select 1 from public.clients
            where clients.id = orders.client_id
              and clients.user_id = auth.uid()
          )
          or lower(coalesce(orders.client_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          or exists (
            select 1 from public.actors
            where actors.user_id = auth.uid()
              and actors.role = 'admin'
          )
        )
    $policy$;
  end if;

  if to_regclass('public.offers') is not null then
    execute 'alter table public.offers enable row level security';
    execute 'drop policy if exists "Marketplace participants can read offers" on public.offers';
    execute $policy$
      create policy "Marketplace participants can read offers"
        on public.offers for select
        using (
          exists (
            select 1
            from public.orders
            join public.actors on actors.id = orders.actor_id
            where orders.id = offers.order_id
              and actors.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.orders
            join public.clients on clients.id = orders.client_id
            where orders.id = offers.order_id
              and clients.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.orders
            where orders.id = offers.order_id
              and lower(coalesce(orders.client_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
          or exists (
            select 1 from public.actors
            where actors.user_id = auth.uid()
              and actors.role = 'admin'
          )
        )
    $policy$;
  end if;

  if to_regclass('public.reviews') is not null then
    execute 'alter table public.reviews enable row level security';
    execute 'drop policy if exists "Marketplace reviews are publicly readable" on public.reviews';
    execute $policy$
      create policy "Marketplace reviews are publicly readable"
        on public.reviews for select
        using (true)
    $policy$;
  end if;
end $$;
