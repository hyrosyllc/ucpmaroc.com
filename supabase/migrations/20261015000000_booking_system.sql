-- In-platform scheduling: services, weekly availability, bookings, Google Calendar connection.
-- Public visitors never read `bookings`; availability and creation go through Edge Functions (service role).

create extension if not exists btree_gist;

create or replace function public.owns_portfolio(p_portfolio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portfolios p
    join public.actors a on a.id = p.actor_id
    where p.id = p_portfolio_id
      and a.user_id = auth.uid()
  );
$$;

revoke all on function public.owns_portfolio(uuid) from public;
grant execute on function public.owns_portfolio(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Settings (one row per portfolio)
-- ---------------------------------------------------------------------------
create table if not exists public.booking_settings (
  portfolio_id uuid primary key references public.portfolios(id) on delete cascade,
  timezone text not null default 'UTC',
  min_notice_hours integer not null default 12 check (min_notice_hours >= 0),
  max_days_ahead integer not null default 60 check (max_days_ahead between 1 and 365),
  slot_step_min integer not null default 15 check (slot_step_min between 5 and 240),
  auto_confirm boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
create table if not exists public.booking_services (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  duration_min integer not null check (duration_min between 5 and 1440),
  buffer_before_min integer not null default 0 check (buffer_before_min between 0 and 240),
  buffer_after_min integer not null default 0 check (buffer_after_min between 0 and 240),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'USD',
  location_type text not null default 'online' check (location_type in ('in_person', 'online', 'phone')),
  location_details text,
  -- 'none': pay outside the platform. 'deposit'/'full': card payment via the site's Stripe account.
  payment_mode text not null default 'none' check (payment_mode in ('none', 'deposit', 'full')),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_services_portfolio_idx on public.booking_services (portfolio_id, sort_order);

-- ---------------------------------------------------------------------------
-- Weekly availability and date exceptions (local times in booking_settings.timezone)
-- ---------------------------------------------------------------------------
create table if not exists public.booking_availability_rules (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create index if not exists booking_availability_rules_portfolio_idx
  on public.booking_availability_rules (portfolio_id, weekday);

create table if not exists public.booking_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  on_date date not null,
  is_closed boolean not null default true,
  start_time time,
  end_time time,
  note text,
  check (is_closed or (start_time is not null and end_time is not null and end_time > start_time))
);

create index if not exists booking_availability_exceptions_portfolio_idx
  on public.booking_availability_exceptions (portfolio_id, on_date);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  service_id uuid references public.booking_services(id) on delete set null,
  service_name text not null,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_email text not null check (customer_email like '%_@_%'),
  customer_phone text,
  notes text,
  customer_timezone text not null default 'UTC',
  start_at timestamptz not null,
  end_at timestamptz not null,
  -- start/end widened by the service buffers; used for the overlap guard.
  blocked_start timestamptz not null,
  blocked_end timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  price_cents integer not null default 0,
  currency text not null default 'USD',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded', 'not_required')),
  amount_due_cents integer not null default 0 check (amount_due_cents >= 0),
  stripe_payment_intent_id text unique,
  -- Unpaid pending bookings hold their slot only until this time.
  hold_expires_at timestamptz,
  reminder_sent_at timestamptz,
  manage_token_hash text not null unique,
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  check (blocked_start <= start_at and blocked_end >= end_at),
  -- One active booking at a time per portfolio (single provider, capacity 1).
  constraint bookings_no_overlap exclude using gist (
    portfolio_id with =,
    tstzrange(blocked_start, blocked_end) with &&
  ) where (status in ('pending', 'confirmed'))
);

create index if not exists bookings_portfolio_start_idx on public.bookings (portfolio_id, start_at desc);
create index if not exists bookings_email_idx on public.bookings (portfolio_id, customer_email);

-- ---------------------------------------------------------------------------
-- Google Calendar connection (tokens are only reachable by the service role)
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_connections (
  portfolio_id uuid primary key references public.portfolios(id) on delete cascade,
  provider text not null default 'google' check (provider = 'google'),
  account_email text,
  calendar_id text not null default 'primary',
  sync_enabled boolean not null default true,
  last_error text,
  connected_at timestamptz not null default now()
);

create table if not exists public.calendar_connection_secrets (
  portfolio_id uuid primary key references public.portfolios(id) on delete cascade,
  refresh_token_enc text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_oauth_states (
  state text primary key,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.booking_settings enable row level security;
alter table public.booking_services enable row level security;
alter table public.booking_availability_rules enable row level security;
alter table public.booking_availability_exceptions enable row level security;
alter table public.bookings enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_connection_secrets enable row level security; -- no policies: service role only
alter table public.calendar_oauth_states enable row level security;       -- no policies: service role only

drop policy if exists "Booking settings are public" on public.booking_settings;
create policy "Booking settings are public" on public.booking_settings for select using (true);
drop policy if exists "Owners manage booking settings" on public.booking_settings;
create policy "Owners manage booking settings" on public.booking_settings for all
  using (public.owns_portfolio(portfolio_id)) with check (public.owns_portfolio(portfolio_id));

drop policy if exists "Active booking services are public" on public.booking_services;
create policy "Active booking services are public" on public.booking_services for select
  using (active or public.owns_portfolio(portfolio_id));
drop policy if exists "Owners manage booking services" on public.booking_services;
create policy "Owners manage booking services" on public.booking_services for all
  using (public.owns_portfolio(portfolio_id)) with check (public.owns_portfolio(portfolio_id));

drop policy if exists "Availability rules are public" on public.booking_availability_rules;
create policy "Availability rules are public" on public.booking_availability_rules for select using (true);
drop policy if exists "Owners manage availability rules" on public.booking_availability_rules;
create policy "Owners manage availability rules" on public.booking_availability_rules for all
  using (public.owns_portfolio(portfolio_id)) with check (public.owns_portfolio(portfolio_id));

drop policy if exists "Availability exceptions are public" on public.booking_availability_exceptions;
create policy "Availability exceptions are public" on public.booking_availability_exceptions for select using (true);
drop policy if exists "Owners manage availability exceptions" on public.booking_availability_exceptions;
create policy "Owners manage availability exceptions" on public.booking_availability_exceptions for all
  using (public.owns_portfolio(portfolio_id)) with check (public.owns_portfolio(portfolio_id));

drop policy if exists "Owners read bookings" on public.bookings;
create policy "Owners read bookings" on public.bookings for select using (public.owns_portfolio(portfolio_id));
drop policy if exists "Owners update bookings" on public.bookings;
create policy "Owners update bookings" on public.bookings for update
  using (public.owns_portfolio(portfolio_id)) with check (public.owns_portfolio(portfolio_id));

drop policy if exists "Owners read calendar connection" on public.calendar_connections;
create policy "Owners read calendar connection" on public.calendar_connections for select
  using (public.owns_portfolio(portfolio_id));
drop policy if exists "Owners update calendar connection" on public.calendar_connections;
create policy "Owners update calendar connection" on public.calendar_connections for update
  using (public.owns_portfolio(portfolio_id)) with check (public.owns_portfolio(portfolio_id));
drop policy if exists "Owners disconnect calendar" on public.calendar_connections;
create policy "Owners disconnect calendar" on public.calendar_connections for delete
  using (public.owns_portfolio(portfolio_id));

grant select on public.booking_settings, public.booking_services,
  public.booking_availability_rules, public.booking_availability_exceptions to anon, authenticated;
grant insert, update, delete on public.booking_settings, public.booking_services,
  public.booking_availability_rules, public.booking_availability_exceptions to authenticated;
grant select, update on public.bookings to authenticated;
grant select, update, delete on public.calendar_connections to authenticated;

-- ---------------------------------------------------------------------------
-- Replace the weekly schedule atomically (runs as the caller, so RLS applies)
-- ---------------------------------------------------------------------------
create or replace function public.replace_booking_rules(p_portfolio_id uuid, p_rules jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.owns_portfolio(p_portfolio_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  delete from public.booking_availability_rules where portfolio_id = p_portfolio_id;

  insert into public.booking_availability_rules (portfolio_id, weekday, start_time, end_time)
  select p_portfolio_id, (r->>'weekday')::smallint, (r->>'start_time')::time, (r->>'end_time')::time
  from jsonb_array_elements(coalesce(p_rules, '[]'::jsonb)) as r;
end;
$$;

revoke all on function public.replace_booking_rules(uuid, jsonb) from public;
grant execute on function public.replace_booking_rules(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Payment confirmation (called by the Stripe Connect webhook with the service role)
-- ---------------------------------------------------------------------------
-- Returns 'confirmed', 'already_confirmed', 'refund_needed' (slot lost after the hold expired),
-- or 'ignored' when the payment does not match a booking.
create or replace function public.complete_booking_payment(
  p_booking_id uuid,
  p_payment_intent_id text,
  p_amount_paid_cents integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if not found
     or v_booking.stripe_payment_intent_id is distinct from p_payment_intent_id
     or p_amount_paid_cents < v_booking.amount_due_cents then
    return 'ignored';
  end if;

  if v_booking.payment_status = 'paid' and v_booking.status in ('pending', 'confirmed') then
    return 'already_confirmed';
  end if;

  begin
    update public.bookings
       set status = 'confirmed',
           payment_status = 'paid',
           hold_expires_at = null,
           updated_at = now()
     where id = p_booking_id;
    return 'confirmed';
  exception when exclusion_violation then
    -- The hold expired and someone else took the slot; the caller refunds the payment.
    update public.bookings
       set status = 'cancelled', payment_status = 'paid', updated_at = now()
     where id = p_booking_id;
    return 'refund_needed';
  end;
end;
$$;

revoke all on function public.complete_booking_payment(uuid, text, integer) from public, anon, authenticated;
